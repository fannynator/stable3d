export { calculateLessonReward, canAfford, getAchievementReward } from "./economy/gems";
export { deriveCatMood, decayCat, feedCat, restCat } from "./player/cat";
export { evaluateAchievements, getNewlyUnlocked } from "./player/achievements";

// FGOS curriculum
export type { FGOSTopic, FGOSQuarter, FGOSGrade, FGOSCurriculum, Subject as FGOSSubject } from "./fgos/fgos-tree";
export { MATH_CURRICULUM } from "./fgos/math-grades";
export { RUSSIAN_CURRICULUM } from "./fgos/russian-grades";
export {
  flattenTopics,
  getTopicById,
  getUnlockedTopics,
  getNextTopic,
  isChapterGated,
  getChapterGates,
  getObstaclesForGrade,
  getTopicGrade,
  getTopicQuarter,
  getGradeProgress,
} from "./fgos/progression";
export type { PlayerTopicProgress } from "./fgos/progression";

// Analytics & Adaptive difficulty
export { recordAnswer, getAccuracy, getAverageTimeMs, getRecentAccuracy, isSpeedDemon, needsExtraPractice } from "./player/analytics";
export type { AnswerRecord, TopicAnalytics } from "./player/analytics";
export { getDifficultyMode, getOlympiadVariant } from "./fgos/adaptive";
export type { DifficultyMode } from "./fgos/adaptive";

// AI Structured Outputs
export type { AIStructuredTask } from "./tasks/ai-schema";
export { AI_TASK_JSON_SCHEMA, validateAITask } from "./tasks/ai-schema";
export { generateAILesson, generateAITask } from "./tasks/ai-adapter";
export { fetchTaskFromAI } from "./tasks/openrouter";
