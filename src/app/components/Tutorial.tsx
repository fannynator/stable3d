import { useState } from "react";

const TUTORIAL_KEY = "kot_ucheniy_tutorial_done";

export function hasTutorialDone(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === "true";
}

const PANELS = [
  { img: "/tutorial/panel1.webp", title: "Привет!", text: "Я — Кот-учёный! Будем вместе учиться, играть и расти!", emoji: "🐱" },
  { img: "/tutorial/panel2.webp", title: "Кто ты?", text: "Выбери: я буду учиться или я родитель", emoji: "👧" },
  { img: "/tutorial/panel3.webp", title: "Уроки", text: "Математика и русский язык — 55 тем от 1 до 4 класса!", emoji: "📚" },
  { img: "/tutorial/panel4.webp", title: "Кристаллы", text: "Реши задачу — заработай кристаллы на шляпы и питомцев!", emoji: "💎" },
  { img: "/tutorial/panel5.webp", title: "Твоя комната", text: "Погладь кота, покорми, поиграй — он станет твоим другом!", emoji: "🏠" },
  { img: "/tutorial/panel6.webp", title: "Игры!", text: "Flappy Cat, гонки, карточки памяти — учись играя!", emoji: "🎮" },
];

interface TutorialProps {
  onFinish: () => void;
}

export function Tutorial({ onFinish }: TutorialProps) {
  const [step, setStep] = useState(0);

  const handleFinish = () => {
    localStorage.setItem(TUTORIAL_KEY, "true");
    onFinish();
  };

  const handleNext = () => {
    if (step < PANELS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const panel = PANELS[step];
  const isLast = step === PANELS.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "linear-gradient(160deg, #2D1B69, #1a0a3e)" }}>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-4">
        {PANELS.map((_, i) => (
          <div key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? "bg-white scale-125" : i < step ? "bg-purple-400" : "bg-white/20"}`} />
        ))}
      </div>

      {/* Image / emoji area */}
      <div className="flex-1 flex items-center justify-center px-6 pb-4"
        style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
        <div className="relative w-full max-w-xs flex flex-col items-center">
          <img
            src={panel.img}
            alt={panel.title}
            className="w-full rounded-3xl shadow-2xl"
            style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
          />
          {/* Emoji fallback is always shown below or instead */}
          <div className="text-[100px] leading-none mt-4">{panel.emoji}</div>
        </div>
      </div>

      {/* Text */}
      <div className="px-6 pb-8 text-center">
        <h2 className="text-white font-black text-2xl mb-2">{panel.title}</h2>
        <p className="text-purple-200 text-sm font-semibold leading-relaxed">{panel.text}</p>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-10 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 rounded-2xl font-black text-purple-300 text-sm border border-purple-500/30 active:scale-95 transition-all">
            Назад
          </button>
        )}
        <button onClick={handleNext}
          className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95 transition-all shadow-lg"
          style={{ background: isLast
            ? "linear-gradient(135deg, #10B981, #059669)"
            : "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
          {isLast ? "Начать! 🚀" : "Далее →"}
        </button>
        {!isLast && (
          <button onClick={handleFinish}
            className="px-4 py-3.5 rounded-2xl font-bold text-white/40 text-sm active:scale-95 transition-all">
            Пропустить
          </button>
        )}
      </div>
    </div>
  );
}