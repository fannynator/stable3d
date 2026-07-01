import type { FGOSCurriculum, FGOSTopic } from "../fgos/fgos-tree";
import { isSpeedDemon, needsExtraPractice } from "../player/analytics";
import type { TopicAnalytics } from "../player/analytics";

/**
 * Adaptive difficulty modes.
 */
export type DifficultyMode = "standard" | "olympiad" | "externat" | "remedial";

/**
 * Determine the appropriate difficulty mode for a player on a given topic.
 *
 * - externat: breeze through → skip to next grade's equivalent topic
 * - olympiad: fast + accurate → olympiad-level variant tasks
 * - remedial: struggling → extra practice on same topic
 * - standard: default progression
 */
export function getDifficultyMode(
  analytics: TopicAnalytics | undefined
): DifficultyMode {
  if (!analytics) return "standard";

  if (needsExtraPractice(analytics)) return "remedial";
  if (isSpeedDemon(analytics)) return "olympiad";

  return "standard";
}

/**
 * Get the olympiad variant topic for a given topic, if available.
 */
export function getOlympiadVariant(
  curriculum: FGOSCurriculum,
  topicId: string
): FGOSTopic | undefined {
  for (const grade of curriculum.grades) {
    for (const quarter of grade.quarters) {
      const topic = quarter.topics.find((t) => t.id === topicId);
      if (topic?.olympiadVariantId) {
        // Find the olympiad topic in the same curriculum
        for (const g of curriculum.grades) {
          for (const q of g.quarters) {
            const variant = q.topics.find((t) => t.id === topic.olympiadVariantId);
            if (variant) return variant;
          }
        }
      }
    }
  }
  return undefined;
}
