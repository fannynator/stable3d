import { useState, useEffect, useCallback } from "react";
import type { Skill, Task, Subject, Trap } from "../../types";
import { GEMS } from "../../config";
import { ChoiceTask } from "./tasks/ChoiceTask";
import { VisualTask } from "./tasks/VisualTask";
import { InputTask } from "./tasks/InputTask";
import { PairTask } from "./tasks/PairTask";
import { BossTask } from "./tasks/BossTask";

interface LessonScreenProps {
  skill: Skill;
  tasks: Task[];
  onFinish: (correct: number, wrong: number) => void;
  onAddTrap: (trap: Trap) => void;
  onClose: () => void;
}

export function LessonScreen({ skill, tasks, onFinish, onAddTrap, onClose }: LessonScreenProps) {
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [history, setHistory] = useState<string[]>(new Array(tasks.length).fill("pending"));
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);

  const total = tasks.length;
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;

  const handleResolve = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrect(c => c + 1);
      setHistory(prev => { const n = [...prev]; n[step] = "correct"; return n; });
    } else {
      setWrong(w => w + 1);
      setHistory(prev => { const n = [...prev]; n[step] = "wrong"; return n; });

      const task = tasks[step];
      const trap: Trap = {
        id: `lesson_${skill.id}_${Date.now()}`,
        question: task.question,
        options: task.options || null,
        correct: task.options ? task.options.findIndex(o => String(o) === String(task.correctAns)) : null,
        answer: task.correctAns,
        explanation: task.explanation,
        source: `Урок: ${skill.name}`,
        defuses: 0,
        nextDate: new Date().toISOString(),
        isInput: task.type === "input" || task.type.startsWith("boss"),
        subject: skill.id.startsWith("r") ? "russian" : "math",
      };
      onAddTrap(trap);
    }
    setTimeout(() => setShowNext(true), 800);
  }, [step, tasks, skill, onAddTrap]);

  useEffect(() => {
    setShowNext(false);
  }, [step]);

  const goNext = () => {
    if (step + 1 >= total) {
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  };

  if (done) {
    const ratio = correct / total;
    const stars = ratio >= 1 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.4 ? 1 : 0;
    const xp = correct * GEMS.LESSON_XP_PER_CORRECT + (wrong === 0 ? GEMS.LESSON_PERFECT_BONUS : 0);

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#F0EBFF", animation: "screenIn 0.35s ease-out" }}>
        <div className="relative overflow-hidden p-5 text-center" style={{ background: skill.gradient, paddingBottom: 48 }}>
          <div className="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full bg-white/10" />
          <button onClick={onClose} className="absolute top-5 left-4 w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg">←</button>
          <div className="text-5xl mb-2 drop-shadow-lg">{skill.icon}</div>
          <p className="text-white font-black text-lg">{skill.name}</p>
          <p className="text-white/75 font-bold text-sm">Урок завершён!</p>
        </div>
        <div className="mx-4 -mt-8 bg-white rounded-3xl p-6 shadow-xl relative z-10">
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2].map(i => (
              <span key={i} className="text-5xl" style={{
                filter: i < stars ? "drop-shadow(0 2px 8px rgba(251,191,36,0.7))" : "grayscale(1) opacity(0.3)",
                animation: i < stars ? `starDrop 0.5s ${0.1 + i * 0.15}s ease-out both` : "none",
              }}>⭐</span>
            ))}
          </div>
          <p className="text-center font-black text-2xl text-gray-800 mb-1">{correct} / {total} правильно</p>
          <p className="text-center text-gray-400 font-bold text-sm mb-5">
            {stars === 3 ? "Блестяще! Ты настоящий гений! 🏆" : stars === 2 ? "Отличная работа! 😸" : stars === 1 ? "Хорошее начало! 💪" : "Не расстраивайся, попробуй ещё! 🐾"}
          </p>
          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5">
            <span className="text-2xl">💎</span>
            <span className="font-black text-amber-700 text-lg">+{xp} гемов!</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep(0); setCorrect(0); setWrong(0); setHistory(new Array(total).fill("pending")); setDone(false); }}
              className="flex-1 py-3.5 rounded-2xl border-2 border-purple-200 font-black text-purple-700 text-sm active:scale-95">Ещё раз 🔄</button>
            <button onClick={() => onFinish(correct, wrong)}
              className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95"
              style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>Домой 🏠</button>
          </div>
        </div>
      </div>
    );
  }

  const task = tasks[step];
  if (!task) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0EBFF", animation: "screenIn 0.3s ease-out" }}>
      <div className="relative overflow-hidden pb-2" style={{ background: skill.gradient }}>
        <div className="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full bg-white/10" />
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg flex-shrink-0">←</button>
          <div className="flex-1">
            <p className="text-white font-black text-base leading-tight">{skill.name}</p>
            <p className="text-white/70 text-xs font-bold">Задание {step + 1} из {total}</p>
          </div>
          <div className="text-3xl drop-shadow-lg">{skill.icon}</div>
        </div>
        <div className="mx-4 mb-3 h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-center gap-1.5 px-4 pb-1">
          {history.map((s, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${s === "correct" ? "bg-emerald-400" : s === "wrong" ? "bg-red-400" : i === step ? "bg-white ring-2 ring-white/50" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-6 overflow-y-auto">
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-5" style={{ animation: "fadeSlideUp 0.35s ease-out" }}>
          {task.type === "visual" && <VisualTask task={task} onResolve={handleResolve} />}
          {task.type === "choice" && <ChoiceTask task={task} onResolve={handleResolve} />}
          {task.type === "input" && <InputTask task={task} onResolve={handleResolve} />}
          {task.type === "pair" && <PairTask task={task} onResolve={handleResolve} />}
          {task.type.startsWith("boss") && <BossTask task={task} onResolve={handleResolve} />}
        </div>

        {showNext && !done && (
          <button onClick={goNext}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95"
            style={{ background: skill.gradient, animation: "fadeSlideUp 0.3s ease-out" }}>
            Далее ▸
          </button>
        )}
      </div>
    </div>
  );
}
