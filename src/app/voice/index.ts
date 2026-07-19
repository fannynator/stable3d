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

// Strip all emoji and special symbols before TTS — tokenizers choke on them.
// Covers BMP (U+2000–U+27FF), supplemental planes (U+1F000–U+1FAFF, U+E0000+),
// plus flags, ZWJ sequences, and variation selectors.
const RE_EMOJI =
  /[\u{200D}\u{20E3}\u{FE00}-\u{FE0F}\u{2000}-\u{206F}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2900}-\u{297F}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FAFF}\u{E0000}-\u{E007F}]/gu;

function stripEmoji(text: string): string {
  return text.replace(RE_EMOJI, "").replace(/\s{2,}/g, " ").trim();
}

// Piper TTS (Russian voice) reads math symbols in English context.
// Convert them to spoken Russian words before sending to TTS.
function normalizeForSpeech(text: string): string {
  return text
    .replace(/−/g, " минус ")       // U+2212 MINUS SIGN
    .replace(/–/g, " минус ")       // en-dash (some inputs use this)
    .replace(/—/g, " минус ")       // em-dash
    .replace(/\b-\b/g, " минус ")   // ASCII hyphen between word boundaries
    .replace(/\+/g, " плюс ")
    .replace(/×/g, " умножить на ")
    .replace(/÷/g, " разделить на ")
    .replace(/=/g, " равно ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Speak text via Piper TTS. Falls back to Web Speech on error.
 */
export async function catSpeak(text: string): Promise<void> {
  if (!initialized) await initEngines();

  const clean = normalizeForSpeech(stripEmoji(text));
  if (!clean) return;

  if (currentTTSEngine) {
    try {
      await currentTTSEngine.speak(clean);
    } catch (err) {
      console.warn("[CatVoice] TTS failed, fallback:", err);
      await webSpeak(clean);
    }
  } else {
    await webSpeak(clean);
  }
}

export function catStop(): void {
  currentTTSEngine?.stop();
}

// ── Audio Cache API ──

export async function catPrefetch(id: string, text: string): Promise<void> {
  if (!initialized) await initEngines();
  const clean = normalizeForSpeech(stripEmoji(text));
  if (!clean) return;
  const { prefetchAudio } = await import("./engines/engine-kokoro");
  await prefetchAudio(id, clean);
}

export async function catSpeakCached(id: string, fallbackText: string): Promise<void> {
  if (!initialized) await initEngines();

  const { playCached } = await import("./engines/engine-kokoro");
  const played = await playCached(id);
  if (played) return;

  await catSpeak(fallbackText); // stripEmoji happens inside catSpeak
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
