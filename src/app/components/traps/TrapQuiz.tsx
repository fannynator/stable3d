import { useState } from "react";
import type { Trap } from "../../types";

interface TrapQuizProps {
  trap: Trap;
  catEmoji: string;
  onResolve: (correct: boolean) => void;
  onClose: () => void;
}

export function TrapQuiz({ trap, catEmoji, onResolve, onClose }: TrapQuizProps) {
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  const handleSuccess = () => {
    setDone(true);
    setResult(true);
    setTimeout(() => { onResolve(true); onClose(); }, 1500);
  };

  const handleFail = () => {
    setDone(true);
    setResult(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,16,64,0.95)]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-3">
          <div className="text-4xl mb-1">{catEmoji}</div>
          <div className="font-black text-sm text-gray-800">Кот-Учёный</div>
          <div className="text-xs text-gray-400 mt-1">«Ой, тут мы ошиблись! Давай разберёмся вместе…»</div>
        </div>

        <div className="text-center font-semibold text-[15px] text-gray-700 mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100 leading-relaxed">
          {trap.question}
        </div>

        {trap.isInput ? (
          <TrapInputQuiz trap={trap} done={done} onSuccess={handleSuccess} onFail={handleFail} />
        ) : (
          <TrapChoiceQuiz trap={trap} done={done} onSuccess={handleSuccess} onFail={handleFail} />
        )}

        {done && (
          <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center ${result ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {result ? (
              <><div className="text-2xl mb-1">{catEmoji}</div>«Отлично!» ✅ {trap.explanation}</>
            ) : (
              <><div className="text-2xl mb-1">{catEmoji}</div>«Вот тут подвох!» 🤔 {trap.explanation}<div className="mt-1">✅ Правильный ответ: {trap.answer}</div></>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-3 rounded-xl font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all">
          Закрыть
        </button>
      </div>
    </div>
  );
}

function TrapChoiceQuiz({ trap, done, onSuccess, onFail }: { trap: Trap; done: boolean; onSuccess: () => void; onFail: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = trap.correct!;

  const handleClick = (idx: number) => {
    if (done) return;
    setSelected(idx);
    if (idx === correct) onSuccess();
    else onFail();
  };

  return (
    <div className="flex flex-col gap-2">
      {trap.options?.map((opt, idx) => {
        let bg = "bg-white border-slate-200";
        if (done && idx === selected && idx === correct) bg = "bg-emerald-50 border-emerald-500";
        if (done && idx === selected && idx !== correct) bg = "bg-red-50 border-red-500";
        if (done && idx !== selected && idx === correct) bg = "bg-emerald-50 border-emerald-500";
        return (
          <button key={idx} disabled={done} onClick={() => handleClick(idx)}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-[15px] border-2 transition-all ${bg} ${done ? "pointer-events-none" : "hover:border-purple-300"}`}>
            {done && idx === selected && idx === correct && "✅ "}
            {done && idx === selected && idx !== correct && "❌ "}
            {done && idx !== selected && idx === correct && "✅ "}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TrapInputQuiz({ trap, done, onSuccess, onFail }: { trap: Trap; done: boolean; onSuccess: () => void; onFail: () => void }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (done) return;
    if (value.trim().toLowerCase() === String(trap.answer).toLowerCase()) onSuccess();
    else onFail();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
        placeholder="Ответ"
        disabled={done}
        className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm outline-none focus:border-purple-400 disabled:opacity-80"
        autoComplete="off"
      />
      <button onClick={handleSubmit} disabled={done}
        className="py-3 px-5 rounded-xl font-black text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50">✓</button>
    </div>
  );
}
