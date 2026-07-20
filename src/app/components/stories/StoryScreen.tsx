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
  math2: {
    id: "math2", title: "🧮 Дело о ловушке времени", subj: "math", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Мур! В доме перепуталось время! Часы сломаны!" },
      { type: "choice", speaker: "Часовщик", emoji: "⏰", text: "3 часа = ? минут", question: "Сколько минут?", options: ["60", "120", "180", "300"], correctAns: "180", explanation: "3 × 60 = 180 минут! ⏱️" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Отлично! А как насчёт недель?" },
      { type: "input", speaker: "Календарь", emoji: "📅", text: "В неделе 7 дней. 3 недели — ?", question: "Дней?", correctAns: "21", explanation: "3 × 7 = 21 день! 📆" },
      { type: "choice", speaker: "Будильник", emoji: "⏲️", text: "Полчаса — ? минут", question: "Минут?", options: ["15", "30", "45", "60"], correctAns: "30", explanation: "60 ÷ 2 = 30 минут! ⏰" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Время снова тикает правильно! 🎉" },
    ],
  },
  math3: {
    id: "math3", title: "🧮 Дело о пиратском сундуке", subj: "math", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Пираты спрятали сокровище! Надо разделить поровну!" },
      { type: "choice", speaker: "Капитан", emoji: "🏴‍☠️", text: "56 монет на 7 пиратов.", question: "Каждому?", options: ["6", "7", "8", "9"], correctAns: "8", explanation: "56 ÷ 7 = 8 монет! 💰" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "А останется?" },
      { type: "input", speaker: "Боцман", emoji: "⚓", text: "43 кокоса на 5 пиратов. Каждому?", question: "Каждому?", correctAns: "8", explanation: "43 ÷ 5 = 8 (ост. 3) 🥥" },
      { type: "choice", speaker: "Кок", emoji: "🍪", text: "99 печений на 9 матросов.", question: "Каждому?", options: ["9", "10", "11", "12"], correctAns: "11", explanation: "99 ÷ 9 = 11 печений! 🍪" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Сундук открыт! Все довольны! 🎉🏆" },
    ],
  },
  math4: {
    id: "math4", title: "🧮 Дело о волшебном саду", subj: "math", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "В саду всё растёт по волшебной формуле! Периметр и площадь!" },
      { type: "choice", speaker: "Садовник", emoji: "🌱", text: "Грядка 6×4 м. Периметр?", question: "Периметр?", options: ["20", "24", "28", "10"], correctAns: "20", explanation: "P = 2×(6+4) = 20 м! 🌿" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "А площадь?" },
      { type: "input", speaker: "Фермер", emoji: "🌾", text: "Поле 8×7 м. Площадь?", question: "Площадь?", correctAns: "56", explanation: "S = 8 × 7 = 56 м²! 🌻" },
      { type: "choice", speaker: "Архитектор", emoji: "🏗️", text: "Квадрат, сторона 9. Периметр?", question: "Периметр?", options: ["18", "27", "36", "81"], correctAns: "36", explanation: "P = 4 × 9 = 36! Не путай с площадью! 🏠" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Сад в полном порядке! Урожай собран! 🎉🌺" },
    ],
  },
  math5: {
    id: "math5", title: "🧮 Дело о космических дробях", subj: "math", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Инопланетяне украли пиццу! Оставили только дроби!" },
      { type: "choice", speaker: "Шеф-повар", emoji: "🍕", text: "Какая больше: 1/3 или 2/3?", question: "Больше?", options: ["1/3", "2/3", "Одинаково", "Не знаю"], correctAns: "2/3", explanation: "2 из 3 > 1 из 3! 🍕" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Надо сократить дроби!" },
      { type: "input", speaker: "Математик", emoji: "📐", text: "Сократи: 2/4", question: "2/4 = ?", correctAns: "1/2", explanation: "Делим на 2: 2/4 = 1/2! ✂️" },
      { type: "choice", speaker: "Астронавт", emoji: "🚀", text: "1/2 + 1/2 = ?", question: "Сумма?", options: ["2/4", "1", "2/2", "1/4"], correctAns: "1", explanation: "1/2 + 1/2 = 1 целое! 🌍" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Пицца возвращена на Землю! 🎉🌍" },
    ],
  },
  rus3: {
    id: "rus3", title: "📝 Дело о смешных синонимах", subj: "russian", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Слова потеряли свои значения! Кто огромный, а кто просто большой?" },
      { type: "choice", speaker: "Словарь", emoji: "📖", text: "Синоним: «весёлый» — ?", question: "Синоним?", options: ["Грустный", "Радостный", "Злой", "Странный"], correctAns: "Радостный", explanation: "Весёлый ≈ радостный! 😄" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "А антонимы?" },
      { type: "choice", speaker: "Антоним", emoji: "🔄", text: "Антоним: «быстрый» — ?", question: "Антоним?", options: ["Скорый", "Медленный", "Ловкий", "Шустрый"], correctAns: "Медленный", explanation: "Быстрый ↔ медленный! 🐢" },
      { type: "input", speaker: "Филолог", emoji: "📚", text: "Синоним к «храбрый»", question: "Храбрый = ?", correctAns: "смелый", explanation: "Храбрый = смелый! 🦁" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Все слова вернулись на место! 🎉" },
    ],
  },
  rus4: {
    id: "rus4", title: "📝 Дело о спрятанных глаголах", subj: "russian", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Глаголы разбежались по времени! Настоящее, прошедшее, будущее!" },
      { type: "choice", speaker: "Хронолог", emoji: "⌛", text: "«Читал» — какое время?", question: "Время?", options: ["Настоящее", "Прошедшее", "Будущее", "Вечное"], correctAns: "Прошедшее", explanation: "Суффикс -Л- → прошедшее! ⏮️" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "А кто как спрягается?" },
      { type: "input", speaker: "Грамматик", emoji: "✍️", text: "Я (что делаю?) чита...", question: "Окончание?", correctAns: "ю", explanation: "Я читаЮ (1 лицо)! 📖" },
      { type: "choice", speaker: "Учитель", emoji: "👨‍🏫", text: "Он (что делает?) дума...", question: "Окончание?", options: ["ет", "ит", "ат", "ют"], correctAns: "ет", explanation: "Он думаЕТ (3 лицо)! 💭" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Глаголы нашли свои времена! 🎉" },
    ],
  },
  rus5: {
    id: "rus5", title: "📝 Дело о великом диктанте", subj: "russian", scenes: [
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Сегодня великий диктант! Проверим все правила!" },
      { type: "choice", speaker: "Орфограф", emoji: "📝", text: '"Пр...бывать" (приближаться)', question: "ПРЕ или ПРИ?", options: ["ПРЕ", "ПРИ"], correctAns: "ПРИ", explanation: "ПРИбывать = приближаться! 🚂" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Отлично! А теперь Н или НН?" },
      { type: "choice", speaker: "Суффикс", emoji: "📋", text: '"Кури...ый суп"', question: "Н или НН?", options: ["Н", "НН"], correctAns: "Н", explanation: "-ИН- → одна Н! 🍲" },
      { type: "input", speaker: "Диктатор", emoji: "🎤", text: 'Он (что делает?) смеёт...', question: "Окончание?", correctAns: "тся", explanation: "Что делает? → ТСЯ! 🎯" },
      { type: "dialogue", speaker: "Кот", emoji: "🐱", text: "Диктант сдан на отлично! 🎉🏆" },
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
