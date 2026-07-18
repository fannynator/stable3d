import type { Skill } from "../types";
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
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-5xl mb-3">🐱</span>
          <p className="text-gray-500 font-semibold">Навыки загружаются...</p>
          <p className="text-gray-400 text-xs mt-1">Кот-учёный готовит учебную программу!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {skills.map((s, i) => (
            <SkillCard key={s.id} skill={s} stars={stars[s.id] || 0} delay={i * 0.07} onClick={() => onSkillClick(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
