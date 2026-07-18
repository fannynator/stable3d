interface GameItem {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  gradient: string;
  shadow: string;
  locked: boolean;
}

const EDUCATIONAL_GAMES: GameItem[] = [
  { id: "speed", emoji: "⚡", title: "Быстрый счёт", desc: "Реши примеры за время!", gradient: "linear-gradient(135deg,#60A5FA,#4F46E5)", shadow: "0 8px 20px rgba(96,165,250,0.4)", locked: false },
  { id: "memory", emoji: "🎴", title: "Карточки памяти", desc: "Найди все пары!", gradient: "linear-gradient(135deg,#FCD34D,#F97316)", shadow: "0 8px 20px rgba(252,211,77,0.45)", locked: false },
  { id: "doodle", emoji: "🐱", title: "Кот-попрыгун", desc: "Прыгай на правильные ответы!", gradient: "linear-gradient(135deg,#34D399,#059669)", shadow: "0 8px 20px rgba(52,211,153,0.4)", locked: false },
];

export const FUN_GAMES: GameItem[] = [
  { id: "flappy", emoji: "🐦", title: "Flappy Cat", desc: "Кот летит через трубы!", gradient: "linear-gradient(135deg,#60A5FA,#06B6D4)", shadow: "0 8px 20px rgba(96,165,250,0.4)", locked: false },
  { id: "doodle", emoji: "🐸", title: "Кот-попрыгун", desc: "Прыгай на правильные ответы!", gradient: "linear-gradient(135deg,#34D399,#059669)", shadow: "0 8px 20px rgba(52,211,153,0.4)", locked: false },
  { id: "hillclimb", emoji: "🏎️", title: "Hill Climb Cat", desc: "Кот покоряет холмы!", gradient: "linear-gradient(135deg,#F59E0B,#F97316)", shadow: "0 8px 20px rgba(245,158,11,0.4)", locked: false },
];

interface GamesHubProps {
  onGameClick: (id: string) => void;
}

export function GamesHub({ onGameClick }: GamesHubProps) {
  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4" style={{ background: "#F0EBFF" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎮</span>
        <h2 className="font-black text-gray-800 text-base">Учебные игры</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {EDUCATIONAL_GAMES.map((g, i) => (
          <div key={g.id} onClick={() => !g.locked && onGameClick(g.id)}
            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all active:scale-95 hover:scale-[1.04] ${g.locked ? "opacity-55" : ""}`}
            style={{ boxShadow: g.shadow, animation: `fadeSlideUp 0.45s ${0.08 + i * 0.08}s ease-out both` }}>
            <div className="p-4 flex flex-col justify-between min-h-[140px] relative" style={{ background: g.gradient }}>
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/12" />
              {g.locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(30,27,75,0.52)] backdrop-blur-sm">
                  <div className="text-4xl">🔒</div>
                </div>
              )}
              <div className="text-4xl drop-shadow">{g.emoji}</div>
              <div>
                <p className="text-white font-black text-sm">{g.title}</p>
                <p className="text-white/75 text-xs font-bold mt-0.5">{g.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
