import { useState, useRef } from "react";
import type { Task } from "../../../types";

interface BossTaskProps {
  task: Task;
  onResolve: (correct: boolean) => void;
}

export function BossTask({ task, onResolve }: BossTaskProps) {
  const words = task.words || [];
  const [values, setValues] = useState<string[]>(new Array(words.length).fill(""));
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = () => {
    setResolved(true);
    const res = words.map((w, i) => {
      const val = values[i].trim().toLowerCase();
      return val === w.answer;
    });
    setResults(res);
    const allOk = res.every(r => r);
    onResolve(allOk);
  };

  const getPlaceholder = (answer: string) => {
    if (["н", "нн"].includes(answer)) return "н/нн";
    if (["ь", "ъ"].includes(answer)) return "ь/ъ";
    if (["тся", "ться"].includes(answer)) return "тся/ться";
    if (["и", "е"].includes(answer)) return "и/е";
    return "буква";
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {task.emoji && <div className="text-5xl text-center mb-1">⭐</div>}
      <div className="text-xs font-black text-center mb-1 px-3 py-1 rounded-full mx-auto bg-purple-100 text-purple-700 inline-block">
        Босс
      </div>
      <div className="text-lg font-bold text-center text-gray-800 mb-3">{task.question}</div>
      <div className="flex flex-col gap-2">
        {words.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-bold text-gray-700 w-24 text-right text-sm">{w.text}</span>
            <input
              ref={el => { refs.current[i] = el; }}
              type="text"
              value={values[i]}
              onChange={e => {
                const next = [...values];
                next[i] = e.target.value;
                setValues(next);
              }}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              placeholder={getPlaceholder(w.answer)}
              disabled={resolved}
              className="flex-1 py-2.5 px-3 rounded-xl border-2 border-slate-200 bg-white text-sm outline-none focus:border-purple-400 disabled:opacity-80"
              autoComplete="off"
              maxLength={5}
              style={resolved ? {
                borderColor: results[i] ? "#10B981" : "#EF4444",
                background: results[i] ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              } : {}}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={resolved}
        className="w-full mt-2 py-3 rounded-xl font-black text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 transition-all active:scale-95"
      >
        ✓ Проверить
      </button>
      {resolved && (
        <div className={`mt-2 p-3 rounded-xl text-sm font-bold text-center ${results.every(r => r) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          {results.every(r => r) ? "✅ " + task.explanation : "🤔 " + task.explanation}
        </div>
      )}
    </div>
  );
}
