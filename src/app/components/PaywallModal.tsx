import { getTrialDaysLeft, startTrial, activateSubscription } from "../useSubscription";

interface PaywallModalProps {
  onSubscribe: () => void;
  onClose: () => void;
}

export function PaywallModal({ onSubscribe, onClose }: PaywallModalProps) {
  const daysLeft = getTrialDaysLeft();

  const handleStartTrial = () => {
    // For now: activate trial immediately (no payment)
    startTrial();
    activateSubscription();
    onSubscribe();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 10, 40, 0.93)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeSlideUp 0.4s ease-out" }}>

        {/* Header gradient */}
        <div className="px-6 pt-6 pb-4 text-center"
          style={{ background: "linear-gradient(160deg, #4C1D95, #7C3AED, #A78BFA)" }}>
          <div className="text-5xl mb-2">🐱</div>
          <h1 className="text-white font-black text-2xl mb-1">Кот Учёный Premium</h1>
          <p className="text-purple-200 text-sm">Говорящий кот с ИИ-голосом</p>
        </div>

        {/* Features */}
        <div className="px-6 py-4 space-y-3">
          <Feature emoji="🗣️" title="Кот говорит!" desc="Кокоро-82М — нейросетевой голос кота. Реагирует на ребёнка, шутит, хвалит." />
          <Feature emoji="🎤" title="Кот слышит!" desc="Whisper распознаёт речь. Ребёнок говорит — кот отвечает." />
          <Feature emoji="📚" title="Безлимитные уроки" desc="Все темы ФГОС 1-4 класс. Математика + русский язык." />
          <Feature emoji="🎮" title="Все игры открыты" desc="Flappy Cat, Doodle Cat, Hill Climb и другие без ограничений." />
        </div>

        {/* Trial info */}
        <div className="px-6 pb-2">
          <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-200">
            <p className="text-amber-800 font-black text-sm">
              🎁 7 дней бесплатно
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              {daysLeft > 0
                ? `Осталось ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} триала`
                : "Начните пробный период!"}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <button onClick={handleStartTrial}
            className="w-full py-3.5 rounded-2xl font-black text-white text-base active:scale-95 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
            {daysLeft > 0 ? "Продолжить бесплатно 🚀" : "Начать 7 дней бесплатно 🎁"}
          </button>
          <button onClick={() => { activateSubscription(); onSubscribe(); }}
            className="w-full py-3.5 rounded-2xl font-black text-white text-base active:scale-95 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
            Premium — 299 ₽/мес ⭐
          </button>
          <p className="text-center text-gray-400 text-[10px]">
            Оплата через RuStore. Отмена в любой момент.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
        {emoji}
      </div>
      <div>
        <p className="font-black text-sm text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
