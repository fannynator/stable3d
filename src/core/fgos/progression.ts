import type { SkillNode } from "./fgos-tree";

/**
 * Progression logic for the flat skill tree.
 * - Skills of grade N are unlocked when ≥70% of grade N-1 skills are done.
 * - Grade 1 skills are all unlocked initially.
 * - Recommended skill: next incomplete skill in order, or lowest-accuracy skill.
 */

export interface PlayerSkillProgress {
  skillId: string;
  progress: number; // 0..100
  /** Last 10 answer results for this skill (true=correct) */
  lastResults: boolean[];
  /** Total time spent on this skill in ms */
  totalTimeMs: number;
}

/** Whether the player has completed a given skill */
export function isSkillCompleted(psp: PlayerSkillProgress): boolean {
  return psp.progress >= 100;
}

/** Accuracy on a skill */
export function skillAccuracy(psp: PlayerSkillProgress): number {
  if (psp.lastResults.length === 0) return 1;
  return psp.lastResults.filter(Boolean).length / psp.lastResults.length;
}

/** Get all skills for a grade */
export function skillsByGrade(skills: SkillNode[], grade: number): SkillNode[] {
  return skills.filter((s) => s.grade === grade);
}

/**
 * Which skills are unlocked right now.
 * Grade 1: all unlocked (except completed).
 * Grade N: all unlocked when ≥70% of grade N-1 skills are completed.
 */
export function getUnlockedSkills(
  allSkills: SkillNode[],
  completedIds: Set<string>
): SkillNode[] {
  const unlocked: SkillNode[] = [];

  // Calculate per-grade completion
  const gradeCompletion: Record<number, number> = {};
  for (const sk of allSkills) {
    if (!gradeCompletion[sk.grade]) gradeCompletion[sk.grade] = 0;
    if (completedIds.has(sk.id)) gradeCompletion[sk.grade]++;
  }
  const gradeTotal: Record<number, number> = {};
  for (const sk of allSkills) {
    gradeTotal[sk.grade] = (gradeTotal[sk.grade] || 0) + 1;
  }

  for (const skill of allSkills) {
    if (completedIds.has(skill.id)) continue;

    if (skill.grade === 1) {
      unlocked.push(skill);
      continue;
    }

    // Grade gate: is previous grade 70%+ done?
    const prevGrade = skill.grade - 1;
    const prevTotal = gradeTotal[prevGrade] || 0;
    const prevDone = gradeCompletion[prevGrade] || 0;
    const prevRatio = prevTotal > 0 ? prevDone / prevTotal : 1;
    if (prevRatio >= 0.7) {
      unlocked.push(skill);
    }
  }

  return unlocked;
}

/**
 * Recommended skill: first unlocked skill not yet started,
 * or the skill with lowest accuracy among started ones.
 */
export function getRecommendedSkill(
  allSkills: SkillNode[],
  progressMap: Map<string, PlayerSkillProgress>,
  completedIds: Set<string>
): SkillNode | undefined {
  const unlocked = getUnlockedSkills(allSkills, completedIds);

  // Prefer skills already started (partial progress) with low accuracy
  const started = unlocked.filter(
    (s) => progressMap.has(s.id) && progressMap.get(s.id)!.progress > 0
  );
  if (started.length > 0) {
    started.sort(
      (a, b) =>
        skillAccuracy(progressMap.get(a.id)!) -
        skillAccuracy(progressMap.get(b.id)!)
    );
    return started[0];
  }

  // Otherwise first unlocked in curriculum order
  return unlocked[0];
}

/**
 * Check if a chapter is gated behind uncompleted skills.
 */
export function getChapterGates(
  allSkills: SkillNode[],
  chapterId: string,
  completedIds: Set<string>
): SkillNode[] {
  return allSkills.filter(
    (s) => s.gatesChapterIds.includes(chapterId) && !completedIds.has(s.id)
  );
}

export function isChapterGated(
  allSkills: SkillNode[],
  chapterId: string,
  completedIds: Set<string>
): boolean {
  return getChapterGates(allSkills, chapterId, completedIds).length > 0;
}

/**
 * Grade completion percentage (0-100).
 */
export function getGradeProgress(
  allSkills: SkillNode[],
  completedIds: Set<string>,
  grade: number
): number {
  const gradeSkills = skillsByGrade(allSkills, grade);
  if (gradeSkills.length === 0) return 100;
  const done = gradeSkills.filter((s) => completedIds.has(s.id)).length;
  return Math.round((done / gradeSkills.length) * 100);
}
