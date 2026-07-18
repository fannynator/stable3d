import { predict, download } from "@realtimex/piper-tts-web";
import * as ort from "onnxruntime-web";

// Принудительно CPU (WASM) — убираем конфликт GPU с Three.js WebGL
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
// Web Worker не имеет доступа к WebGL, WebGPU отключаем явно
ort.env.webgpu = undefined as any;

const VOICE_ID = "ru_RU-irina-medium";

const logToUI = (msg: string) => self.postMessage({ type: "LOG", message: msg });

logToUI("Piper TTS worker (Ирина)");

let loadPromise: Promise<void> | null = null;
let modelReady = false;

self.addEventListener("error", (event) => {
  logToUI("Unhandled error: " + event.message + " at " + event.filename + ":" + event.lineno);
});
self.addEventListener("unhandledrejection", (event) => {
  logToUI("Unhandled rejection: " + String(event.reason));
});

async function ensureModel(): Promise<void> {
  if (modelReady) return;
  if (loadPromise) return loadPromise;

  logToUI(`Загружаем голос ${VOICE_ID}...`);
  loadPromise = download(VOICE_ID, (progress) => {
    const pct = Math.round((progress.loaded * 100) / progress.total);
    logToUI(`Скачивание: ${pct}%`);
  })
    .then(() => {
      modelReady = true;
      loadPromise = null;
      logToUI(`Голос ${VOICE_ID} загружен и готов!`);
    })
    .catch((e) => {
      loadPromise = null;
      throw e;
    });

  return loadPromise;
}

function wavToFloat32(arrayBuffer: ArrayBuffer): { buffer: ArrayBuffer; sampleRate: number } {
  const view = new DataView(arrayBuffer);

  // Проверяем WAV-заголовок
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== "RIFF") throw new Error("Not a valid WAV file");

  const sampleRate = view.getUint32(24, true);

  // Ищем PCM-данные (после 44-байтового заголовка)
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
      await ensureModel();
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
      await ensureModel();
      const wav = await predict({ text, voiceId: VOICE_ID });
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
