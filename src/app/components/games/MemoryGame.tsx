import { useState, useMemo } from "react";

const MEM_PAIRS = ["🐱", "🐶", "🐻", "🦊", "🐸", "🐧"];

interface MemCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function makeCards(): MemCard[] {
  const deck = [...MEM_PAIRS, ...MEM_PAIRS].map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

interface MemoryGameProps {
  onBack: () => void;
}

export function MemoryGame({ onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<MemCard[]>(makeCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locking, setLocking] = useState(false);
  const [started, setStarted] = useState(false);

  const allDone = started && cards.every(c => c.matched);

  const flip = (id: number) => {
    if (!started || locking) return;
    const card = cards[id];
    if (card.flipped || card.matched || flipped.length >= 2) return;
    const nextCards = cards.map((c, i) => i === id ? { ...c, flipped: true } : c);
    setCards(nextCards);
    const nextFlipped = [...flipped, id];
    setFlipped(nextFlipped);
    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocking(true);
      const [a, b] = nextFlipped;
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => {
          if (i === a || i === b) {
            return prev[a].emoji === prev[b].emoji ? { ...c, matched: true, flipped: true } : { ...c, flipped: false };
          }
          return c;
        }));
        setFlipped([]);
        setLocking(false);
      }, 850);
    }
  };

  const stars = allDone ? (moves <= 8 ? 3 : moves <= 12 ? 2 : 1) : 0;

  if (allDone) return (
    <div className="flex flex-col min-h-screen items-center justify-center p-5" style={{ background: "#F0EBFF", animation: "screenIn 0.35s ease-out" }}>
      <div className="bg-white rounded-3xl p-7 shadow-xl w-full max-w-sm text-center">
        <div className="text-6xl mb-3">🎴</div>
        <h2 className="font-black text-2xl text-gray-800 mb-1">Все пары найдены!</h2>
        <p className="text-gray-400 font-bold mb-5">Ты справился за {moves} ходов</p>
        <div className="flex justify-center gap-3 mb-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="text-4xl" style={{
              filter: i < stars ? "drop-shadow(0 2px 8px rgba(251,191,36,0.7))" : "grayscale(1) opacity(0.3)",
              animation: i < stars ? `starDrop 0.5s ${0.1 + i * 0.15}s ease-out both` : "none",
            }}>⭐</span>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setCards(makeCards()); setFlipped([]); setMoves(0); setLocking(false); setStarted(false); }}
            className="flex-1 py-3.5 rounded-2xl border-2 border-amber-200 font-black text-amber-700 text-sm active:scale-95">Ещё раз 🔄</button>
          <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#FCD34D,#F97316)" }}>Домой 🏠</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F0EBFF", animation: "screenIn 0.3s ease-out" }}>
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#FCD34D,#F97316)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg flex-shrink-0">←</button>
          <p className="text-white font-black text-base flex-1">🎴 Карточки памяти</p>
          <div className="bg-white/20 rounded-2xl px-3 py-1.5 border border-white/30">
            <span className="text-white font-black text-sm">{moves} ходов</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center px-4 pt-5">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-7xl">🎴</div>
            <h2 className="font-black text-2xl text-gray-800">Карточки памяти</h2>
            <p className="text-gray-500 font-bold text-sm">Найди все 6 пар одинаковых карточек!</p>
            <button onClick={() => setStarted(true)}
              className="w-48 py-4 rounded-2xl font-black text-white text-lg active:scale-95"
              style={{ background: "linear-gradient(135deg,#FCD34D,#F97316)", boxShadow: "0 8px 20px rgba(252,211,77,0.45)" }}>Начать! 🎯</button>
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-4 gap-2.5 mb-4">
              {cards.map((card, i) => (
                <div key={card.id} onClick={() => flip(i)}
                  className="aspect-square rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center select-none"
                  style={{
                    background: card.matched
                      ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)"
                      : card.flipped ? "white"
                      : "linear-gradient(135deg,#7C3AED,#4F46E5)",
                    boxShadow: card.matched ? "0 4px 12px rgba(16,185,129,0.3)" : card.flipped ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(124,58,237,0.3)",
                    border: card.matched ? "2px solid #10B981" : "2px solid transparent",
                  }}>
                  {(card.flipped || card.matched) ? (
                    <span className="text-3xl" style={{ animation: "correctPop 0.3s ease-out" }}>{card.emoji}</span>
                  ) : (
                    <span className="text-2xl text-white/60 font-black">?</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-400 font-bold text-sm">Найдено: {cards.filter(c => c.matched).length / 2} / 6 пар</p>
          </>
        )}
      </div>
    </div>
  );
}
