/**
 * DeepSeek API client — primary cloud AI engine for paid subscription.
 * Model: deepseek-chat (V3, 671B MoE) — top-tier reasoning, excellent Russian.
 *
 * API key: stored in localStorage 'deepseek_key'.
 * Endpoint: https://api.deepseek.com/v1/chat/completions
 * Pricing: ~$0.14/1M input tokens, ~$0.28/1M output tokens
 * Context caching: built-in disk cache, prefix-aware.
 */

import type { AIStructuredTask } from "./ai-schema";
import { AI_TASK_JSON_SCHEMA, validateAITask } from "./ai-schema";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash"; // DeepSeek-V4-Flash. Старые deepseek-chat / deepseek-reasoner отключены с 24.07.2026
const FETCH_TIMEOUT_MS = 12000;

function getApiKey(): string | null {
  // Priority: .env (development) → localStorage (user override)
  const envKey = import.meta.env.VITE_DEEPSEEK_KEY;
  if (envKey) return envKey;
  try {
    return localStorage.getItem("deepseek_key") || null;
  } catch {
    return null;
  }
}

function buildPrompt(topicName: string, subject: string, difficulty: number): string {
  return `Ты — весёлый Кот-учёный из детской игры, репетитор начальной школы по предмету "${subject}" в России (ФГОС). Пиши реплики эмоционально — используй восклицания (!), междометия (Ого!, Ой!, Мур!), многоточия для пауз и яркие образы (не "5 конфет", а "целых 5 вкусных конфет!").

Сгенерируй ОДНО учебное задание по теме "${topicName}" для ученика начальной школы.

Сложность: ${difficulty}/5 (1 = очень легко, 5 = олимпиадный уровень).

Ответ должен быть СТРОГО в формате JSON:
{
  "catNarrative": "игровое вступление от лица Кота-учёного (1-2 предложения, используй !, междометия и яркие образы)",
  "question": "текст вопроса",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"],
  "correctIndex": число от 0 до 3,
  "catHint": "игривая подсказка от кота с эмоцией и междометием",
  "explanation": "эмоциональное объяснение правильного ответа с восклицанием",
  "difficulty": число от 1 до 5,
  "tags": ["${topicName}", "${subject}"]
}

Важно: варианты ответов должны быть правдоподобными, неправильные — типичные ошибки.
Правильный ответ должен быть ТОЛЬКО один.

Верни ТОЛЬКО JSON, без markdown-разметки, без комментариев.`;
}

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message: string };
}

/**
 * Call DeepSeek API to generate a single educational task.
 */
export async function fetchTaskFromDeepSeek(
  topicName: string,
  subject: string,
  difficulty: number = 2,
  signal?: AbortSignal
): Promise<AIStructuredTask | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[DeepSeek] No API key configured");
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  const prompt = buildPrompt(topicName, subject, difficulty);

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers,
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.warn("[DeepSeek] HTTP", response.status);
      return null;
    }

    const data: DeepSeekResponse = await response.json();

    if (data.error) {
      console.warn("[DeepSeek] API error:", data.error.message);
      return null;
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[DeepSeek] Empty response");
      return null;
    }

    console.log("[DeepSeek] Response (first 300 chars):", content.slice(0, 300));

    let jsonStr = content.trim();
    // Strip markdown code fences
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    // Try direct parse first
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: extract JSON object from response (DeepSeek sometimes wraps in text)
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("[DeepSeek] No JSON found in response:", jsonStr.slice(0, 200));
        return null;
      }
    }

    const errors = validateAITask(parsed);
    if (errors.length > 0) {
      console.warn("[DeepSeek] Validation errors:", errors);
      return null;
    }

    return parsed as AIStructuredTask;
  } catch (err) {
    console.warn("[DeepSeek] Error:", err instanceof Error ? err.message : err);
    return null;
  }
}
