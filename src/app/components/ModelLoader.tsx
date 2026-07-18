import { useState, useEffect } from "react";

/**
 * Floating indicator shown while AI models are downloading.
 * Kokoro (~80MB) and Whisper (~78MB) download once from HuggingFace.
 */

interface ModelLoaderProps {
  /** Whether to show the loader */
  visible: boolean;
  /** Optional status text */
  status?: string;
}

export function ModelLoader({ visible, status = "Загружаю модель..." }: ModelLoaderProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[180] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2"
      style={{
        background: "rgba(124,58,237,0.95)",
        backdropFilter: "blur(8px)",
        animation: "fadeSlideUp 0.3s ease-out",
      }}
    >
      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      <span className="text-white text-xs font-bold">
        {status}{".".repeat(dots)}
      </span>
    </div>
  );
}
