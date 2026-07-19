export { calculateLessonReward, canAfford, getAchievementReward } from "./economy/gems";
export { deriveCatMood, decayCat, feedCat, restCat } from "./player/cat";
export { evaluateAchievements, getNewlyUnlocked } from "./player/achievements";

// Skill tree
export type { SkillNode, Subject as FGOSSubject } from "./fgos/fgos-tree";
export { MATH_SKILLS } from "./fgos/math-grades";
export { RUSSIAN_SKILLS } from "./fgos/russian-grades";
export {
  getUnlockedSkills,
  getRecommendedSkill,
  isChapterGated,
  getChapterGates,
  getGradeProgress,
  skillsByGrade,
  isSkillCompleted,
  skillAccuracy,
} from "./fgos/progression";
export type { PlayerSkillProgress } from "./fgos/progression";

// Analytics & Adaptive difficulty
export { recordAnswer } from "./player/analytics";
export type { AnswerRecord } from "./player/analytics";
export { getDifficultyLevel } from "./fgos/adaptive";
export type { DifficultyLevel } from "./fgos/adaptive";

// AI Structured Outputs
export type { AIStructuredTask } from "./tasks/ai-schema";
export { AI_TASK_JSON_SCHEMA, validateAITask } from "./tasks/ai-schema";
export { generateAILesson, generateAISession } from "./tasks/ai-adapter";
export { fetchTaskFromDeepSeek } from "./tasks/deepseek";
export { fetchTaskFromLlama, isLlamaAvailable } from "./tasks/local-llama";
