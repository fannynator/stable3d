import type { CatMood } from "../types";
import { CatAvatar3D } from "../../engine/three/cat-room/CatAvatar3D";
import { useRef, useCallback } from "react";

interface TopBarProps {
  gems: number;
  streak: number;
  catMood: CatMood;
  xp: number;
  xpLabel: string;
  level: number;
  phrase: string;
  subject: "math" | "russian";
  onSubjectChange: (s: "math" | "russian") => void;
  onParentAccess?: () => void;
}

// ── Static star positions (deterministic) ──
const STARS = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 23 + 7) % 55,
  s: (i % 3) + 1.5,
  delay: (i * 0.41) % 3,
  dur: 1.3 + (i % 4) * 0.25,
}));

const DRIFT = Array.from({ length: 6 }, (_, i) => ({
  x: (i * 19 + 5) % 90,
  delay: (i * 0.7) % 4,
  dur: 5 + (i % 3),
  ch: ["✨", "💫", "⭐", "🌟", "✦", "✨"][i],
}));

export function TopBar({ gems, streak, catMood, xp, xpLabel, level, phrase, subject, onSubjectChange, onParentAccess }: TopBarProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTitleDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => onParentAccess?.(), 2000);
  }, [onParentAccess]);

  const handleTitleUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{ background: "linear-gradient(160deg,#4C1D95 0%,#6D28D9 55%,#8B5CF6 100%)" }}
    >
      {/* ── Weather particles (twinkling stars) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.s, height: s.s,
              animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
            }} />
        ))}
        {DRIFT.map((p, i) => (
          <div key={i} className="absolute text-sm" style={{
            left: `${p.x}%`, top: "-30px",
            animation: `driftDown ${p.dur}s ${p.delay}s linear infinite`,
            opacity: 0,
          }}>{p.ch}</div>
        ))}
      </div>

      {/* ── Top bar: title + stats ── */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2 relative z-10">
        <div>
          <div className="text-white font-black text-2xl leading-tight tracking-tight drop-shadow select-none"
            onMouseDown={handleTitleDown} onMouseUp={handleTitleUp} onMouseLeave={handleTitleUp}
            onTouchStart={handleTitleDown} onTouchEnd={handleTitleUp}>Кот Учёный</div>
          <div className="text-purple-200 text-xs font-bold mt-0.5">⚡ Уровень {level}</div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/30 shadow-inner">
            <span className="text-lg leading-none">💎</span>
            <span className="text-white font-black text-sm">{gems}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/30 shadow-inner">
            <span className="text-lg leading-none">🔥</span>
            <span className="text-white font-black text-sm">{streak}</span>
          </div>
        </div>
      </div>

      {/* ── 3D Cat avatar + speech bubble ── */}
      <div className="flex items-end gap-3 px-5 pb-3 relative z-10">
        <div className="flex-shrink-0" style={{ width: 70, height: 70 }}>
          <CatAvatar3D mood={catMood} size={75} />
        </div>
        <div className="flex-1 mb-2 relative">
          <div className="bg-white rounded-3xl rounded-bl-sm px-4 py-3 shadow-xl shadow-black/15">
            <p className="text-purple-800 font-black text-sm leading-snug">{phrase}</p>
          </div>
          <div className="absolute -bottom-2 left-5 w-4 h-4 bg-white"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
        </div>
      </div>

      {/* ── XP progress bar ── */}
      <div className="mx-5 mb-3 bg-white/15 rounded-2xl px-3 py-2 border border-white/25 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-400 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
              Ур. {level}
            </div>
            <span className="text-white/70 text-xs font-bold">XP: {xpLabel}</span>
          </div>
          <div className="bg-purple-300/30 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
            Ур. {level + 1} →
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full rounded-full relative overflow-hidden" style={{
            width: `${Math.min(100, xp)}%`,
            background: "linear-gradient(90deg, #A78BFA, #7C3AED, #6D28D9)",
            backgroundSize: "200% 100%",
            animation: "xpShimmer 2s linear infinite",
          }}>
            <div className="absolute inset-0 bg-white/20 rounded-full" style={{
              backgroundImage: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.3) 50%,transparent 100%)",
            }} />
          </div>
        </div>
      </div>

      {/* ── Subject switcher ── */}
      <div className="mx-5 mb-0 relative z-10">
        <div className="bg-white/20 rounded-2xl p-1 flex gap-1 border border-white/30 backdrop-blur-sm">
          {(["math", "russian"] as const).map((subj) => {
            const on = subject === subj;
            return (
              <button key={subj} onClick={() => onSubjectChange(subj)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2
                  ${on ? "bg-white text-purple-700 shadow-lg shadow-purple-900/20" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
                <span className="text-xl">{subj === "math" ? "🔢" : "📖"}</span>
                {subj === "math" ? "Математика" : "Русский язык"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Curved bottom bridge ── */}
      <div className="h-9 rounded-t-[2rem] mt-2.5" style={{ background: "#F0EBFF" }} />
    </div>
  );
}
