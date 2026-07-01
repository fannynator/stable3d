import type { AIStructuredTask } from "./ai-schema";
import { AI_TASK_JSON_SCHEMA, validateAITask } from "./ai-schema";

/**
 * OpenRouter API client for AI-generated educational tasks.
 * Uses the free meta-llama/llama-3.3-70b-instruct model.
 *
 * OpenRouter free-tier models do not require an API key,
 * but setting one via localStorage 'openrouter_key' enables higher rate limits.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

function getApiKey(): string | null {
  try {
    return localStorage.getItem("openrouter_key") || null;
  } catch {
    return null;
  }
}

function buildPrompt(topicName: string, subject: string, difficulty: number): string {
  return `Ты — Кот-учёный, репетитор начальной школы по предмету "${subject}" в России (ФГОС).

Сгенерируй ОДНО учебное задание по теме "${topicName}" для ученика начальной школы.

Сложность: ${difficulty}/5 (1 = очень легко, 5 = олимпиадный уровень).

Ответ должен быть СТРОГО в формате JSON:
{
  "catNarrative": "игровое вступление от лица Кота-учёного (1-2 предложения на русском, доброе и мотивирующее)",
  "question": "текст вопроса",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"],
  "correctIndex": число от 0 до 3,
  "catHint": "подсказка от кота (1 предложение)",
  "explanation": "краткое объяснение правильного ответа",
  "difficulty": число от 1 до 5,
  "tags": ["${topicName}", "${subject}"]
}

Важно: варианты ответов должны быть правдоподобными, неправильные — типичные ошибки.
Правильный ответ должен быть ТОЛЬКО один.
Индекс correctIndex соответствует правильному элементу в массиве options.

Верни ТОЛЬКО JSON, без markdown-разметки, без комментариев.`;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message: string };
}

/**
 * Call OpenRouter API to generate a single educational task.
 * Returns a validated AIStructuredTask, or null on failure.
 */
export async function fetchTaskFromAI(
  topicName: string,
  subject: string,
  difficulty: number = 2
): Promise<AIStructuredTask | null> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const prompt = buildPrompt(topicName, subject, difficulty);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.warn("[OpenRouter] HTTP", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      console.warn("[OpenRouter] API error:", data.error.message);
      return null;
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[OpenRouter] Empty response");
      return null;
    }

    // Try to parse JSON from the response (strip markdown code fences if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate the task
    const errors = validateAITask(parsed);
    if (errors.length > 0) {
      console.warn("[OpenRouter] Validation errors:", errors);
      return null;
    }

    return parsed as AIStructuredTask;
  } catch (err) {
    console.warn("[OpenRouter] Network error:", err);
    return null;
  }
}
