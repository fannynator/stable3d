import type { CatMood } from "../../types";

const moodIcons: Record<CatMood, string> = {
  happy: "😺",
  sleepy: "😴",
  hungry: "😿",
  playful: "😸",
};

interface StatusBarProps {
  mood: CatMood;
  hunger: number;
  energy: number;
}

export function StatusBar({ mood, hunger, energy }: StatusBarProps) {
  return (
    <div className="fixed top-3 right-3 flex gap-2 z-50">
      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1">
        {moodIcons[mood] || "😺"}
      </div>
      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1">
        🍖 {Math.round(hunger)}%
      </div>
      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1">
        ⚡ {Math.round(energy)}%
      </div>
    </div>
  );
}
