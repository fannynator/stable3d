import { describe, it, expect } from "vitest";
import {
  recordAnswer,
  getAccuracy,
  getAverageTimeMs,
  getRecentAccuracy,
  isSpeedDemon,
  needsExtraPractice,
} from "../analytics";
import type { TopicAnalytics } from "../analytics";

describe("recordAnswer", () => {
  it("creates new analytics for first answer", () => {
    const result = recordAnswer("math_1_1_count", 2000, true, undefined);
    expect(result.topicId).toBe("math_1_1_count");
    expect(result.totalAnswered).toBe(1);
    expect(result.totalCorrect).toBe(1);
    expect(result.totalTimeMs).toBe(2000);
    expect(result.lastTenResults).toEqual([true]);
  });

  it("updates existing analytics", () => {
    const existing: TopicAnalytics = {
      topicId: "math_1_1_count",
      totalAnswered: 5,
      totalCorrect: 4,
      totalTimeMs: 10000,
      lastTenResults: [true, true, true, false, true],
    };
    const result = recordAnswer("math_1_1_count", 1500, true, existing);
    expect(result.totalAnswered).toBe(6);
    expect(result.totalCorrect).toBe(5);
    expect(result.totalTimeMs).toBe(11500);
  });

  it("keeps only last 10 results", () => {
    const existing: TopicAnalytics = {
      topicId: "test",
      totalAnswered: 10,
      totalCorrect: 10,
      totalTimeMs: 20000,
      lastTenResults: [true, true, true, true, true, true, true, true, true, true],
    };
    const result = recordAnswer("test", 1000, false, existing);
    expect(result.lastTenResults.length).toBe(10);
    expect(result.lastTenResults[0]).toBe(true); // first true shifted out
    expect(result.lastTenResults[9]).toBe(false); // new false at end
  });
});

describe("getAccuracy", () => {
  it("returns 1 for empty analytics", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 0, totalCorrect: 0, totalTimeMs: 0, lastTenResults: [],
    };
    expect(getAccuracy(a)).toBe(1);
  });

  it("computes correct ratio", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 7, totalTimeMs: 0, lastTenResults: [],
    };
    expect(getAccuracy(a)).toBe(0.7);
  });
});

describe("isSpeedDemon", () => {
  it("returns false with fewer than 10 answers", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 5, totalCorrect: 5, totalTimeMs: 5000,
      lastTenResults: [true, true, true, true, true],
    };
    expect(isSpeedDemon(a)).toBe(false);
  });

  it("returns true for fast + accurate player", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 10, totalTimeMs: 20000, // avg 2s each
      lastTenResults: [true, true, true, true, true, true, true, true, true, true],
    };
    expect(isSpeedDemon(a)).toBe(true);
  });

  it("returns false for fast but inaccurate", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 5, totalTimeMs: 20000,
      lastTenResults: [true, false, true, false, true, false, true, false, true, false],
    };
    expect(isSpeedDemon(a)).toBe(false);
  });
});

describe("needsExtraPractice", () => {
  it("returns false with fewer than 5 answers", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 3, totalCorrect: 1, totalTimeMs: 0, lastTenResults: [],
    };
    expect(needsExtraPractice(a)).toBe(false);
  });

  it("returns true when accuracy < 60%", () => {
    const a: TopicAnalytics = {
      topicId: "t", totalAnswered: 10, totalCorrect: 4, totalTimeMs: 0, lastTenResults: [],
    };
    expect(needsExtraPractice(a)).toBe(true);
  });
});
