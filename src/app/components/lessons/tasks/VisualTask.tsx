import { useState } from "react";
import type { Task } from "../../../types";

interface VisualTaskProps {
  task: Task;
  onResolve: (correct: boolean) => void;
}

export function VisualTask({ task, onResolve }: VisualTaskProps) {
  const [resolved, setResolved] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleClick = (idx: number) => {
    if (resolved) return;
    setResolved(true);
    setSelectedIdx(idx);
    const isCorrect = String(task.options![idx]) === String(task.correctAns);
    setTimeout(() => onResolve(isCorrect), 500);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {task.emoji && (
        <div className="text-4xl text-center mb-1">{task.emoji}</div>
      )}
      {task.badge && (
        <div className="text-xs font-black text-center mb-1 px-3 py-1 rounded-full mx-auto bg-pink-100 text-pink-700 inline-block">
          {task.badge}
        </div>
      )}
      {task.svg && (
        <div
          className="w-full max-w-[280px] mx-auto mb-2 text-center"
          dangerouslySetInnerHTML={{ __html: task.svg }}
        />
      )}
      <div className="text-lg font-bold text-center text-gray-800 mb-2">{task.question}</div>
      <div className="flex flex-col gap-2">
        {task.options?.map((opt, idx) => {
          const isSelected = idx === selectedIdx;
          const isCorrect = String(opt) === String(task.correctAns);
          let bg = "bg-white border-slate-200";
          let extra = "";
          if (resolved && isSelected && isCorrect) {
            bg = "bg-emerald-50 border-emerald-500";
            extra = "correctPop";
          } else if (resolved && isSelected && !isCorrect) {
            bg = "bg-red-50 border-red-500";
            extra = "shake";
          } else if (resolved && !isSelected && isCorrect) {
            bg = "bg-emerald-50 border-emerald-500";
          }
          return (
            <button
              key={idx}
              disabled={resolved}
              onClick={() => handleClick(idx)}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-base border-2 transition-all ${bg} ${resolved ? "pointer-events-none" : "hover:border-purple-300 active:scale-95"}`}
              style={extra ? { animation: `${extra} 0.4s ease-out` } : {}}
            >
              <span className="flex items-center justify-center gap-2">
                {resolved && isSelected && isCorrect && "✅ "}
                {resolved && isSelected && !isCorrect && "❌ "}
                {resolved && !isSelected && isCorrect && "✅ "}
                {opt}
              </span>
            </button>
          );
        })}
      </div>
      {resolved && (
        <div className={`mt-2 p-3 rounded-xl text-sm font-bold text-center ${String(task.correctAns) === String(task.options?.[selectedIdx!]) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          {task.explanation}
        </div>
      )}
    </div>
  );
}
