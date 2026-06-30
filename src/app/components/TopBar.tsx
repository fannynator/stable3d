interface TopBarProps {
  gems: number;
  streak: number;
}

export function TopBar({ gems, streak }: TopBarProps) {
  return (
    <div className="flex items-start justify-between px-4 pt-4 pb-2 relative z-10">
      <div>
        <div className="text-white font-black text-xl leading-tight tracking-tight drop-shadow">Кот Учёный</div>
        <div className="text-purple-200 text-xs font-bold mt-0.5">⚡ Уровень 12</div>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex items-center gap-1.5 bg-white/20 rounded-2xl px-2.5 py-1.5 border border-white/30">
          <span className="text-base leading-none">💎</span>
          <span className="text-white font-black text-sm">{gems}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 rounded-2xl px-2.5 py-1.5 border border-white/30">
          <span className="text-base leading-none">🔥</span>
          <span className="text-white font-black text-sm">{streak}</span>
        </div>
      </div>
    </div>
  );
}
