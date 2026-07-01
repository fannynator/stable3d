import { describe, it, expect } from "vitest";
import { evaluateAchievements, getNewlyUnlocked } from "../achievements";
import type { Achievement, Trap } from "../../../app/types";

const trap = (overrides: Partial<Trap> = {}): Trap => ({
  id: "t1",
  question: "2+2= ?",
  options: [2, 3, 4, 5],
  correct: 4,
  answer: null,
  explanation: "2+2=4",
  source: "add",
  defuses: 0,
  nextDate: "",
  isInput: false,
  subject: "math",
  ...overrides,
});

const ach = (name: string, unlocked: boolean = false): Achievement => ({
  name,
  desc: "",
  unlocked,
});

describe("evaluateAchievements", () => {
  it("unlocks none with no progress", () => {
    const result = evaluateAchievements({
      storiesCompleted: {},
      traps: [],
      totalPets: 0,
    });
    expect(result.detective).toBe(false);
    expect(result.sherlock).toBe(false);
    expect(result.saper).toBe(false);
  });

  it("unlocks detective after 1 story", () => {
    const result = evaluateAchievements({
      storiesCompleted: { math: true },
      traps: [],
      totalPets: 0,
    });
    expect(result.detective).toBe(true);
    expect(result.sherlock).toBe(false);
  });

  it("unlocks sherlock after 2 stories", () => {
    const result = evaluateAchievements({
      storiesCompleted: { math: true, rus1: true },
      traps: [],
      totalPets: 0,
    });
    expect(result.detective).toBe(true);
    expect(result.sherlock).toBe(true);
  });

  it("unlocks holmes after 3 stories", () => {
    const result = evaluateAchievements({
      storiesCompleted: { math: true, rus1: true, rus2: true },
      traps: [],
      totalPets: 0,
    });
    expect(result.holmes).toBe(true);
  });

  it("unlocks saper after 1 defuse", () => {
    const result = evaluateAchievements({
      storiesCompleted: {},
      traps: [trap({ defuses: 1 })],
      totalPets: 0,
    });
    expect(result.saper).toBe(true);
  });

  it("unlocks hunter after 3 defuses", () => {
    const result = evaluateAchievements({
      storiesCompleted: {},
      traps: [trap({ defuses: 2 }), trap({ defuses: 1 })],
      totalPets: 0,
    });
    expect(result.hunter).toBe(true);
  });

  it("unlocks murmur after 10 pets", () => {
    const result = evaluateAchievements({
      storiesCompleted: {},
      traps: [],
      totalPets: 10,
    });
    expect(result.murmur).toBe(true);
  });

  it("unlocks firstBlood when traps exist", () => {
    const result = evaluateAchievements({
      storiesCompleted: {},
      traps: [trap()],
      totalPets: 0,
    });
    expect(result.firstBlood).toBe(true);
  });
});

describe("getNewlyUnlocked", () => {
  it("returns ids of newly unlocked achievements", () => {
    const current = {
      detective: ach("Детектив", false),
      sherlock: ach("Шерлок", false),
    };
    const checks = { detective: true, sherlock: false, saper: false, hunter: false, holmes: false, murmur: false, firstBlood: false, erudite: false, student: false, master: false };
    const result = getNewlyUnlocked(current, checks);
    expect(result).toContain("detective");
    expect(result).not.toContain("sherlock");
  });

  it("does not return already unlocked", () => {
    const current = {
      detective: ach("Детектив", true),
      sherlock: ach("Шерлок", false),
    };
    const checks = { detective: true, sherlock: false, saper: false, hunter: false, holmes: false, murmur: false, firstBlood: false, erudite: false, student: false, master: false };
    const result = getNewlyUnlocked(current, checks);
    expect(result).not.toContain("detective");
  });

  it("skips missing achievement keys", () => {
    const current: Record<string, Achievement> = {};
    const checks = { detective: true, sherlock: false, saper: false, hunter: false, holmes: false, murmur: false, firstBlood: false, erudite: false, student: false, master: false };
    const result = getNewlyUnlocked(current, checks);
    expect(result).toEqual([]);
  });
});
