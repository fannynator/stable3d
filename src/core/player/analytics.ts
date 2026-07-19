import type { PlayerSkillProgress } from "../fgos/progression";

/**
 * Player analytics — answer tracking and skill progress updates.
 * Feeds into adaptive difficulty system.
 */

export interface AnswerRecord {
  skillId: string;
  timeMs: number;
  correct: boolean;
  timestamp: number;
}

/**
 * Record a single answer for a skill. Returns updated progress.
 */
export function recordAnswer(
  skillId: string,
  timeMs: number,
  correct: boolean,
  existing: PlayerSkillProgress | undefined
): PlayerSkillProgress {
  if (!existing) {
    return {
      skillId,
      progress: correct ? 10 : 0,
      lastResults: [correct],
      totalTimeMs: timeMs,
    };
  }

  const lastResults = [...existing.lastResults, correct].slice(-10);
  const progress = Math.min(
    100,
    existing.progress + (correct ? 12 : 4)
  );

  return {
    skillId,
    progress,
    lastResults,
    totalTimeMs: existing.totalTimeMs + timeMs,
  };
}
