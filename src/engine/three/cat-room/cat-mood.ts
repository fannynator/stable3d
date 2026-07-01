import type { CatMood } from "../../app/types";

/**
 * Cat mood to animation speed mapping.
 * Playful cat bounces faster, sleepy cat is slower.
 */
export function moodToAnimSpeed(mood: CatMood): number {
  switch (mood) {
    case "playful": return 1.4;
    case "sleepy": return 0.6;
    case "hungry": return 0.8;
    case "happy":
    default: return 1.0;
  }
}

/**
 * Mood to emoji fallback mapping.
 */
const moodEmojis: Record<CatMood, string> = {
  happy: "😺", sleepy: "😴", hungry: "😿", playful: "😸",
};

export function moodToEmoji(mood: CatMood): string {
  return moodEmojis[mood] || "😺";
}
