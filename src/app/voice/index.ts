/**
 * Cat Voice — unified TTS/STT interface.
 * Engines are swappable without touching UI components.
 *
 * Current engines:
 *   TTS: Piper TTS (Даниил) via @realtimex/piper-tts-web
 *   STT: Whisper ONNX → fallback: Web Speech API
 *
 * Usage: import { catSpeak, catListen, catStop } from "./voice"
 */

import { speak as webSpeak } from "../speech";

// ── TTS Engine interface ──
export interface TTSEngine {
  name: string;
  speak(text: string): Promise<void>;
  stop(): void;
  available(): Promise<boolean>;
}

// ── Registry ──
const ttsEngines: TTSEngine[] = [];

export function registerTTSEngine(engine: TTSEngine): void {
  ttsEngines.push(engine);
}

// ── STT Engine interface ──
export interface STTEngine {
  name: string;
  listen(): Promise<string>;
  stop(): void;
  available(): Promise<boolean>;
}

const sttEngines: STTEngine[] = [];

export function registerSTTEngine(engine: STTEngine): void {
  sttEngines.push(engine);
}

// ── Public API ──

let currentTTSEngine: TTSEngine | null = null;
let initialized = false;

export function setActiveTTSEngine(engine: TTSEngine): void {
  currentTTSEngine = engine;
}

async function initEngines(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // TTS via Vite ?worker import (Piper TTS, Даниил)
  const engine = await import("./engines/engine-kokoro");
  const ttsEngine: TTSEngine = {
    name: "Piper TTS (Ирина, русский)",
    speak: engine.speak,
    stop: () => {},
    available: async () => true,
  };
  registerTTSEngine(ttsEngine);

  // Start loading the 80MB model immediately — don't wait for first phrase
  engine.preload();

  const { whisperEngine } = await import("./engines/engine-whisper");
  registerSTTEngine(whisperEngine);

  for (const engine of ttsEngines) {
    if (await engine.available()) {
      currentTTSEngine = engine;
      console.log("[CatVoice] Using TTS:", engine.name);
      break;
    }
  }
}

/**
 * Speak text via Kokoro-82M. Falls back to Web Speech on error.
 */
export async function catSpeak(text: string): Promise<void> {
  if (!initialized) await initEngines();

  if (currentTTSEngine) {
    try {
      await currentTTSEngine.speak(text);
    } catch (err) {
      console.warn("[CatVoice] TTS failed, fallback:", err);
      await webSpeak(text);
    }
  } else {
    await webSpeak(text);
  }
}

export function catStop(): void {
  currentTTSEngine?.stop();
}

// ── Audio Cache API ──

export async function catPrefetch(id: string, text: string): Promise<void> {
  if (!initialized) await initEngines();
  const { prefetchAudio } = await import("./engines/engine-kokoro");
  await prefetchAudio(id, text);
}

export async function catSpeakCached(id: string, fallbackText: string): Promise<void> {
  if (!initialized) await initEngines();

  const { playCached } = await import("./engines/engine-kokoro");
  const played = await playCached(id);
  if (played) return;

  await catSpeak(fallbackText);
}

export function catClearCache(): void {
  import("./engines/engine-kokoro").then(m => m.clearCache()).catch(() => {});
}

export async function catListen(): Promise<string | null> {
  if (!initialized) await initEngines();

  // 1) Try Whisper (offline, neural quality)
  for (const engine of sttEngines) {
    if (await engine.available()) {
      try {
        const text = await engine.listen();
        if (text) return text;
      } catch {
        // Engine failed, try next
      }
    }
  }

  // 2) Fallback: browser SpeechRecognition
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    return new Promise((resolve) => {
      const recognition = new SpeechRecognition();
      recognition.lang = "ru-RU";
      recognition.interimResults = false;

      recognition.onresult = (event: any) => resolve(event.results[0][0].transcript);
      recognition.onerror = () => resolve(null);
      recognition.start();
      setTimeout(() => resolve(null), 6000);
    });
  }

  return null;
}
