import { useState, useMemo } from "react";
import type { Task } from "../../../types";

interface PairTaskProps {
  task: Task;
  onResolve: (correct: boolean) => void;
}

export function PairTask({ task, onResolve }: PairTaskProps) {
  const pairs = task.pairs || [];
  const total = pairs.length;

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);

  const leftItems = useMemo(() =>
    pairs.map((p, i) => ({ text: p.left, idx: i })).sort(() => Math.random() - 0.5),
  [pairs]);

  const rightItems = useMemo(() =>
    pairs.map((p, i) => ({ text: p.right, idx: i })).sort(() => Math.random() - 0.5),
  [pairs]);

  const handleLeftClick = (idx: number) => {
    if (matched.has(idx) || resolved) return;
    setSelectedLeft(idx);
  };

  const handleRightClick = (idx: number) => {
    if (matched.has(idx) || resolved || selectedLeft === null) return;
    if (selectedLeft === idx) {
      const newMatched = new Set(matched);
      newMatched.add(idx);
      setMatched(newMatched);
      setSelectedLeft(null);
      if (newMatched.size >= total) {
        setResolved(true);
        setTimeout(() => onResolve(true), 400);
      }
    } else {
      setSelectedLeft(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {task.emoji && <div className="text-4xl text-center mb-1">{task.emoji}</div>}
      {task.badge && (
        <div className="text-xs font-black text-center mb-1 px-3 py-1 rounded-full mx-auto bg-green-100 text-green-700 inline-block">
          {task.badge}
        </div>
      )}
      <div className="text-lg font-bold text-center text-gray-800 mb-2">{task.question}</div>
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-2">
          {leftItems.map(item => (
            <button
              key={item.idx}
              onClick={() => handleLeftClick(item.idx)}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-sm border-2 transition-all
                ${matched.has(item.idx) ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                  selectedLeft === item.idx ? "bg-purple-100 border-purple-400" :
                  "bg-white border-slate-200 hover:border-purple-300"}`}
              disabled={matched.has(item.idx) || resolved}
            >
              {matched.has(item.idx) ? "✅ " : ""}{item.text}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {rightItems.map(item => (
            <button
              key={item.idx}
              onClick={() => handleRightClick(item.idx)}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-sm border-2 transition-all
                ${matched.has(item.idx) ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                  "bg-white border-slate-200 hover:border-purple-300"}`}
              disabled={matched.has(item.idx) || resolved}
            >
              {matched.has(item.idx) ? "✅ " : ""}{item.text}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-center text-slate-400 mt-1">Нажимай: левый → правый</p>
      {resolved && (
        <div className="mt-2 p-3 rounded-xl text-sm font-bold text-center bg-emerald-50 text-emerald-700"
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          ✅ {task.explanation || "Все пары верны!"}
        </div>
      )}
    </div>
  );
}
