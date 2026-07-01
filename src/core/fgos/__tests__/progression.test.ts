import { describe, it, expect } from "vitest";
import { MATH_CURRICULUM } from "../math-grades";
import { RUSSIAN_CURRICULUM } from "../russian-grades";
import {
  flattenTopics,
  getTopicById,
  getUnlockedTopics,
  getNextTopic,
  isChapterGated,
  getChapterGates,
  getObstaclesForGrade,
  getTopicGrade,
  getTopicQuarter,
  getGradeProgress,
} from "../progression";

const math = MATH_CURRICULUM;
const rus = RUSSIAN_CURRICULUM;

describe("flattenTopics", () => {
  it("flattens math curriculum to flat array", () => {
    const topics = flattenTopics(math);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.length).toBe(16); // 4 grades × 4 quarters
  });

  it("all topics have unique IDs", () => {
    const topics = flattenTopics(math);
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getTopicById", () => {
  it("finds existing topic", () => {
    const topic = getTopicById(math, "math_1_1_count");
    expect(topic).toBeDefined();
    expect(topic!.name).toBe("Числа от 1 до 10. Счёт");
  });

  it("returns undefined for unknown topic", () => {
    expect(getTopicById(math, "nonexistent")).toBeUndefined();
  });
});

describe("getUnlockedTopics", () => {
  it("returns first topic when no topics completed", () => {
    const unlocked = getUnlockedTopics(math, new Set());
    expect(unlocked.length).toBe(1);
    expect(unlocked[0].id).toBe("math_1_1_count");
  });

  it("returns next topic after first completed", () => {
    const completed = new Set(["math_1_1_count"]);
    const unlocked = getUnlockedTopics(math, completed);
    expect(unlocked.length).toBe(1);
    expect(unlocked[0].id).toBe("math_1_2_add_sub");
  });

  it("does not include already completed topics", () => {
    const completed = new Set(["math_1_1_count", "math_1_2_add_sub", "math_1_3_add_sub_20"]);
    const unlocked = getUnlockedTopics(math, completed);
    const ids = unlocked.map((t) => t.id);
    expect(ids).not.toContain("math_1_1_count");
    expect(ids).not.toContain("math_1_2_add_sub");
  });
});

describe("getNextTopic", () => {
  it("returns first topic when none completed", () => {
    const next = getNextTopic(math, new Set());
    expect(next).toBeDefined();
    expect(next!.id).toBe("math_1_1_count");
  });

  it("returns undefined when all done", () => {
    const allIds = new Set(flattenTopics(math).map((t) => t.id));
    expect(getNextTopic(math, allIds)).toBeUndefined();
  });
});

describe("isChapterGated / getChapterGates", () => {
  it("math chapter is gated when 1st grade not done", () => {
    expect(isChapterGated(math, "math", new Set())).toBe(true);
  });

  it("math chapter is unlocked when all gates completed", () => {
    const completed = new Set(["math_1_4_review"]);
    expect(isChapterGated(math, "math", completed)).toBe(false);
  });

  it("getChapterGates returns required topic IDs", () => {
    const gates = getChapterGates(math, "math", new Set());
    expect(gates).toContain("math_1_4_review");
  });

  it("math2 chapter is gated", () => {
    expect(isChapterGated(math, "math2", new Set())).toBe(true);
    expect(getChapterGates(math, "math2", new Set())).toContain("math_2_4_eq_intro");
  });
});

describe("getObstaclesForGrade", () => {
  it("returns obstacles even with no progress", () => {
    const obstacles = getObstaclesForGrade(math, new Set());
    expect(obstacles.length).toBeGreaterThan(0);
  });

  it("returns obstacles sorted by difficulty", () => {
    const obstacles = getObstaclesForGrade(math, new Set());
    for (let i = 1; i < obstacles.length; i++) {
      expect(obstacles[i].difficulty).toBeGreaterThanOrEqual(obstacles[i - 1].difficulty);
    }
  });
});

describe("getTopicGrade / getTopicQuarter", () => {
  it("returns correct grade for first topic", () => {
    expect(getTopicGrade(math, "math_1_1_count")).toBe("1 класс");
  });

  it("returns correct grade for 4th grade topic", () => {
    expect(getTopicGrade(math, "math_4_3_fractions")).toBe("4 класс");
  });

  it("returns correct quarter", () => {
    expect(getTopicQuarter(math, "math_1_1_count")).toBe("I четверть");
    expect(getTopicQuarter(rus, "rus_1_2_zhishi")).toBe("II четверть");
  });
});

describe("getGradeProgress", () => {
  it("returns 0% with no progress", () => {
    expect(getGradeProgress(math, new Set())).toBe(0);
  });

  it("returns 100% when all done", () => {
    const allIds = new Set(flattenTopics(math).map((t) => t.id));
    expect(getGradeProgress(math, allIds)).toBe(100);
  });

  it("returns ~6% for first topic (1 of 16)", () => {
    const completed = new Set(["math_1_1_count"]);
    expect(getGradeProgress(math, completed)).toBe(6); // 1/16 ≈ 6.25 → 6
  });
});
