import { useState, useCallback, useEffect } from "react";
import type { AIStructuredTask } from "../../core/tasks/ai-schema";
import { catSpeak, catStop, catListen, catPrefetch, catSpeakCached, catClearCache } from "../voice";

interface TaskModalProps {
  tasks: AIStructuredTask[];
  currentIndex: number;
  source: "ai" | "local";
  correctCount: number;
  wrongCount: number;
  topicId: string;
  stars: number;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
}

type Phase = "question" | "correct" | "wrong" | "closing";

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_COLORS = [
  "from-[#3B82F6] to-[#2563EB]",
  "from-[#EF4444] to-[#DC2626]",
  "from-[#F59E0B] to-[#D97706]",
  "from-[#8B5CF6] to-[#6D28D9]",
];

export function TaskModal({ tasks, currentIndex, source, correctCount, wrongCount, topicId, stars, onAnswer, onClose }: TaskModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("question");
  const [isClosing, setIsClosing] = useState(false);
  const [earnedStar, setEarnedStar] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const isSessionEnd = currentIndex >= tasks.length;
  const total = tasks.length;
  const passed = correctCount >= 4;
  const task = isSessionEnd ? null : tasks[currentIndex];

  // Reset phase when task changes
  useEffect(() => {
    setSelectedIndex(null);
    setPhase("question");

    if (task && !isSessionEnd && task.catNarrative) {
      // Play cached or generate live
      catSpeakCached(`task_${currentIndex}`, task.catNarrative);
    }

    // Prefetch next task's audio in background
    const nextIndex = currentIndex + 1;
    if (nextIndex < tasks.length && tasks[nextIndex]?.catNarrative) {
      catPrefetch(`task_${nextIndex}`, tasks[nextIndex].catNarrative);
    }

    // Prefetch feedback phrases for instant response
    catPrefetch("feedback_correct", "Молодец! Всё верно! Мур!");
    catPrefetch("feedback_wrong", "Ничего страшного! Попробуй ещё раз! Мяу!");
  }, [currentIndex]);

  // Stop speech and clear cache on unmount
  useEffect(() => () => { catStop(); catClearCache(); }, []);

  const handleSelect = useCallback((index: number) => {
    if (phase !== "question" || !task) return;
    setSelectedIndex(index);
    const correct = index === task.correctIndex;
    setPhase(correct ? "correct" : "wrong");
    // Play feedback phrase from cache (prefetched in useEffect)
    if (correct) {
      catSpeakCached("feedback_correct", "Молодец! Всё верно! Мур!");
    } else {
      catSpeakCached("feedback_wrong", "Ничего страшного! Попробуй ещё раз! Мяу!");
    }
    onAnswer(correct);
  }, [phase, task, onAnswer]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    catClearCache();
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleMic = useCallback(async () => {
    if (isListening) return;
    catStop();
    setIsListening(true);
    try {
      const text = await catListen();
      if (text) {
        await catSpeak(`Мур! Ты сказал: «${text}». Мяу!`);
      }
    } catch {
      // Silently fail
    } finally {
      setIsListening(false);
    }
  }, [isListening]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isSessionEnd || phase !== "question")) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, isSessionEnd, phase]);

  // Detect star earned on session summary
  useEffect(() => {
    if (isSessionEnd && passed) {
      setEarnedStar(true);
    }
  }, [isSessionEnd, passed]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
      style={{ background: "rgba(15, 10, 40, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && (isSessionEnd || phase !== "question")) handleClose(); }}
    >
      <div
        className={`w-full max-w-sm rounded-[28px] overflow-hidden transition-all duration-300 ${isClosing ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}
        style={{
          background: "linear-gradient(160deg, #4C1D95 0%, #5B21B6 60%, #7C3AED 100%)",
          boxShadow: "0 20px 60px rgba(76, 29, 149, 0.5)",
          animation: "fadeSlideUp 0.35s ease-out",
        }}
      >
        {/* Cat header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-3xl flex-shrink-0"
            style={{ animation: "catBreathe 2s ease-in-out infinite" }}>
            🐱
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/70 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
              Кот-учёный {source === "ai" ? "✨ AI" : "📚"}
              {!isSessionEnd && (
                <span className="text-white/50">• Вопрос {currentIndex + 1} из {total}</span>
              )}
            </div>
            <div className="text-white font-black text-sm leading-tight line-clamp-2">
              {isSessionEnd ? "Результаты сессии" : task?.catNarrative || "Мур! Готов к заданию?"}
            </div>
          </div>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Progress bar */}
        {!isSessionEnd && (
          <div className="px-5 pb-2">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/70 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex) / total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Session end summary */}
        {isSessionEnd ? (
          <div className="px-5 pb-5">
            <div className={`backdrop-blur-sm rounded-2xl px-4 py-4 border ${passed ? "bg-emerald-500/20 border-emerald-400/30" : "bg-amber-500/20 border-amber-400/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{passed ? "🌟" : "💪"}</span>
                <span className={`font-black text-sm ${passed ? "text-emerald-300" : "text-amber-300"}`}>
                  {passed ? "Сессия пройдена!" : "Попробуй ещё раз!"}
                </span>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">
                Правильно: <span className="font-black text-emerald-300">{correctCount}</span> из {total}
                {wrongCount > 0 && <span className="text-amber-300"> • Ошибок: {wrongCount}</span>}
              </p>
              {passed && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-emerald-200/80">Заработана звезда!</span>
                  <span className="text-lg animate-bounce">⭐</span>
                </div>
              )}
              {/* Stars display */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3].map(i => (
                  <span key={i} className={`text-xl transition-all duration-300 ${i <= stars || (earnedStar && i <= stars + 1) ? "opacity-100 scale-100" : "opacity-25 scale-75"}`}>
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="mt-3 w-full py-3 rounded-2xl bg-white text-[#5B21B6] font-black text-sm active:scale-95 transition-transform">
              {passed ? "Отлично! 🚀" : "Понятно 🐾"}
            </button>
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="px-5 pb-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-start gap-2">
                <p className="text-white text-base font-semibold leading-relaxed flex-1">{task?.question}</p>
                <button onClick={() => task && catSpeak(task.question)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm hover:bg-white/25 active:scale-90 transition-all"
                  title="Озвучить">🔊</button>
                <button onClick={handleMic}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-white/25 active:scale-90 transition-all ${isListening ? "bg-red-500/60 animate-pulse" : "bg-white/15"}`}
                  title="Сказать ответ">🎤</button>
              </div>
            </div>

            {/* Options */}
            <div className="px-5 pb-5 grid grid-cols-1 gap-2.5">
              {task?.options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isCorrect = i === task.correctIndex;
                const showResult = phase !== "question";

                let bgClass = "bg-white/15 hover:bg-white/25";
                if (showResult && isCorrect) bgClass = "bg-emerald-500/80";
                else if (showResult && isSelected && !isCorrect) bgClass = "bg-red-500/80";
                else if (isSelected && !showResult) bgClass = "bg-white/30";

                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={phase !== "question"}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200
                      ${bgClass} ${phase === "question" ? "cursor-pointer active:scale-[0.97]" : "cursor-default"}
                      ${showResult && !isCorrect && !isSelected ? "opacity-50" : ""}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 bg-gradient-to-br ${OPTION_COLORS[i]}`}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="text-white text-[15px] font-semibold leading-snug flex-1">{option}</span>
                    {showResult && isCorrect && <span className="text-lg">✅</span>}
                    {showResult && isSelected && !isCorrect && <span className="text-lg">❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {phase === "correct" && task && (
              <div className="px-5 pb-5 animate-[fadeSlideUp_0.3s_ease-out]">
                <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-emerald-400/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🌟</span>
                    <span className="text-emerald-300 font-black text-sm">Правильно!</span>
                  </div>
                  <p className="text-emerald-200/80 text-xs leading-relaxed">{task.explanation}</p>
                </div>
                <p className="text-white/50 text-[10px] text-center mt-2">
                  {currentIndex + 1 < total ? "Кликни вне окна для следующего вопроса" : "Сессия завершена!"}
                </p>
              </div>
            )}

            {phase === "wrong" && task && (
              <div className="px-5 pb-5 animate-[fadeSlideUp_0.3s_ease-out]">
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-amber-400/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🤔</span>
                    <span className="text-amber-300 font-black text-sm">Почти!</span>
                  </div>
                  <p className="text-amber-200/80 text-xs leading-relaxed">{task.catHint}</p>
                </div>
                <p className="text-white/50 text-[10px] text-center mt-2">Кликни вне окна для продолжения</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
