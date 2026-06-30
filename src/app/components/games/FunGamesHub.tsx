import { FUN_GAMES } from "./GamesHub";

interface FunGamesHubProps {
  onGameClick: (id: string) => void;
  onClose: () => void;
}

export function FunGamesHub({ onGameClick, onClose }: FunGamesHubProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,16,64,0.95)]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <h2 className="font-black text-gray-800 text-lg">Весёлые игры</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">×</button>
        </div>
        <div className="flex flex-col gap-3">
          {FUN_GAMES.map(g => (
            <button key={g.id} onClick={() => onGameClick(g.id)}
              disabled={g.locked}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98] ${g.locked ? "opacity-50" : "hover:scale-[1.01]"}`}
              style={{ background: g.gradient, boxShadow: g.shadow }}>
              <span className="text-3xl">{g.emoji}</span>
              <div className="flex-1">
                <div className="text-white font-black text-sm">{g.title}</div>
                <div className="text-white/75 text-xs font-bold">{g.desc}</div>
              </div>
              <span className="text-white text-lg">▶</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
