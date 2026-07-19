import { describe, it, expect } from "vitest";
import { recordAnswer } from "../analytics";
import type { PlayerSkillProgress } from "../../fgos/progression";

describe("recordAnswer", () => {
  it("creates new progress for first answer", () => {
    const result = recordAnswer("math_add10", 2000, true, undefined);
    expect(result.skillId).toBe("math_add10");
    expect(result.progress).toBe(10);
    expect(result.totalTimeMs).toBe(2000);
    expect(result.lastResults).toEqual([true]);
  });

  it("updates existing progress — correct answer", () => {
    const existing: PlayerSkillProgress = {
      skillId: "math_add10",
      progress: 30,
      lastResults: [true, true, false],
      totalTimeMs: 6000,
    };
    const result = recordAnswer("math_add10", 1500, true, existing);
    expect(result.progress).toBe(42); // 30 + 12
    expect(result.totalTimeMs).toBe(7500);
    expect(result.lastResults.length).toBe(4);
  });

  it("updates existing progress — wrong answer (slower progress)", () => {
    const existing: PlayerSkillProgress = {
      skillId: "math_add10",
      progress: 50,
      lastResults: [true, true, true],
      totalTimeMs: 9000,
    };
    const result = recordAnswer("math_add10", 2000, false, existing);
    expect(result.progress).toBe(54); // 50 + 4
  });

  it("keeps only last 10 results", () => {
    const existing: PlayerSkillProgress = {
      skillId: "test",
      progress: 90,
      lastResults: [true, true, true, true, true, true, true, true, true, true],
      totalTimeMs: 20000,
    };
    const result = recordAnswer("test", 1000, false, existing);
    expect(result.lastResults.length).toBe(10);
    expect(result.lastResults[9]).toBe(false);
  });

  it("caps progress at 100", () => {
    const existing: PlayerSkillProgress = {
      skillId: "test",
      progress: 95,
      lastResults: [true, true, true],
      totalTimeMs: 6000,
    };
    const result = recordAnswer("test", 1000, true, existing);
    expect(result.progress).toBe(100);
  });
});
