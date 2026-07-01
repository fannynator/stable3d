import { describe, it, expect } from "vitest";
import { calculateLessonReward, canAfford, getAchievementReward } from "../gems";

describe("calculateLessonReward", () => {
  it("returns base 5 gems per correct answer", () => {
    expect(calculateLessonReward(3, 8)).toBe(15);
  });

  it("adds 25 perfect bonus when all answers correct", () => {
    expect(calculateLessonReward(8, 8)).toBe(8 * 5 + 25); // 65
  });

  it("returns 0 when no answers are correct", () => {
    expect(calculateLessonReward(0, 5)).toBe(0);
  });

  it("does not add bonus when there are mistakes", () => {
    expect(calculateLessonReward(7, 8)).toBe(35);
  });
});

describe("canAfford", () => {
  it("returns true when gems >= price", () => {
    expect(canAfford(100, 50)).toBe(true);
    expect(canAfford(50, 50)).toBe(true);
  });

  it("returns false when gems < price", () => {
    expect(canAfford(30, 50)).toBe(false);
  });
});

describe("getAchievementReward", () => {
  it("returns 15", () => {
    expect(getAchievementReward()).toBe(15);
  });
});
