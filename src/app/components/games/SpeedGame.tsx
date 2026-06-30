import { useState, useEffect, useMemo } from "react";

interface Question {
  task: string;
  answer: number;
  choices: number[];
}

const SPEED_QS: Question[] = Array.from({ length: 25 }, (_, i) => {
  const a = (i * 7 + 3) % 12 + 1;
  const b = (i * 5 + 2) % 10 + 1;
  const add = i % 3 !== 0;
  if (add) {
    const ans = a + b;
    const w1 = ans + 1, w2 = ans - 1 > 0 ? ans - 1 : ans + 2, w3 = ans + 3;
    const choices = [ans, w1, w2, w3].sort((x, y) => ((i + x) % 4) - ((i + y) % 4));
    return { task: `${a} + ${b} = ?`, answer: ans, choices };
  }
  const big = Math.max(a, b) + (a === b ? 1 : 0);
  const small = Math.min(a, b);
  const ans = big - small;
  const w1 = ans + 1, w2 = ans + 2, w3 = ans > 1 ? ans - 1 : ans + 3;
  const choices = [ans, w1, w2, w3].sort((x, y) => ((i + x) % 4) - ((i + y) % 4));
  return { task: `${big} − ${small} = ?`, answer: ans, choices };
});

interface SpeedGameProps {
  onBack: () => void;
}

export function SpeedGame({ onBack }: SpeedGameProps) {
  const SECS = 30;
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECS);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);

  useEffect(() => {
    if (!started || done) return;
    if (timeLeft <= 0) { setDone(true); return; }
    const t = setInterval(() => setTimeLeft(n => n - 1), 1000);
    return () => clearInterval(t);
  }, [started, done, timeLeft]);

  const handleAnswer = (choice: number) => {
    if (feedback || !started) return;
    const ok = choice === SPEED_QS[qIdx % SPEED_QS.length].answer;
    setFeedback(ok ? "ok" : "bad");
    if (ok) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setQIdx(n => n + 1);
    }, 350);
  };

  const q = SPEED_QS[qIdx % SPEED_QS.length];
  const timePct = (timeLeft / SECS) * 100;
  const stars = score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0;

  if (done) return (
    <div className="flex flex-col min-h-screen items-center justify-center p-5" style={{ background: "#F0EBFF", animation: "screenIn 0.35s ease-out" }}>
      <div className="bg-white rounded-3xl p-7 shadow-xl w-full max-w-sm text-center">
        <div className="text-6xl mb-3">⚡</div>
        <h2 className="font-black text-2xl text-gray-800 mb-1">Время вышло!</h2>
        <p className="text-gray-400 font-bold mb-5">{score} вопросов за {SECS} сек</p>
        <div className="flex justify-center gap-3 mb-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="text-4xl" style={{
              filter: i < stars ? "drop-shadow(0 2px 8px rgba(251,191,36,0.7))" : "grayscale(1) opacity(0.3)",
              animation: i < stars ? `starDrop 0.5s ${0.1 + i * 0.15}s ease-out both` : "none",
            }}>⭐</span>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setDone(false); setStarted(false); setTimeLeft(SECS); setQIdx(0); setScore(0); }}
            className="flex-1 py-3.5 rounded-2xl border-2 border-blue-200 font-black text-blue-700 text-sm active:scale-95">Ещё раз 🔄</button>
          <button onClick={onBack}
            className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#60A5FA,#4F46E5)" }}>Домой 🏠</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F0EBFF", animation: "screenIn 0.3s ease-out" }}>
      <div className="relative overflow-hidden pb-2" style={{ background: "linear-gradient(135deg,#60A5FA,#4F46E5)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg flex-shrink-0">←</button>
          <p className="text-white font-black text-base flex-1">⚡ Быстрый счёт</p>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-2xl px-3 py-1.5 border border-white/30">
            <span className="text-white font-black text-lg">{score}</span>
          </div>
        </div>
        <div className="mx-4 mb-3 h-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timePct}%`, background: timePct > 50 ? "rgba(255,255,255,0.85)" : timePct > 25 ? "#FCD34D" : "#F87171" }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center px-4 pt-6">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-7xl drop-shadow-[0_4px_12px_rgba(96,165,250,0.4)]">⚡</div>
            <h2 className="font-black text-2xl text-gray-800">Быстрый счёт!</h2>
            <p className="text-gray-500 font-bold text-sm">Реши как можно больше примеров за {SECS} секунд</p>
            <button onClick={() => setStarted(true)}
              className="w-48 py-4 rounded-2xl font-black text-white text-lg active:scale-95"
              style={{ background: "linear-gradient(135deg,#60A5FA,#4F46E5)", boxShadow: "0 8px 20px rgba(96,165,250,0.4)" }}>Старт! 🚀</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-black text-5xl"
                style={{ color: timeLeft <= 10 ? "#EF4444" : "#1F2937", animation: timeLeft <= 5 ? "timerPulse 0.5s ease-in-out infinite" : "none" }}>
                {timeLeft}
              </span>
              <span className="text-gray-400 font-bold text-sm">сек</span>
            </div>
            <div className="w-full bg-white rounded-3xl p-6 shadow-xl text-center mb-6"
              style={{ border: feedback === "ok" ? "2px solid #10B981" : feedback === "bad" ? "2px solid #EF4444" : "2px solid transparent", background: feedback === "ok" ? "#F0FDF4" : feedback === "bad" ? "#FFF1F2" : "white", transition: "all 0.2s" }}>
              <p className="font-black text-3xl text-gray-800">{q.task}</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              {q.choices.map((ch, i) => (
                <button key={i} onClick={() => handleAnswer(ch)}
                  className="py-4 rounded-2xl font-black text-xl text-gray-800 bg-white shadow-md active:scale-95 transition-all"
                  style={{ boxShadow: "0 4px 12px rgba(96,165,250,0.15)" }}>{ch}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
