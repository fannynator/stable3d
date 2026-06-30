import { CheckCircle2, Circle } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  progress: number;
  total: number;
  reward: number;
  completed: boolean;
}

interface DailyQuestsProps {
  quests: Quest[];
}

export function DailyQuests({ quests }: DailyQuestsProps) {
  return (
    <div className="px-4 py-3">
      <h2 className="font-bold text-lg mb-3">🎯 Ежедневные задания</h2>
      <div className="space-y-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {quest.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" fill="currentColor" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{quest.title}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all"
                      style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {quest.progress}/{quest.total}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-200 px-2.5 py-1 rounded-full">
                <span className="text-sm font-bold">+{quest.reward}</span>
                <span className="text-xs">💎</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
