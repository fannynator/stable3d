import type { FGOSCurriculum, FGOSTopic } from "./fgos-tree";

/**
 * Pure progression logic for FGOS curriculum tree.
 * No React, no DOM, no side effects.
 */

export interface PlayerTopicProgress {
  topicId: string;
  progress: number; // 0..100
}

/**
 * Flatten all topics from a curriculum into a single array.
 */
export function flattenTopics(curriculum: FGOSCurriculum): FGOSTopic[] {
  const topics: FGOSTopic[] = [];
  for (const grade of curriculum.grades) {
    for (const quarter of grade.quarters) {
      for (const topic of quarter.topics) {
        topics.push(topic);
      }
    }
  }
  return topics;
}

/**
 * Get a topic by its ID from a curriculum.
 */
export function getTopicById(curriculum: FGOSCurriculum, topicId: string): FGOSTopic | undefined {
  for (const grade of curriculum.grades) {
    for (const quarter of grade.quarters) {
      const topic = quarter.topics.find((t) => t.id === topicId);
      if (topic) return topic;
    }
  }
  return undefined;
}

/**
 * Check if a topic's prerequisites are all completed.
 */
function arePrerequisitesMet(
  topic: FGOSTopic,
  completedTopicIds: Set<string>
): boolean {
  if (topic.prerequisites.length === 0) return true;
  return topic.prerequisites.every((prereq) => completedTopicIds.has(prereq));
}

/**
 * Get the list of currently unlocked (available to start) topics.
 */
export function getUnlockedTopics(
  curriculum: FGOSCurriculum,
  completedIds: Set<string>
): FGOSTopic[] {
  const allTopics = flattenTopics(curriculum);
  return allTopics.filter((topic) => {
    if (completedIds.has(topic.id)) return false; // already done
    return arePrerequisitesMet(topic, completedIds);
  });
}

/**
 * Get the next recommended topic to work on.
 * First available topic in the tree order, or undefined if all done.
 */
export function getNextTopic(
  curriculum: FGOSCurriculum,
  completedIds: Set<string>
): FGOSTopic | undefined {
  return getUnlockedTopics(curriculum, completedIds)[0];
}

/**
 * Check whether a story chapter is gated behind uncompleted topics.
 * Returns the list of topic IDs that are still required for this chapter.
 */
export function getChapterGates(
  curriculum: FGOSCurriculum,
  chapterId: string,
  completedIds: Set<string>
): string[] {
  const allTopics = flattenTopics(curriculum);
  return allTopics
    .filter((t) => t.gatesChapterIds.includes(chapterId) && !completedIds.has(t.id))
    .map((t) => t.id);
}

/**
 * Whether a chapter is locked (at least one gate topic not completed).
 */
export function isChapterGated(
  curriculum: FGOSCurriculum,
  chapterId: string,
  completedIds: Set<string>
): boolean {
  return getChapterGates(curriculum, chapterId, completedIds).length > 0;
}

/**
 * Get obstacle definitions for minigame runner.
 * Returns topics that can appear as obstacles, sorted by difficulty.
 */
export function getObstaclesForGrade(
  curriculum: FGOSCurriculum,
  completedIds: Set<string>,
  maxDifficulty: 1 | 2 | 3 = 3
): { topic: FGOSTopic; difficulty: 1 | 2 | 3 }[] {
  const allTopics = flattenTopics(curriculum);
  return allTopics
    .filter(
      (t) =>
        t.obstacleDifficulty <= maxDifficulty &&
        (!completedIds.has(t.id) || t.obstacleType === "boss")
    )
    .map((t) => ({ topic: t, difficulty: t.obstacleDifficulty }))
    .sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Get the grade label for a given topic.
 */
export function getTopicGrade(
  curriculum: FGOSCurriculum,
  topicId: string
): string | undefined {
  for (const grade of curriculum.grades) {
    for (const quarter of grade.quarters) {
      if (quarter.topics.some((t) => t.id === topicId)) {
        return grade.label;
      }
    }
  }
  return undefined;
}

/**
 * Get the quarter label for a given topic.
 */
export function getTopicQuarter(
  curriculum: FGOSCurriculum,
  topicId: string
): string | undefined {
  for (const grade of curriculum.grades) {
    for (const quarter of grade.quarters) {
      if (quarter.topics.some((t) => t.id === topicId)) {
        return quarter.label;
      }
    }
  }
  return undefined;
}

/**
 * Compute progress percentage for a grade (0-100).
 */
export function getGradeProgress(
  curriculum: FGOSCurriculum,
  completedIds: Set<string>
): number {
  const allTopics = flattenTopics(curriculum);
  if (allTopics.length === 0) return 100;
  const completed = allTopics.filter((t) => completedIds.has(t.id)).length;
  return Math.round((completed / allTopics.length) * 100);
}
