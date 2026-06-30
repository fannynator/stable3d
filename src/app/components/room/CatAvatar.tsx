import type { CatMood } from "../../types";

const moodEmojis: Record<CatMood, string> = {
  happy: "😺",
  sleepy: "😴",
  hungry: "😿",
  playful: "😸",
};

interface CatAvatarProps {
  mood: CatMood;
  onClick?: () => void;
}

export function CatAvatar({ mood, onClick }: CatAvatarProps) {
  return (
    <div
      onClick={onClick}
      className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[clamp(40px,8vw,80px)] cursor-pointer select-none z-10"
      style={{
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
        animation: "catBreathe 3s ease-in-out infinite",
      }}
    >
      {moodEmojis[mood] || "😺"}
    </div>
  );
}
