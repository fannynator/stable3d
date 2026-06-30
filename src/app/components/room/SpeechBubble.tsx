import { useEffect, useState } from "react";
import type { CatMood } from "../../types";
import { CAT_ROOM_PHRASES } from "../../config";

interface SpeechBubbleProps {
  mood: CatMood;
  customText?: string | null;
}

export function SpeechBubble({ mood, customText }: SpeechBubbleProps) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (customText) {
      setText(customText);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [customText]);

  const getRandomPhrase = () => {
    const pool = CAT_ROOM_PHRASES[mood] || CAT_ROOM_PHRASES.happy;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  useEffect(() => {
    if (customText) return;
    const showRandom = () => {
      setText(getRandomPhrase());
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    const interval = setInterval(showRandom, 8000);
    showRandom();
    return () => clearInterval(interval);
  }, [mood]);

  if (!visible) return null;

  return (
    <div
      className="absolute bottom-[calc(18%+clamp(40px,8vw,80px)+10px)] left-1/2 -translate-x-1/2 z-[61] pointer-events-none"
      style={{ animation: "fadeSlideUp 0.3s ease-out" }}
    >
      <div className="relative bg-white/95 text-[#2d1b69] px-4 py-2 rounded-[20px] text-[clamp(12px,2.5vw,18px)] font-semibold whitespace-nowrap shadow-lg">
        {text}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid rgba(255,255,255,0.95)",
          }}
        />
      </div>
    </div>
  );
}

export { CAT_ROOM_PHRASES };
