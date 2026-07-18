import type { Skill } from "../../types";

interface SkillCardProps {
  skill: Skill;
  stars: number;
  delay?: number;
  onClick?: () => void;
}

export function SkillCard({ skill, stars, delay = 0, onClick }: SkillCardProps) {
  const locked = skill.status === "locked";
  const mastered = skill.status === "completed";

  return (
    <div
      onClick={!locked ? onClick : undefined}
      className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 hover:scale-[1.04] ${locked ? "opacity-55" : ""}`}
      style={{
        boxShadow: skill.shadow,
        animation: `fadeSlideUp 0.45s ${delay}s ease-out both`,
      }}
    >
      <div className="p-4 flex flex-col items-center justify-between min-h-[140px] relative" style={{ background: skill.gradient }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -14, right: -14, width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", bottom: -10, left: -10, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />

        {/* Locked overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl" style={{ background: "rgba(30,27,75,0.52)", backdropFilter: "blur(2px)" }}>
            <div className="text-5xl" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>🔒</div>
          </div>
        )}

        {/* Mastered trophy */}
        {mastered && (
          <div className="absolute top-2.5 right-2.5 text-xl" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}>🏆</div>
        )}

        {/* Icon */}
        <div className="text-5xl mt-1 relative z-10" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.22))" }}>{skill.icon}</div>

        {/* Title */}
        <div className="text-white font-black text-center text-sm drop-shadow leading-tight relative z-10">{skill.name}</div>

        {/* Stars */}
        <div className="flex gap-0.5 relative z-10">
          {[0, 1, 2].map(i => (
            <span key={i} className={`text-base leading-none ${i < stars ? "text-yellow-300" : "text-white/30"}`}>★</span>
          ))}
        </div>
      </div>
    </div>
  );
}
