import type { Subject, Skill } from "../types";
import { SubjectSwitcher } from "./skills/SubjectSwitcher";
import { SkillCard } from "./skills/SkillCard";

interface SkillsScreenProps {
  subject: Subject;
  skills: Skill[];
  onSubjectChange: (s: Subject) => void;
  onSkillClick: (skill: Skill) => void;
}

export function SkillsScreen({ subject, skills, onSubjectChange, onSkillClick }: SkillsScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ background: "#F0EBFF" }}>
      <SubjectSwitcher active={subject} onChange={onSubjectChange} />
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="text-xl">🌳</span>
        <h2 className="font-black text-gray-800 text-base">Дерево навыков</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {skills.map((s, i) => (
          <div key={s.id} style={{ animation: `fadeSlideUp 0.45s ${i * 0.07}s ease-out both` }}>
            <SkillCard skill={s} onClick={() => onSkillClick(s)} />
          </div>
        ))}
      </div>
    </div>
  );
}
