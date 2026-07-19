import { describe, test, expect } from "bun:test";
import { MATH_SKILLS } from "../math-grades";
import { RUSSIAN_SKILLS } from "../russian-grades";
import {
  getUnlockedSkills,
  isSkillCompleted,
  skillsByGrade,
  getGradeProgress,
  isChapterGated,
} from "../progression";
import type { PlayerSkillProgress } from "../progression";

const math = MATH_SKILLS;
const rus = RUSSIAN_SKILLS;

describe("skillsByGrade", () => {
  test("groups math skills by grade", () => {
    const grade1 = skillsByGrade(math, 1);
    const grade2 = skillsByGrade(math, 2);
    const grade3 = skillsByGrade(math, 3);
    const grade4 = skillsByGrade(math, 4);
    expect(grade1.every(s => s.grade === 1)).toBe(true);
    expect(grade2.every(s => s.grade === 2)).toBe(true);
    expect(grade3.every(s => s.grade === 3)).toBe(true);
    expect(grade4.every(s => s.grade === 4)).toBe(true);
  });
});

describe("getUnlockedSkills", () => {
  test("all grade 1 skills unlocked initially", () => {
    const unlocked = getUnlockedSkills(math, new Set());
    const grade1Ids = skillsByGrade(math, 1).map(s => s.id);
    for (const s of unlocked) {
      if (grade1Ids.includes(s.id)) expect(true).toBe(true);
    }
  });

  test("no grade 2+ skills unlocked without completing grade 1", () => {
    const unlocked = getUnlockedSkills(math, new Set());
    const grade2Plus = unlocked.filter(s => s.grade > 1);
    expect(grade2Plus.length).toBe(0);
  });

  test("completed skills not in unlocked list", () => {
    const id = math[0].id;
    const unlocked = getUnlockedSkills(math, new Set([id]));
    expect(unlocked.find(s => s.id === id)).toBeUndefined();
  });
});

describe("getGradeProgress", () => {
  test("0% with no completions", () => {
    expect(getGradeProgress(math, new Set(), 1)).toBe(0);
  });

  test("100% when all skills done", () => {
    const all = skillsByGrade(math, 1).map(s => s.id);
    expect(getGradeProgress(math, new Set(all), 1)).toBe(100);
  });
});

describe("isChapterGated", () => {
  test("chapter not gated if gate skills completed", () => {
    // Find skills that gate chapters
    const gates = math.filter(s => s.gatesChapterIds.length > 0);
    if (gates.length > 0) {
      const gate = gates[0];
      const gated = isChapterGated(math, gate.gatesChapterIds[0], new Set());
      expect(gated).toBe(true);
      const notGated = isChapterGated(math, gate.gatesChapterIds[0], new Set([gate.id]));
      expect(notGated).toBe(false);
    }
  });
});
