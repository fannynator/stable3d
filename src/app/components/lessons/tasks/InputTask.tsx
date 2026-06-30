import { useState, useRef } from "react";
import type { Task } from "../../../types";

interface InputTaskProps {
  task: Task;
  onResolve: (correct: boolean) => void;
}

export function InputTask({ task, onResolve }: InputTaskProps) {
  const [value, setValue] = useState("");
  const [resolved, setResolved] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getPlaceholder = () => {
    const ans = String(task.correctAns).toLowerCase();
    if (ans === "н" || ans === "нн") return "н/нн";
    if (ans === "ь" || ans === "ъ") return "ь/ъ";
    if (ans === "тся" || ans === "ться") return "тся/ться";
    if (ans === "и" || ans === "е") return "букву";
    if (!isNaN(Number(task.correctAns))) return "Число";
    return "Ответ";
  };

  const handleSubmit = () => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      inputRef.current?.style.setProperty("border-color", "var(--red, #EF4444)");
      return;
    }
    setResolved(true);
    const correctStr = String(task.correctAns).toLowerCase();
    let ok = trimmed === correctStr;
    if (!ok && correctStr.includes(",")) {
      ok = trimmed === correctStr.replace(/\s+/g, "");
    }
    setIsCorrect(ok);
    onResolve(ok);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {task.emoji && (
        <div className="text-4xl text-center mb-1">{task.emoji}</div>
      )}
      {task.badge && (
        <div className="text-xs font-black text-center mb-1 px-3 py-1 rounded-full mx-auto bg-blue-100 text-blue-700 inline-block">
          {task.badge}
        </div>
      )}
      <div className="text-lg font-bold text-center text-gray-800 mb-2">{task.question}</div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
          placeholder={getPlaceholder()}
          disabled={resolved}
          className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-base outline-none focus:border-purple-400 disabled:opacity-80"
          autoComplete="off"
          style={resolved ? {
            borderColor: isCorrect ? "#10B981" : "#EF4444",
            background: isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          } : {}}
        />
        <button
          onClick={handleSubmit}
          disabled={resolved}
          className="py-3 px-5 rounded-xl font-black text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50 transition-all active:scale-95"
        >
          ✓
        </button>
      </div>
      {resolved && (
        <div className={`mt-2 p-3 rounded-xl text-sm font-bold text-center ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          {isCorrect ? "✅ " + task.explanation : "🤔 " + task.explanation + " ✅ " + task.correctAns}
        </div>
      )}
    </div>
  );
}
