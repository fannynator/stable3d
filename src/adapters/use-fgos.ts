import { useMemo } from "react";
import { MATH_SKILLS } from "../core/fgos/math-grades";
import { RUSSIAN_SKILLS } from "../core/fgos/russian-grades";
import {
  getUnlockedSkills,
  isChapterGated,
  skillsByGrade,
  getGradeProgress,
} from "../core/fgos/progression";
import type { Subject } from "../core/fgos/fgos-tree";
import type { Skill } from "../app/types";

/**
 * Bridge between skill tree and React UI.
 */
export function useFGOSProgress(
  subject: Subject,
  completedSkillIds: string[]
) {
  const allSkills = subject === "math" ? MATH_SKILLS : RUSSIAN_SKILLS;
  const completedIds = new Set(completedSkillIds);

  const unlockedSkills = useMemo(
    () => getUnlockedSkills(allSkills, completedIds),
    [subject, completedSkillIds]
  );

  const checkChapterGated = (chapterId: string): boolean =>
    isChapterGated(allSkills, chapterId, completedIds);

  /**
   * Map skills to Skill[] format for UI.
   */
  const skillsForUI: Skill[] = useMemo(() => {
    return allSkills.map((sk): Skill => {
      const isCompleted = completedIds.has(sk.id);
      const isUnlocked = isCompleted || unlockedSkills.some((u) => u.id === sk.id);

      return {
        id: sk.id,
        name: sk.name,
        icon: sk.icon,
        color: sk.color,
        progress: isCompleted ? 100 : 0,
        status: isCompleted
          ? "completed"
          : isUnlocked
          ? "current"
          : "locked",
        gradient: `linear-gradient(135deg,${sk.color},${sk.color}dd)`,
        shadow: `0 8px 20px ${sk.color}66`,
      };
    });
  }, [allSkills, completedIds, unlockedSkills]);

  return {
    allSkills,
    unlockedSkills,
    skillsForUI,
    checkChapterGated,
  };
}
