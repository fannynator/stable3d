/**
 * AI Structured Output JSON schema for task generation.
 * This is the contract that future Gemini API (or any LLM) must follow.
 *
 * Conforms to the plan's AIStructuredTask interface.
 */

export interface AIStructuredTask {
  /** Cat's narrative intro (игровая обёртка от лица Кота) */
  catNarrative: string;
  /** The actual question text */
  question: string;
  /** Exactly 4 answer options */
  options: [string, string, string, string];
  /** Index of the correct answer (0-3) */
  correctIndex: 0 | 1 | 2 | 3;
  /** Hint from the cat (подсказка, shown after wrong answer) */
  catHint: string;
  /** Explanation of the correct answer */
  explanation: string;
  /** Difficulty level 1-5 */
  difficulty: number;
  /** Tags for categorization (grade, topic, skill) */
  tags: string[];
}

/**
 * JSON Schema for Gemini Structured Outputs.
 * Used as `response_schema` parameter in Gemini API calls.
 */
export const AI_TASK_JSON_SCHEMA = {
  type: "object",
  properties: {
    catNarrative: {
      type: "string",
      description: "Игровое вступление от лица Кота-учёного (1-2 предложения)",
    },
    question: {
      type: "string",
      description: "Текст задания (вопрос)",
    },
    options: {
      type: "array",
      description: "Ровно 4 варианта ответа",
      minItems: 4,
      maxItems: 4,
      items: { type: "string" },
    },
    correctIndex: {
      type: "integer",
      description: "Индекс правильного ответа (0-3)",
      minimum: 0,
      maximum: 3,
    },
    catHint: {
      type: "string",
      description: "Подсказка от кота (1 предложение)",
    },
    explanation: {
      type: "string",
      description: "Объяснение правильного ответа",
    },
    difficulty: {
      type: "integer",
      description: "Уровень сложности (1-5)",
      minimum: 1,
      maximum: 5,
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Теги: класс, четверть, тема",
    },
  },
  required: ["catNarrative", "question", "options", "correctIndex", "catHint", "explanation", "difficulty", "tags"],
};

/**
 * Validate that an AI-generated task matches the schema.
 * Returns validation errors, or empty array if valid.
 */
export function validateAITask(task: unknown): string[] {
  const errors: string[] = [];
  if (!task || typeof task !== "object") return ["task must be an object"];

  const t = task as Record<string, unknown>;

  if (typeof t.catNarrative !== "string") errors.push("catNarrative must be a string");
  if (typeof t.question !== "string") errors.push("question must be a string");

  if (!Array.isArray(t.options) || t.options.length !== 4) {
    errors.push("options must be an array of exactly 4 strings");
  } else {
    for (const o of t.options) {
      if (typeof o !== "string") {
        errors.push("all options must be strings");
        break;
      }
    }
  }

  if (typeof t.correctIndex !== "number" || t.correctIndex < 0 || t.correctIndex > 3) {
    errors.push("correctIndex must be a number 0-3");
  }

  if (typeof t.catHint !== "string") errors.push("catHint must be a string");
  if (typeof t.explanation !== "string") errors.push("explanation must be a string");
  if (typeof t.difficulty !== "number" || t.difficulty < 1 || t.difficulty > 5) {
    errors.push("difficulty must be 1-5");
  }

  return errors;
}
