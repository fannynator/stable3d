import type { Subject, Skill } from "../types";
import { SkillCard } from "./skills/SkillCard";

interface SkillsScreenProps {
  skills: Skill[];
  stars: Record<string, number>;
  onSkillClick: (skill: Skill) => void;
}

export function SkillsScreen({ skills, stars, onSkillClick }: SkillsScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ background: "#F0EBFF" }}>
      <div className="flex items-center gap-2 px-4 mb-3 pt-1">
        <span className="text-xl">🌳</span>
        <h2 className="font-black text-gray-800 text-base">Дерево навыков</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {skills.map((s, i) => (
          <div key={s.id} style={{ animation: `fadeSlideUp 0.45s ${i * 0.07}s ease-out both` }}>
            <SkillCard skill={s} stars={stars[s.id] || 0} onClick={() => onSkillClick(s)} />
          </div>
        ))}
      </div>
    </div>
  );
}
