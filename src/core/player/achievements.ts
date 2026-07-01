import type { Achievement, Trap } from "../../app/types";

/**
 * Pure achievement logic — no React, no DOM, no side effects.
 */

interface AchievementCheckInput {
  storiesCompleted: Record<string, boolean>;
  traps: Trap[];
  totalPets: number;
}

type AchievementId =
  | "detective" | "sherlock" | "holmes"
  | "saper" | "hunter"
  | "murmur" | "firstBlood"
  | "erudite" | "student" | "master";

type AchievementCheck = Record<AchievementId, boolean>;

export function evaluateAchievements(input: AchievementCheckInput): AchievementCheck {
  const done =
    (input.storiesCompleted.math ? 1 : 0) +
    (input.storiesCompleted.rus1 ? 1 : 0) +
    (input.storiesCompleted.rus2 ? 1 : 0);
  const def = input.traps.reduce((sum, t) => sum + t.defuses, 0);

  return {
    detective: done >= 1,
    sherlock: done >= 2,
    holmes: done >= 3,
    saper: def >= 1,
    hunter: def >= 3,
    murmur: input.totalPets >= 10,
    firstBlood: input.traps.length > 0,
    erudite: false,  // evaluated separately (subjectSwitches >= 5)
    student: false,  // evaluated separately (at least 1 lesson)
    master: false,   // evaluated separately (lesson with 0 errors)
  };
}

export function getNewlyUnlocked(
  current: Record<string, Achievement>,
  checks: AchievementCheck
): string[] {
  const unlocked: string[] = [];
  for (const [id, cond] of Object.entries(checks)) {
    if (cond && current[id] && !current[id].unlocked) {
      unlocked.push(id);
    }
  }
  return unlocked;
}
