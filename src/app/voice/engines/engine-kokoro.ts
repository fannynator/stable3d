import TTSWorker from './kokoro-worker.ts?worker';

let worker: Worker | null = null;

function getWorker() {
  if (!worker) {
    worker = new TTSWorker({ type: "module" });
    console.log("%c[TTS Engine] Worker created", "color: #9c27b0; font-weight: bold;");

    worker.onerror = (event: ErrorEvent) => {
      console.error("[TTS Engine] CRITICAL: Worker script failed:", event.message, event.filename, event.lineno);
    };
    worker.onmessageerror = (event: MessageEvent) => {
      console.error("[TTS Engine] Worker messageerror:", event);
    };
  }
  return worker;
}

let audioCtx: AudioContext | null = null;
let isModelLoading = false;
type QueueItem = { text: string; resolve: () => void; reject: (err: Error) => void };
const textQueue: QueueItem[] = [];

// ── Audio Cache ──
const audioCache = new Map<string, { url: string; blob: Blob }>();
const prefetchInFlight = new Map<string, Promise<void>>();

export function clearCache(): void {
  for (const { url } of audioCache.values()) URL.revokeObjectURL(url);
  audioCache.clear();
  prefetchInFlight.clear();
}

export function prefetchAudio(id: string, text: string): Promise<void> {
  if (audioCache.has(id)) return Promise.resolve();
  if (prefetchInFlight.has(id)) return prefetchInFlight.get(id)!;

  const w = getWorker();
  console.log("[TTS Cache] Prefetch:", id, text.substring(0, 30));

  const promise = new Promise<void>((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const { type, audioData } = event.data;
      if (type === "LOG") return;

      if (type === "WAV_READY") {
        w.removeEventListener("message", handler);
        const blob = new Blob([audioData], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        audioCache.set(id, { url, blob });
        prefetchInFlight.delete(id);
        console.log("[TTS Cache] Stored:", id, `${(blob.size / 1024).toFixed(1)}KB`);
        resolve();
      }
      if (type === "ERROR") {
        w.removeEventListener("message", handler);
        prefetchInFlight.delete(id);
        reject(new Error(event.data.error));
      }
    };
    w.addEventListener("message", handler);
    w.postMessage({ type: "GENERATE", text, wantWav: true });
  });

  prefetchInFlight.set(id, promise);
  return promise;
}

export async function playCached(id: string): Promise<boolean> {
  const cached = audioCache.get(id);
  if (cached) {
    console.log("[TTS Cache] ▶ playing:", id);
    const audio = new Audio(cached.url);
    audio.playbackRate = 1.15;
    audio.preservesPitch = false;
    return new Promise<boolean>((resolve) => {
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play();
    });
  }

  if (prefetchInFlight.has(id)) {
    console.log("[TTS Cache] waiting for prefetch:", id);
    await prefetchInFlight.get(id)!;
    return playCached(id);
  }

  return false;
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

async function playRawAudio(buffer: ArrayBuffer, sampleRate: number) {
  const ctx = getAudioContext();
  console.log("[🎵 PlayAudio] AudioContext state:", ctx.state);

  if (ctx.state !== "running") {
    console.log("[🎵 PlayAudio] AudioContext suspended, resuming...");
    await ctx.resume();
    console.log("[🎵 PlayAudio] AudioContext state after resume:", ctx.state);
  }

  if (ctx.state !== "running") {
    console.warn("[🎵 PlayAudio] AudioContext failed to resume, state:", ctx.state);
    return;
  }

  const numFloats = buffer.byteLength / 4;
  if (numFloats === 0) {
    console.warn("[🎵 PlayAudio] Empty audio buffer, skipping");
    return;
  }

  console.log("[🎵 PlayAudio] Creating buffer:", numFloats, "samples, rate:", sampleRate);
  const audioBuffer = ctx.createBuffer(1, numFloats, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const floatView = new Float32Array(buffer);

  console.log("[🎵 PlayAudio] Срез первых сэмплов звука:", Array.from(floatView.slice(0, 5)));

  // Если значения за пределами [-1.1, 1.1] — это Int16, нужна нормализация
  if (floatView.length > 0 && (floatView[0] > 1.1 || floatView[0] < -1.1)) {
    console.log("[🎵 PlayAudio] Обнаружены данные Int16, нормализуем под Float32...");
    const intView = new Int16Array(buffer);
    for (let i = 0; i < intView.length; i++) {
      channelData[i] = intView[i] / 32768.0;
    }
  } else {
    channelData.set(floatView);
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start();
  console.log("[🎵 PlayAudio] Звук отправлен в динамики!");
}

export function preload(): void {
  const w = getWorker();
  console.log("[TTS Engine] Preloading model...");
  w.postMessage({ type: "PRELOAD" });
}

function flushQueue() {
  const next = textQueue.shift();
  if (!next) {
    isModelLoading = false;
    return;
  }
  speakInternal(next.text).then(next.resolve).catch(next.reject);
}

function splitSentences(text: string): string[] {
  // Очищаем эмодзи и суррогатные пары — токенизатор их не понимает
  const cleaned = text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{FE0F}]/gu,
    ""
  );

  const sentences: string[] = [];
  let current = "";
  for (const ch of cleaned) {
    current += ch;
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      const s = current.trim();
      if (s && !/^\s*$/.test(s)) sentences.push(s);
      current = "";
    }
  }
  const tail = current.trim();
  if (tail && !/^\s*$/.test(tail)) sentences.push(tail);
  return sentences;
}

