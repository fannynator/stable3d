import type { Trap, Subject } from "../../types";

interface TrapPanelProps {
  subject: Subject;
  available: Trap[];
  defused: Trap[];
  onDefuse: (trap: Trap) => void;
}

export function TrapPanel({ subject, available, defused, onDefuse }: TrapPanelProps) {
  const subjEmoji = subject === "math" ? "🧮" : "📝";

  if (!available.length && !defused.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ background: "#F0EBFF" }}>
        <div className="text-5xl mb-4">🏆</div>
        <div className="font-black text-base text-gray-800 mb-2">Ловушек нет!</div>
        <div className="text-gray-400 text-sm leading-relaxed">
          Ошибайся в уроках —<br />ловушки появятся здесь
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4" style={{ background: "#F0EBFF" }}>
      {available.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-3 font-black text-red-500 text-sm">
            <span className="text-lg">🔴</span> Нужно разобрать ({available.length})
          </div>
          {available.map(trap => (
            <button
              key={trap.id}
              onClick={() => onDefuse(trap)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-red-200 shadow-sm mb-2 hover:border-red-300 transition-all active:scale-[0.98]"
            >
              <span className="text-2xl">🪤</span>
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold text-sm text-gray-800 truncate">{trap.question}</div>
                <div className="text-xs text-gray-400 mt-0.5">{subjEmoji} {trap.source}</div>
              </div>
              <span className="text-xs font-black text-red-500 bg-red-50 px-2.5 py-1 rounded-full">Разобрать</span>
            </button>
          ))}
        </>
      )}

      {defused.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 mb-3 mt-6 font-black text-emerald-500 text-sm">
            <span className="text-lg">🟢</span> Разобраны ({defused.length})
          </div>
          {defused.map(trap => (
            <div
              key={trap.id}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 shadow-sm mb-2 opacity-70"
            >
              <span className="text-2xl">✅</span>
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold text-sm text-gray-800 truncate">{trap.question}</div>
                <div className="text-xs text-gray-400 mt-0.5">{subjEmoji} {trap.source}</div>
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-100 px-2.5 py-1 rounded-full">Готово</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
