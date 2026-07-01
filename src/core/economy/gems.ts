/**
 * Pure economy calculations — no React, no DOM, no side effects.
 */

const CORRECT_ANSWER = 5;
const LESSON_PERFECT_BONUS = 25;
const ACHIEVEMENT_REWARD = 15;

export function calculateLessonReward(correct: number, total: number): number {
  const base = correct * CORRECT_ANSWER;
  const perfectBonus = correct === total ? LESSON_PERFECT_BONUS : 0;
  return base + perfectBonus;
}

export function canAfford(gems: number, price: number): boolean {
  return gems >= price;
}

export function getAchievementReward(): number {
  return ACHIEVEMENT_REWARD;
}
