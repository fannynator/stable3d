import type { Skill } from "../../types";

interface SkillCardProps {
  skill: Skill;
  onClick?: () => void;
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  const pct = skill.progress;
  const statusText = pct >= 100 ? "Пройдено" : pct > 0 ? `${pct}%` : skill.status === "current" ? "Готово 🚀" : "Не начато";

  return (
    <div
      onClick={skill.status !== "locked" ? onClick : undefined}
      className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 hover:scale-[1.04] ${skill.status === "locked" ? "opacity-55" : ""}`}
      style={{ boxShadow: skill.shadow }}
    >
      <div className="p-4 flex flex-col items-center justify-between min-h-[150px] relative" style={{ background: skill.gradient }}>
        <div className="absolute -top-3.5 -right-3.5 w-12 h-12 rounded-full bg-white/12" />
        <div className="absolute -bottom-2.5 -left-2.5 w-8 h-8 rounded-full bg-white/10" />

        {skill.status === "locked" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(30,27,75,0.52)] backdrop-blur-sm">
            <div className="text-5xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">🔒</div>
          </div>
        )}

        {skill.status === "completed" && (
          <div className="absolute top-2.5 right-2.5 text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">🏆</div>
        )}

        <div className="text-5xl mt-1 relative z-10 drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)]">{skill.icon}</div>
        <div className="text-white font-black text-center text-xs leading-tight relative z-10 mt-1">{skill.name}</div>

        <div className="w-full mt-2 relative z-10">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "rgba(255,255,255,0.85)" }} />
          </div>
          <div className="text-white/80 text-[10px] font-bold text-center mt-1">{statusText}</div>
        </div>
      </div>
    </div>
  );
}
