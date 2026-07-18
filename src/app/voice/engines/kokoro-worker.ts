import { TtsSession, download } from "@realtimex/piper-tts-web";

const VOICE_ID = "ru_RU-irina-medium";

const WASM_PATHS = {
  onnxWasm: "/wasm/",
  piperData: "/wasm/piper_phonemize.data",
  piperWasm: "/wasm/piper_phonemize.wasm",
};

const logToUI = (msg: string) => self.postMessage({ type: "LOG", message: msg });

logToUI("Piper TTS worker (Ирина) — локальные WASM");

let session: TtsSession | null = null;

self.addEventListener("error", (event) => {
  logToUI("Unhandled error: " + event.message + " at " + event.filename + ":" + event.lineno);
});
self.addEventListener("unhandledrejection", (event) => {
  logToUI("Unhandled rejection: " + String(event.reason));
});

async function ensureSession(): Promise<TtsSession> {
  if (session?.ready) return session;

  logToUI(`Загружаем голос ${VOICE_ID}...`);
  session = await TtsSession.create({
    voiceId: VOICE_ID,
    progress: (p) => {
      const pct = Math.round((p.loaded * 100) / p.total);
      logToUI(`Скачивание: ${pct}%`);
    },
    wasmPaths: WASM_PATHS,
    allowLocalModels: true,
    fallbackStrategy: "auto",
  });
  await session.init();
  logToUI(`Голос ${VOICE_ID} загружен и готов!`);
  return session;
}

function wavToFloat32(arrayBuffer: ArrayBuffer): { buffer: ArrayBuffer; sampleRate: number } {
  const view = new DataView(arrayBuffer);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== "RIFF") throw new Error("Not a valid WAV file");

  const sampleRate = view.getUint32(24, true);
  const pcmOffset = 44;
  const pcmData = new Int16Array(arrayBuffer.slice(pcmOffset));
  const floatData = new Float32Array(pcmData.length);

  for (let i = 0; i < pcmData.length; i++) {
    floatData[i] = pcmData[i] / 32768.0;
  }

  return { buffer: floatData.buffer, sampleRate };
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, text } = event.data;

  if (type === "PRELOAD") {
    logToUI("Предзагрузка голоса Ирины...");
    try {
      await ensureSession();
    } catch (e: any) {
      logToUI("Ошибка предзагрузки: " + (e.message || String(e)));
    }
    return;
  }

  if (type === "GENERATE") {
    if (!text || text.trim() === "") return;
    const wantWav: boolean = event.data.wantWav ?? false;

    logToUI(`Генерация речи: "${text.substring(0, 60)}"${wantWav ? " [WAV-кэш]" : ""}`);
    try {
      const s = await ensureSession();
      const wav = await s.predict(text);
      const wavBuffer = await wav.arrayBuffer();

      if (wantWav) {
        logToUI(`WAV готов: ${(wavBuffer.byteLength / 1024).toFixed(1)}KB`);
        self.postMessage(
          { type: "WAV_READY", audioData: wavBuffer },
          [wavBuffer]
        );
      } else {
        const { buffer, sampleRate } = wavToFloat32(wavBuffer);
        logToUI(`Аудио готово: ${buffer.byteLength / 4} сэмплов, ${sampleRate}Hz`);
        self.postMessage(
          { type: "SUCCESS", audioData: buffer, sampleRate },
          [buffer]
        );
      }
    } catch (error: any) {
      logToUI("ERROR: " + (error.message || String(error)));
      self.postMessage({ type: "ERROR", error: error.message || String(error) });
    }
  }
});
