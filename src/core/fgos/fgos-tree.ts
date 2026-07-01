/**
 * FGOS curriculum tree types.
 * One structure governs: task generators, comic chapter locks, minigame obstacles.
 */

export type Subject = "math" | "russian";

export interface FGOSTopic {
  /** Unique topic ID, e.g. "math_1_1_add" (subject_grade_quarter_id) */
  id: string;
  /** Display name */
  name: string;
  /** Subject */
  subject: Subject;
  /** Icon emoji */
  icon: string;
  /** Theme color */
  color: string;
  /** Maps to an existing generator function key */
  generatorId: string;
  /** Progress points needed to complete this topic */
  progressToComplete: number;
  /** Topic IDs that must be completed before this one unlocks */
  prerequisites: string[];
  /** Story chapter IDs that this topic gates (can't read chapter until topic done) */
  gatesChapterIds: string[];
  /** Obstacle type spawned in minigame runners */
  obstacleType: "choice" | "input" | "pair" | "boss";
  /** Relative difficulty for obstacle placement (1=easy / early, 3=hard / late) */
  obstacleDifficulty: 1 | 2 | 3;
  /** Olympiad variant topic ID for gifted kids (null = no olympiad variant) */
  olympiadVariantId: string | null;
}

export interface FGOSQuarter {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  topics: FGOSTopic[];
}

export interface FGOSGrade {
  grade: 1 | 2 | 3 | 4;
  label: string;
  quarters: FGOSQuarter[];
}

/** Complete FGOS tree for one subject */
export interface FGOSCurriculum {
  subject: Subject;
  grades: FGOSGrade[];
}
