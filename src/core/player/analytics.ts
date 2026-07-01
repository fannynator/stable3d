/**
 * Pure player analytics — no React, no DOM.
 * Tracks answer speed, accuracy, and streak data for adaptive difficulty.
 */

export interface AnswerRecord {
  topicId: string;
  timeMs: number;      // milliseconds to answer
  correct: boolean;
  timestamp: number;
}

export interface TopicAnalytics {
  topicId: string;
  totalAnswered: number;
  totalCorrect: number;
  totalTimeMs: number;
  lastTenResults: boolean[]; // most recent 10 answers (true = correct)
}

/**
 * Record an answer and return updated topic analytics.
 */
export function recordAnswer(
  topicId: string,
  timeMs: number,
  correct: boolean,
  existing: TopicAnalytics | undefined
): TopicAnalytics {
  if (!existing) {
    return {
      topicId,
      totalAnswered: 1,
      totalCorrect: correct ? 1 : 0,
      totalTimeMs: timeMs,
      lastTenResults: [correct],
    };
  }

  const lastTen = [...existing.lastTenResults, correct].slice(-10);

  return {
    topicId,
    totalAnswered: existing.totalAnswered + 1,
    totalCorrect: existing.totalCorrect + (correct ? 1 : 0),
    totalTimeMs: existing.totalTimeMs + timeMs,
    lastTenResults: lastTen,
  };
}

export function getAccuracy(analytics: TopicAnalytics): number {
  if (analytics.totalAnswered === 0) return 1;
  return analytics.totalCorrect / analytics.totalAnswered;
}

export function getAverageTimeMs(analytics: TopicAnalytics): number {
  if (analytics.totalAnswered === 0) return 0;
  return analytics.totalTimeMs / analytics.totalAnswered;
}

export function getRecentAccuracy(analytics: TopicAnalytics): number {
  if (analytics.lastTenResults.length === 0) return 1;
  const correct = analytics.lastTenResults.filter(Boolean).length;
  return correct / analytics.lastTenResults.length;
}

/**
 * Whether the player is breezing through (gifted kid pattern).
 * Criteria: average < 3 seconds AND accuracy > 90% on last 10 answers
 * AND at least 10 answers recorded.
 */
export function isSpeedDemon(analytics: TopicAnalytics): boolean {
  if (analytics.totalAnswered < 10) return false;
  const avgTime = getAverageTimeMs(analytics);
  const recentAcc = getRecentAccuracy(analytics);
  return avgTime < 3000 && recentAcc > 0.9;
}

/**
 * Whether the player needs extra practice.
 * Criteria: accuracy below 60% after at least 5 answers.
 */
export function needsExtraPractice(analytics: TopicAnalytics): boolean {
  if (analytics.totalAnswered < 5) return false;
  return getAccuracy(analytics) < 0.6;
}
