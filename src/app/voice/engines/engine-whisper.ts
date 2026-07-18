/**
 * Whisper STT engine — local, offline speech-to-text.
 * Uses HuggingFace Transformers.js + whisper-tiny ONNX.
 *
 * Model: Xenova/whisper-tiny (~78MB)
 * Downloads ONCE from HuggingFace → cached in IndexedDB.
 * After first download: works fully offline.
 *
 * Pipeline: microphone → AudioContext → Whisper ONNX → text
 */

import type { STTEngine } from "../index";

let transcriber: any = null;
let ready = false;
let loading = false;

async function loadModel(): Promise<any> {
  if (ready) return transcriber;
  if (loading) {
    for (let i = 0; i < 100 && !ready; i++) {
      await new Promise(r => setTimeout(r, 300));
    }
    return transcriber;
  }
  loading = true;

  try {
    const { pipeline } = await import("@huggingface/transformers");
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny",
      { device: "wasm", dtype: "fp32" }
    );
    ready = true;
    console.log("[Whisper] Model loaded successfully");
    return transcriber;
  } catch (err) {
    loading = false;
    console.warn("[Whisper] Failed to load model:", err);
    throw err;
  }
}

/**
 * Record audio from microphone.
 * Returns Float32Array of audio samples at 16kHz mono.
 */
async function recordAudio(durationMs = 5000): Promise<Float32Array | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const ctx = new AudioContext({ sampleRate: 16000 });
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];

    return new Promise((resolve) => {
      source.connect(processor);
      processor.connect(ctx.destination);

      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      setTimeout(() => {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(t => t.stop());
        ctx.close();

        const totalLength = chunks.reduce((s, c) => s + c.length, 0);
        if (totalLength === 0) { resolve(null); return; }

        const audio = new Float32Array(totalLength);
        let offset = 0;
        for (const c of chunks) {
          audio.set(c, offset);
          offset += c.length;
        }
        resolve(audio);
      }, durationMs);
    });
  } catch (err) {
    console.warn("[Whisper] Microphone access denied:", err);
    return null;
  }
}

export const whisperEngine: STTEngine = {
  name: "Whisper tiny (OFFLINE)",

  async available(): Promise<boolean> {
    try {
      // Quick check: AudioContext + getUserMedia available?
      const ctx = new AudioContext();
      ctx.close();
      return !!(navigator.mediaDevices?.getUserMedia);
    } catch {
      return false;
    }
  },

  async listen(): Promise<string> {
    // 1. Record audio
    const audio = await recordAudio(5000);
    if (!audio) throw new Error("No audio captured");

    // 2. Transcribe via Whisper
    const model = await loadModel();
    if (!model) throw new Error("Whisper model not loaded");

    const result = await model(audio, {
      language: "russian",
      task: "transcribe",
    });

    return result?.text?.trim() || "";
  },

  stop(): void {
    // Audio recording auto-stops after timeout
  },
};
