import type { PlayerSkillProgress } from "./progression";

/**
 * Adaptive difficulty — replaces the 3-star system.
 * Determines task difficulty level (1=easy, 2=medium, 3=hard)
 * based purely on answer analytics, not manual star ratings.
 */

export type DifficultyLevel = 1 | 2 | 3;

/**
 * Determine the difficulty level for a skill based on recent performance.
 *
 * Level 1 (easy): first few answers OR accuracy < 60%
 * Level 2 (medium): accuracy 60-85%
 * Level 3 (hard): accuracy > 85% AND at least 5 answers
 */
export function getDifficultyLevel(
  progress: PlayerSkillProgress | undefined
): DifficultyLevel {
  if (!progress || progress.lastResults.length < 3) return 1;

  const recent = progress.lastResults.slice(-5);
  const acc = recent.filter(Boolean).length / recent.length;

  if (acc >= 0.85) return 3;
  if (acc >= 0.6) return 2;
  return 1;
}
