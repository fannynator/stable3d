import type { CatState, CatMood } from "../../app/types";

/**
 * Pure cat logic — no React, no DOM, no side effects.
 */

const HUNGER_DECAY_PER_MINUTE = 0.5;
const ENERGY_DECAY_PER_MINUTE = 0.3;
const LOW_THRESHOLD = 20;
const HIGH_THRESHOLD = 70;

export function deriveCatMood(cat: CatState): CatMood {
  if (cat.energy < LOW_THRESHOLD) return "sleepy";
  if (cat.hunger < LOW_THRESHOLD) return "hungry";
  if (cat.hunger > HIGH_THRESHOLD && cat.energy > HIGH_THRESHOLD) return "playful";
  return "happy";
}

export function decayCat(cat: CatState, now: number = Date.now()): CatState {
  const elapsedMs = now - cat.lastUpdate;
  const elapsedMinutes = elapsedMs / 1000 / 60;
  return {
    ...cat,
    hunger: Math.max(0, cat.hunger - elapsedMinutes * HUNGER_DECAY_PER_MINUTE),
    energy: Math.max(0, cat.energy - elapsedMinutes * ENERGY_DECAY_PER_MINUTE),
    lastUpdate: now,
  };
}

export function feedCat(cat: CatState, amount: number = 30): CatState {
  return {
    ...cat,
    hunger: Math.min(100, cat.hunger + amount),
    lastUpdate: Date.now(),
  };
}

export function restCat(cat: CatState, amount: number = 30): CatState {
  return {
    ...cat,
    energy: Math.min(100, cat.energy + amount),
    lastUpdate: Date.now(),
  };
}