function requestAudio(w: Worker, text: string): Promise<{ buffer: ArrayBuffer; sr: number }> {
  return new Promise((resolve, reject) => {
    const handler = async (event: MessageEvent) => {
      const { type, audioData, error, message, sampleRate } = event.data;

      if (type === "LOG") {
        console.log(`%c[Worker Inside] ${message}`, "color: #00bcd4; font-weight: bold;");
        return;
      }

      if (type === "SUCCESS") {
        w.removeEventListener("message", handler);
        resolve({ buffer: audioData, sr: sampleRate ?? 22050 });
        return;
      }

      if (type === "ERROR") {
        w.removeEventListener("message", handler);
        reject(new Error(error));
      }
    };
    w.addEventListener("message", handler);
    w.postMessage({ type: "GENERATE", text });
  });
}

async function playAndWait(buffer: ArrayBuffer, sr: number): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  if (ctx.state !== "running") return;

  const numFloats = buffer.byteLength / 4;
  if (numFloats === 0) return;

  console.log("[🎵 PlayAudio] Playing:", numFloats, "samples, rate:", sr);
  const audioBuffer = ctx.createBuffer(1, numFloats, sr);
  const channelData = audioBuffer.getChannelData(0);
  const floatView = new Float32Array(buffer);

  if (floatView.length > 0 && (floatView[0] > 1.1 || floatView[0] < -1.1)) {
    const intView = new Int16Array(buffer);
    for (let i = 0; i < intView.length; i++) {
      channelData[i] = intView[i] / 32768.0;
    }
  } else {
    channelData.set(floatView);
  }

  return new Promise<void>((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      console.log("[🎵 PlayAudio] Done");
      resolve();
    };
    source.playbackRate.value = 1.15;
    source.start();
  });
}

async function speakInternal(text: string): Promise<void> {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return;

  console.log("[TTS Engine] speakInternal():", sentences.length, "sentences");

  const w = getWorker();
  const ctx = getAudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  // Pipelining: send sentence N, play it while generating N+1 in background
  let pendingAudio = requestAudio(w, sentences[0]);

  for (let i = 0; i < sentences.length; i++) {
    console.log(`[TTS Engine] ▶ sentence ${i + 1}/${sentences.length}`);

    // Wait for current sentence's audio (this might already be ready)
    const { buffer, sr } = await pendingAudio;

    // Fire off NEXT sentence generation BEFORE we start playing current
    if (i + 1 < sentences.length) {
      pendingAudio = requestAudio(w, sentences[i + 1]);
    }

    // Play current sentence and wait for it to finish
    await playAndWait(buffer, sr);
  }

  w.removeEventListener("message", () => {});
  flushQueue();
}

export async function speak(text: string): Promise<void> {
  console.log("[TTS Engine] speak() called, text:", text.substring(0, 50));

  if (isModelLoading) {
    console.log("[TTS Engine] Модель ещё загружается, ставим в очередь:", text.substring(0, 30));
    return new Promise((resolve, reject) => {
      textQueue.push({ text, resolve, reject });
    });
  }

  isModelLoading = true;
  return speakInternal(text);
}
