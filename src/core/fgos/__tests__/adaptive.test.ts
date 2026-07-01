import { describe, it, expect } from "vitest";
import { getDifficultyMode } from "../adaptive";
import type { TopicAnalytics } from "../../player/analytics";

describe("getDifficultyMode", () => {
  it("returns standard for undefined analytics", () => {
    expect(getDifficultyMode(undefined)).toBe("standard");
  });

  it("returns standard for normal player", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 7, totalTimeMs: 50000, // avg 5s
      lastTenResults: [true, false, true, true, false, true, true, false, true, true],
    };
    expect(getDifficultyMode(a)).toBe("standard");
  });

  it("returns remedial for struggling player", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 3, totalTimeMs: 50000,
      lastTenResults: [false, false, true, false, false, true, false, false, false, true],
    };
    expect(getDifficultyMode(a)).toBe("remedial");
  });

  it("returns olympiad for gifted player", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 10, totalTimeMs: 20000, // avg 2s
      lastTenResults: [true, true, true, true, true, true, true, true, true, true],
    };
    expect(getDifficultyMode(a)).toBe("olympiad");
  });
});
