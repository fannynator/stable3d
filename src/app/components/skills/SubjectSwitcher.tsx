import type { Subject } from "../../types";

interface SubjectSwitcherProps {
  active: Subject;
  onChange: (s: Subject) => void;
}

export function SubjectSwitcher({ active, onChange }: SubjectSwitcherProps) {
  return (
    <div className="px-4 pb-3">
      <div className="bg-white/20 rounded-2xl p-1 flex gap-1 border border-white/30">
        {(["math", "russian"] as const).map(s => {
          const on = active === s;
          return (
            <button key={s} onClick={() => onChange(s)}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${on ? "bg-white text-purple-700 shadow-lg" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
              <span className="text-lg">{s === "math" ? "🧮" : "📝"}</span>
              {s === "math" ? "Математика" : "Русский"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
