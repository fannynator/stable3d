import { describe, it, expect } from "vitest";
import { getDifficultyLevel } from "../adaptive";
import type { PlayerSkillProgress } from "../progression";

describe("getDifficultyLevel", () => {
  it("returns 1 for undefined progress", () => {
    expect(getDifficultyLevel(undefined)).toBe(1);
  });

  it("returns 1 when fewer than 3 answers", () => {
    const p: PlayerSkillProgress = {
      skillId: "t", progress: 20, lastResults: [true, false],
      totalTimeMs: 5000,
    };
    expect(getDifficultyLevel(p)).toBe(1);
  });

  it("returns 2 for 70% accuracy", () => {
    const p: PlayerSkillProgress = {
      skillId: "t", progress: 60, lastResults: [true, true, true, false, true], // 4/5 = 80%
      totalTimeMs: 20000,
    };
    expect(getDifficultyLevel(p)).toBe(2);
  });

  it("returns 3 for 90%+ accuracy", () => {
    const p: PlayerSkillProgress = {
      skillId: "t", progress: 100, lastResults: [true, true, true, true, true],
      totalTimeMs: 20000,
    };
    expect(getDifficultyLevel(p)).toBe(3);
  });

  it("returns 1 for accuracy below 60%", () => {
    const p: PlayerSkillProgress = {
      skillId: "t", progress: 30, lastResults: [true, false, false, false, false],
      totalTimeMs: 25000,
    };
    expect(getDifficultyLevel(p)).toBe(1);
  });
});
