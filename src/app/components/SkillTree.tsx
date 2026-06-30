import { Lock, Star, Trophy } from 'lucide-react';

interface Skill {
  id: string;
  title: string;
  icon: string;
  level: number;
  maxLevel: number;
  locked: boolean;
  color: string;
  mastered?: boolean;
}

interface SkillTreeProps {
  skills: Skill[];
  subject: 'math' | 'russian';
}

export function SkillTree({ skills, subject }: SkillTreeProps) {
  return (
    <div className="px-4 py-3 pb-24">
      <h2 className="font-bold text-lg mb-3">
        {subject === 'math' ? '📊 Навыки математики' : '✏️ Навыки русского языка'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {skills.map((skill) => (
          <button
            key={skill.id}
            disabled={skill.locked}
            className={`relative rounded-3xl p-4 shadow-lg transition-all active:scale-95 ${
              skill.locked
                ? 'bg-gray-300 opacity-60'
                : `bg-gradient-to-br ${skill.color}`
            }`}
          >
            {skill.locked && (
              <div className="absolute top-3 right-3">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
            )}
            
            {skill.mastered && !skill.locked && (
              <div className="absolute top-3 right-3">
                <Trophy className="w-5 h-5 text-yellow-400" fill="currentColor" />
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="text-4xl">{skill.icon}</div>
              <div className="font-bold text-center text-sm">{skill.title}</div>
              
              {!skill.locked && (
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(skill.maxLevel)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      fill={i < skill.level ? 'currentColor' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
