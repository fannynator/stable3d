/**
 * Simplified skill tree — no quarters, no obstacle grids.
 * Flat ordered list per subject, grouped by grade.
 * Difficulty levels per skill (1=easy, 2=medium, 3=hard) drive generator parameters.
 */

export type Subject = "math" | "russian";

export interface SkillNode {
  /** Unique skill ID, e.g. "math_count10" */
  id: string;
  /** Display name */
  name: string;
  subject: Subject;
  /** Icon emoji */
  icon: string;
  /** Theme color */
  color: string;
  /** Generator function key in the generator registry */
  generatorId: string;
  /** Grade (1-4) for grouping and prerequisites */
  grade: number;
  /** Progress points to mark this skill done (typically 100) */
  progressToComplete: number;
  /** Skill IDs that unlock when this one is completed */
  unlocks: string[];
  /** Story chapter IDs gated behind this skill */
  gatesChapterIds: string[];
}
