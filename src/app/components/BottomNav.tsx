import type { Tab } from "../types";

interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
  trapsBadge?: number;
}

export function BottomNav({ active, onChange, trapsBadge }: BottomNavProps) {
  const tabs: { id: Tab; emoji: string; label: string }[] = [
    { id: "home", emoji: "🏠", label: "Главная" },
    { id: "stories", emoji: "📖", label: "Истории" },
    { id: "traps", emoji: "🪤", label: "Ловушки" },
    { id: "games", emoji: "🎮", label: "Игры" },
    { id: "catroom", emoji: "🐱", label: "Дом кота" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-2xl shadow-purple-200 z-50">
      <div className="flex items-stretch px-1 py-1.5">
        {tabs.map(tab => {
          const on = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center py-1.5 rounded-2xl transition-all duration-200 relative"
              style={on ? { background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", animation: "navPill 2.2s ease-in-out infinite" } : {}}>
              <span className="text-2xl transition-all duration-250 relative"
                style={{ transform: on ? "scale(1.22)" : "scale(1)", filter: on ? "drop-shadow(0 3px 8px rgba(124,58,237,0.55))" : "none" }}>
                {tab.emoji}
                {tab.id === "traps" && trapsBadge != null && trapsBadge > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {trapsBadge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-black mt-0.5 ${on ? "text-purple-700" : "text-gray-400"}`}>{tab.label}</span>
              {on && <div className="w-5 h-1 rounded-full bg-purple-500 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
