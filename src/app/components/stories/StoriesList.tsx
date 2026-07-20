import type { Subject } from "../../types";

interface Story {
  id: string;
  title: string;
  hero: string;
  tagline: string;
  emoji: string;
  gradient: string;
  shadow: string;
  subj: Subject;
  completed: boolean;
  locked: boolean;
}

const STORIES_DATA: Omit<Story, "completed" | "locked">[] = [
  {
    id: "math", title: "🧮 Дело о пропавшем торте", hero: "🐻",
    tagline: "Помоги найти, кто украл торт! Математическое расследование.",
    emoji: "🐱", gradient: "linear-gradient(135deg,#34D399,#059669)", shadow: "0 8px 20px rgba(52,211,153,0.4)",
    subj: "math",
  },
  {
    id: "rus1", title: "📝 Дело о пропавшей запятой", hero: "🦊",
    tagline: "Из газеты исчезли запятые! Расследование по русскому языку.",
    emoji: "😺", gradient: "linear-gradient(135deg,#FB923C,#DC2626)", shadow: "0 8px 20px rgba(251,146,60,0.4)",
    subj: "russian",
  },
  {
    id: "rus2", title: "📝 Дело о двойных согласных", hero: "🦉",
    tagline: "В библиотеке пропали буквы Н! Найди виновного.",
    emoji: "😺", gradient: "linear-gradient(135deg,#818CF8,#4F46E5)", shadow: "0 8px 20px rgba(129,140,248,0.4)",
    subj: "russian",
  },
  {
    id: "math2", title: "🧮 Дело о ловушке времени", hero: "🐧",
    tagline: "Часы сломаны! Коту нужна помощь с временем и календарём.",
    emoji: "🐱", gradient: "linear-gradient(135deg,#06B6D4,#0891B2)", shadow: "0 8px 20px rgba(6,182,212,0.4)",
    subj: "math",
  },
  {
    id: "rus3", title: "📝 Дело о смешных синонимах", hero: "🦊",
    tagline: "Слова потеряли значения! Кто поможет их найти?",
    emoji: "😺", gradient: "linear-gradient(135deg,#F97316,#EA580C)", shadow: "0 8px 20px rgba(249,115,22,0.4)",
    subj: "russian",
  },
  {
    id: "math3", title: "🧮 Дело о пиратском сундуке", hero: "🐻",
    tagline: "Пираты спрятали сокровище! Надо разделить добычу.",
    emoji: "🐱", gradient: "linear-gradient(135deg,#F59E0B,#D97706)", shadow: "0 8px 20px rgba(245,158,11,0.4)",
    subj: "math",
  },
  {
    id: "rus4", title: "📝 Дело о спрятанных глаголах", hero: "🦉",
    tagline: "Глаголы разбежались по времени! Надо их найти.",
    emoji: "😺", gradient: "linear-gradient(135deg,#7C3AED,#5B21B6)", shadow: "0 8px 20px rgba(124,58,237,0.4)",
    subj: "russian",
  },
  {
    id: "math4", title: "🧮 Дело о волшебном саду", hero: "🐧",
    tagline: "В саду всё растёт по формулам! Периметр и площадь.",
    emoji: "🐱", gradient: "linear-gradient(135deg,#10B981,#059669)", shadow: "0 8px 20px rgba(16,185,129,0.4)",
    subj: "math",
  },
  {
    id: "rus5", title: "📝 Дело о великом диктанте", hero: "🦊",
    tagline: "Великий диктант! Все правила русского языка в деле.",
    emoji: "😺", gradient: "linear-gradient(135deg,#EC4899,#DB2777)", shadow: "0 8px 20px rgba(236,72,153,0.4)",
    subj: "russian",
  },
  {
    id: "math5", title: "🧮 Дело о космических дробях", hero: "🐻",
    tagline: "Инопланетяне украли пиццу! Верни её с помощью дробей!",
    emoji: "🐱", gradient: "linear-gradient(135deg,#0EA5E9,#0284C7)", shadow: "0 8px 20px rgba(14,165,233,0.4)",
    subj: "math",
  },
];

interface StoriesListProps {
  completed: Record<string, boolean>;
  onStoryClick: (id: string) => void;
}

export function StoriesList({ completed, onStoryClick }: StoriesListProps) {
  const stories = STORIES_DATA.map(s => ({ ...s, completed: !!completed[s.id], locked: false }));

  const unlocked = stories.filter(s => !s.locked).length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4" style={{ background: "#F0EBFF" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📚</span>
        <h2 className="font-black text-gray-800 text-base">Истории</h2>
        <div className="ml-auto bg-purple-100 text-purple-700 font-black text-xs px-2.5 py-1 rounded-full border border-purple-200">{unlocked}/{stories.length}</div>
      </div>
      <div className="flex flex-col gap-3">
        {stories.map((s, i) => (
          <div key={s.id} onClick={() => !s.locked && onStoryClick(s.id)}
            className={`rounded-3xl overflow-hidden cursor-pointer transition-all active:scale-[0.97] hover:scale-[1.02] ${s.locked ? "opacity-55" : ""}`}
            style={{ boxShadow: s.shadow, animation: `fadeSlideUp 0.45s ${0.06 + i * 0.09}s ease-out both` }}>
            <div className="relative flex items-center gap-4 p-4" style={{ background: s.gradient }}>
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-white/10" />
              {s.locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(30,27,75,0.52)] backdrop-blur-sm">
                  <div className="text-4xl">🔒</div>
                </div>
              )}
              <div className="flex-shrink-0 flex items-center justify-center rounded-2xl text-4xl relative z-10 w-16 h-16 bg-white/22 shadow-md">
                {s.hero}
              </div>
              <div className="flex-1 relative z-10 min-w-0">
                <p className="text-white font-black text-sm leading-tight drop-shadow">{s.title}</p>
                <p className="text-white/75 font-bold text-xs mt-1 leading-snug">{s.tagline}</p>
                {s.completed && (
                  <div className="mt-1 text-emerald-200 font-bold text-xs">✅ Пройдено</div>
                )}
              </div>
              {!s.locked && (
                <div className="flex-shrink-0 relative z-10 flex items-center justify-center rounded-full w-[34px] h-[34px] bg-white/25">
                  <span className="text-white font-black text-sm ml-0.5">▶</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
