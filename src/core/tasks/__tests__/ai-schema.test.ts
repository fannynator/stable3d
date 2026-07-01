import { describe, it, expect } from "vitest";
import { validateAITask } from "../ai-schema";
import type { AIStructuredTask } from "../ai-schema";

describe("validateAITask", () => {
  const validTask: AIStructuredTask = {
    catNarrative: "Мур! Реши задачку!",
    question: "Сколько будет 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    catHint: "Подумай о двух парах!",
    explanation: "2 + 2 = 4",
    difficulty: 2,
    tags: ["сложение", "1 класс"],
  };

  it("accepts valid task", () => {
    expect(validateAITask(validTask)).toEqual([]);
  });

  it("rejects missing catNarrative", () => {
    const t = { ...validTask, catNarrative: undefined };
    const errors = validateAITask(t);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects options with wrong length", () => {
    const t = { ...validTask, options: ["a", "b"] };
    const errors = validateAITask(t);
    expect(errors.some((e) => e.includes("options"))).toBe(true);
  });

  it("rejects invalid correctIndex", () => {
    const t = { ...validTask, correctIndex: 5 };
    const errors = validateAITask(t);
    expect(errors.some((e) => e.includes("correctIndex"))).toBe(true);
  });

  it("rejects null task", () => {
    const errors = validateAITask(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects non-object task", () => {
    const errors = validateAITask("not an object");
    expect(errors.length).toBeGreaterThan(0);
  });
});
