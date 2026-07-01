import { useMemo } from "react";
import { MATH_CURRICULUM } from "../core/fgos/math-grades";
import { RUSSIAN_CURRICULUM } from "../core/fgos/russian-grades";
import {
  getUnlockedTopics,
  getNextTopic,
  isChapterGated,
  getObstaclesForGrade,
  getTopicGrade,
  getTopicQuarter,
  flattenTopics,
} from "../core/fgos/progression";
import type { Subject, FGOSTopic } from "../core/fgos/fgos-tree";
import type { Skill } from "../app/types";

/**
 * Bridge between FGOS curriculum tree and React UI.
 * Takes legacy Skill[] array and maps to FGOS topics.
 */
export function useFGOSProgress(
  subject: Subject,
  completedSkillIds: string[] // legacy skill IDs like "add", "sub", etc.
) {
  const curriculum = subject === "math" ? MATH_CURRICULUM : RUSSIAN_CURRICULUM;
  const completedIds = new Set(completedSkillIds);

  const allTopics = useMemo(() => flattenTopics(curriculum), [curriculum]);

  const unlockedTopics = useMemo(
    () => getUnlockedTopics(curriculum, completedIds),
    [curriculum, completedSkillIds]
  );

  const nextTopic = useMemo(
    () => getNextTopic(curriculum, completedIds),
    [curriculum, completedSkillIds]
  );

  const checkChapterGated = (chapterId: string): boolean =>
    isChapterGated(curriculum, chapterId, completedIds);

  const obstacles = useMemo(
    () => getObstaclesForGrade(curriculum, completedIds),
    [curriculum, completedSkillIds]
  );

  const topicToGrade = (topicId: string) =>
    getTopicGrade(curriculum, topicId);

  const topicToQuarter = (topicId: string) =>
    getTopicQuarter(curriculum, topicId);

  /**
   * Map FGOS topics to existing Skill[] format for backward compatibility with UI.
   */
  const skillsForUI: Skill[] = useMemo(() => {
    return allTopics.map((topic): Skill => {
      const isCompleted = completedIds.has(topic.id);
      const isUnlocked = isCompleted || unlockedTopics.some((t) => t.id === topic.id);
      const isCurrent = nextTopic?.id === topic.id;

      return {
        id: topic.id,
        name: topic.name,
        icon: topic.icon,
        color: topic.color,
        progress: isCompleted ? 100 : 0,
        status: isCompleted
          ? "completed"
          : isCurrent
          ? "current"
          : isUnlocked
          ? "current"
          : "locked",
        gradient: `linear-gradient(135deg,${topic.color})`,
        shadow: `0 8px 20px ${topic.color}66`,
      };
    });
  }, [allTopics, completedIds, unlockedTopics, nextTopic]);

  return {
    curriculum,
    allTopics,
    unlockedTopics,
    nextTopic,
    checkChapterGated,
    obstacles,
    topicToGrade,
    topicToQuarter,
    skillsForUI,
  };
}
