/**
 * Local Llama 3.2 ONNX engine — runs on-device for trial/offline mode.
 * Model: onnx-community/Llama-3.2-1B-Instruct (ONNX, ~1.5GB Q4)
 * Downloads ONCE from HuggingFace → cached in IndexedDB.
 *
 * Note: 1B model chosen over 3B for mobile performance.
 * 3B model would require ~6GB RAM and >30s per token on mobile CPU.
 * 1B model runs ~2-5s per response on modern phones.
 *
 * Uses: @huggingface/transformers (already installed)
 */

import type { AIStructuredTask } from "./ai-schema";
import { validateAITask } from "./ai-schema";

const MODEL_ID = "onnx-community/Llama-3.2-1B-Instruct";

let generator: any = null;
let ready = false;
let loading = false;

async function loadModel(): Promise<any> {
  if (ready) return generator;
  if (loading) {
    for (let i = 0; i < 120 && !ready; i++) {
      await new Promise(r => setTimeout(r, 500));
    }
    return generator;
  }
  loading = true;

  try {
    const { pipeline } = await import("@huggingface/transformers");
    generator = await pipeline(
      "text-generation",
      MODEL_ID,
      {
        device: "wasm",
        dtype: "q4",
      }
    );
    ready = true;
    console.log("[Llama] Local model loaded successfully");
    return generator;
  } catch (err) {
    loading = false;
    console.warn("[Llama] Failed to load:", err);
    throw err;
  }
}

function buildPrompt(topicName: string, subject: string, difficulty: number): string {
  return `<|system|>
Ты — весёлый Кот-учёный из детской игры, репетитор по "${subject}". Используй "мур", "мяу", восклицания (!), междометия (Ого!, Ой!, Хм...) и яркие образы.

Сгенерируй ОДНО учебное задание по теме "${topicName}", сложность ${difficulty}/5.

Ответ ВСЕГДА в JSON:
{"catNarrative":"игровое вступление с ! и междометиями","question":"...","options":["A","B","C","D"],"correctIndex":0-3,"catHint":"игривая подсказка","explanation":"эмоциональное объяснение","difficulty":${difficulty},"tags":["${topicName}","${subject}"]}

Только JSON, ничего больше.
<|assistant|>
{</|assistant|>`;
}

/**
 * Generate a task using local Llama 3.2 1B.
 */
export async function fetchTaskFromLlama(
  topicName: string,
  subject: string,
  difficulty: number = 2,
  signal?: AbortSignal
): Promise<AIStructuredTask | null> {
  // Check abort signal
  if (signal?.aborted) return null;

  try {
    const model = await loadModel();
    if (!model) return null;

    const prompt = buildPrompt(topicName, subject, difficulty);
    const result = await model(prompt, {
      max_new_tokens: 300,
      temperature: 0.7,
      do_sample: true,
    });

    const text = result?.[0]?.generated_text || "";
    // Extract JSON from model output
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[Llama] No JSON found in output");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const errors = validateAITask(parsed);
    if (errors.length > 0) {
      console.warn("[Llama] Validation errors:", errors);
      return null;
    }

    return parsed as AIStructuredTask;
  } catch (err) {
    console.warn("[Llama] Error:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Quick check if local Llama is available (cached).
 */
export async function isLlamaAvailable(): Promise<boolean> {
  try {
    await loadModel();
    return true;
  } catch {
    return false;
  }
}
