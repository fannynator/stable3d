import { useState, useMemo } from "react";
import { PET_DEFS } from "../../config";

interface StoryScene {
  type: string;
  speaker: string;
  emoji: string;
  text: string;
  question?: string;
  options?: string[];
  correctAns?: string;
  explanation?: string;
}

const STORY_SRC: Record<string, { id: string; title: string; subj: string; scenes: StoryScene[] }> = {
  math: {
    id: "math", title: "🧮 Дело о пропавшем торте", subj: "math", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Мур! Украли торт!" },
      { type: "choice", speaker: "Следователь", emoji: "🔍", text: "3 ряда по 8 следов.", question: "3×8=?", options: ["18", "24", "28", "32"], correctAns: "24", explanation: "3×8=24 🐾" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "24 следа! Трое подозреваемых." },
      { type: "input", speaker: "Бухгалтер", emoji: "🧾", text: "Торт 120 монет. Вор оставил половину.", question: "120÷2=?", correctAns: "60", explanation: "120÷2=60 💰" },
      { type: "choice", speaker: "Сорока", emoji: "🦜", text: "4 друга × 2 куска. Торт на 8.", question: "Хватит?", options: ["Да", "Нет", "Ровно 8", "Больше"], correctAns: "Ровно 8", explanation: "4×2=8! 🍰" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Енот! Дело закрыто! 🎉" },
    ],
  },
  rus1: {
    id: "rus1", title: "📝 Дело о пропавшей запятой", subj: "russian", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Из газеты исчезли запятые!" },
      { type: "choice", speaker: "Редактор", emoji: "📰", text: '"Кот пр...бывает".', question: "ПРЕ или ПРИ?", options: ["Е", "И", "Ы", "Э"], correctAns: "И", explanation: "ПРИбывает 🚂" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Дальше — ресторан..." },
      { type: "choice", speaker: "Критик", emoji: "🍽️", text: '"Кури...ый суп".', question: "Н или НН?", options: ["Н", "НН"], correctAns: "Н", explanation: "Одна Н — суффикс -ИН- 🐔" },
      { type: "choice", speaker: "Секретарша", emoji: "💼", text: '"Казнить нельзя помиловать".', question: "Где запятая?", options: ["Казнить, нельзя", "Казнить нельзя,", "Казнить нельзя помиловать,", "Не нужна"], correctAns: "Казнить нельзя,", explanation: "После «нельзя»! ☠️→😇" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Язык спасён! 🎉📚" },
    ],
  },
  rus2: {
    id: "rus2", title: "📝 Дело о двойных согласных", subj: "russian", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "В библиотеке пропали буквы Н!" },
      { type: "choice", speaker: "Библиотекарь", emoji: "📚", text: '"Стекля...ый стакан".', question: "Н или НН?", options: ["Н", "НН"], correctAns: "НН", explanation: "СтекляННый — исключение! 🔮" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Ого! Исключение!" },
      { type: "choice", speaker: "Писатель", emoji: "✍️", text: '"Ветре...ый день".', question: "Н или НН?", options: ["Н", "НН"], correctAns: "Н", explanation: "ВетреНый — одна Н 🌬️" },
      { type: "input", speaker: "Поэт", emoji: "🎭", text: '"Пусты...ый пляж".', question: "Сколько Н?", correctAns: "нн", explanation: "ПустыННый — стык корня и суффикса 🏖️" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Все буквы на месте! 🎉" },
    ],
  },
};

interface StoryScreenProps {
  storyId: string;
  onFinish: () => void;
  onClose: () => void;
}

export function StoryScreen({ storyId, onFinish, onClose }: StoryScreenProps) {
  const story = STORY_SRC[storyId];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!story) return null;
  const scene = story.scenes[step];
  if (!scene) { onFinish(); return null; }

  const total = story.scenes.length;

  const handleChoice = (choice: string) => {
    if (resolved) return;
    setSelected(choice);
    setResolved(true);
    const ok = choice === scene.correctAns;
    setIsCorrect(ok);
    setTimeout(() => {
      if (step + 1 >= total) setDone(true);
      else { setStep(s => s + 1); setSelected(null); setResolved(false); setIsCorrect(false); }
    }, 1500);
  };

  const handleInput = (val: string) => {
    setResolved(true);
    const ok = val.trim().toLowerCase() === String(scene.correctAns).toLowerCase();
    setIsCorrect(ok);
    setSelected(val);
    setTimeout(() => {
      if (step + 1 >= total) setDone(true);
      else { setStep(s => s + 1); setSelected(null); setResolved(false); setIsCorrect(false); }
    }, 1500);
  };

  if (done) {
    const petDef = PET_DEFS.find(p => p.storyId === storyId);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ background: "#F0EBFF", animation: "screenIn 0.35s ease-out" }}>
        <div className="bg-white rounded-3xl p-7 shadow-xl w-full max-w-sm text-center">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="font-black text-2xl text-gray-800 mb-1">Дело раскрыто!</h2>
          <p className="text-gray-400 font-bold mb-4">{story.subj === "math" ? "Торт найден!" : "Язык спасён! 📚"}</p>

          {petDef && (
            <div className="mb-4 p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50" style={{ animation: "fadeSlideUp 0.5s ease-out" }}>
              <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">Новый питомец!</div>
              <div className="text-5xl mb-2" style={{ animation: "catBounce 0.8s ease-out" }}>{petDef.emoji}</div>
              <div className="font-black text-gray-800 text-lg">{petDef.name}</div>
              <div className="text-gray-500 text-sm font-bold mt-1">{petDef.description}</div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5">
            <span className="text-2xl">💎</span>
            <span className="font-black text-amber-700 text-lg">+{story.subj === "math" ? 40 : 50} гемов!</span>
          </div>
          <button onClick={() => { onFinish(); }}
            className="w-full py-3.5 rounded-2xl font-black text-white text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>Домой 🏠</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0EBFF", animation: "screenIn 0.3s ease-out" }}>
      <div className="relative overflow-hidden pb-2"
        style={{ background: story.subj === "math" ? "linear-gradient(135deg,#34D399,#059669)" : "linear-gradient(135deg,#F472B6,#DB2777)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg flex-shrink-0">←</button>
          <p className="text-white font-black text-base flex-1">{story.title}</p>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i < step ? "bg-white/80" : i === step ? "bg-white ring-2 ring-white/50" : "bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center px-4 pt-5 overflow-y-auto">
        <div className="w-full bg-white rounded-3xl p-6 shadow-xl mb-5 text-center" style={{ animation: "fadeSlideUp 0.35s ease-out" }}>
          <div className="text-5xl mb-2">{scene.emoji}</div>
          <div className="font-black text-gray-400 text-sm mb-1">{scene.speaker}</div>
          <div className="text-lg font-bold text-gray-800 mb-3">{scene.text}</div>

          {scene.type !== "dialogue" && (
            <>
              <div className="font-bold text-gray-700 mb-3">{scene.question}</div>
              {scene.type === "choice" && scene.options && (
                <div className="flex flex-col gap-2">
                  {scene.options.map((opt, i) => {
                    const isSel = selected === opt;
                    const isRight = opt === scene.correctAns;
                    let bg = "bg-white border-slate-200";
                    if (resolved && isSel && isRight) bg = "bg-emerald-50 border-emerald-500";
                    if (resolved && isSel && !isRight) bg = "bg-red-50 border-red-500";
                    if (resolved && !isSel && isRight) bg = "bg-emerald-50 border-emerald-500";
                    return (
                      <button key={i} disabled={resolved} onClick={() => handleChoice(opt)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-base border-2 transition-all ${bg} ${resolved ? "pointer-events-none" : "hover:border-purple-300 active:scale-95"}`}>
                        {resolved && isSel && isRight && "✅ "}
                        {resolved && isSel && !isRight && "❌ "}
                        {resolved && !isSel && isRight && "✅ "}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {scene.type === "input" && (
                <StoryInput onSubmit={handleInput} disabled={resolved} />
              )}
              {resolved && (
                <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                  style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                  {isCorrect ? "✅ Верно! " : "🤔 "}{scene.explanation}
                </div>
              )}
            </>
          )}
        </div>
        {scene.type === "dialogue" && (
          <button onClick={() => {
            if (step + 1 >= total) setDone(true);
            else setStep(s => s + 1);
          }}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95"
            style={{ background: story.subj === "math" ? "linear-gradient(135deg,#34D399,#059669)" : "linear-gradient(135deg,#F472B6,#DB2777)", animation: "fadeSlideUp 0.3s ease-out" }}>
            Далее ▸
          </button>
        )}
      </div>
    </div>
  );
}

function StoryInput({ onSubmit, disabled }: { onSubmit: (val: string) => void; disabled: boolean }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <input type="text" value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSubmit(val); }}
        placeholder="Ответ" disabled={disabled} autoComplete="off"
        className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-base outline-none focus:border-purple-400 disabled:opacity-80" />
      <button onClick={() => onSubmit(val)} disabled={disabled}
        className="py-3 px-5 rounded-xl font-black text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-50">✓</button>
    </div>
  );
}
