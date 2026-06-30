import { HATS } from "../../config";

interface HatShopProps {
  gems: number;
  ownedHats: string[];
  equippedHat: string | null;
  onBuy: (hatId: string, price: number) => void;
  onEquip: (hatId: string | null) => void;
  onClose: () => void;
}

export function HatShop({ gems, ownedHats, equippedHat, onBuy, onEquip, onClose }: HatShopProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,16,64,0.95)]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎩</span>
            <h2 className="font-black text-gray-800 text-lg">Шляпы</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-50 text-amber-700 font-black text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              💎 {gems}
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {HATS.map(hat => {
              const owned = ownedHats.includes(hat.id);
              const equipped = equippedHat === hat.id;
              const canBuy = !owned && gems >= hat.price;

              return (
                <div key={hat.id}
                  className={`relative rounded-2xl p-4 text-center transition-all ${equipped ? "ring-2 ring-purple-500 ring-offset-2" : ""}`}
                  style={{ background: hat.gradient }}>
                  <div className="text-4xl mb-2">{hat.emoji}</div>
                  <div className="text-white font-black text-sm drop-shadow">{hat.name}</div>

                  {!owned && (
                    <button onClick={(e) => { e.stopPropagation(); if (canBuy) onBuy(hat.id, hat.price); }}
                      disabled={!canBuy}
                      className={`mt-2 w-full py-1.5 rounded-xl text-xs font-black transition-all ${canBuy ? "bg-white/30 text-white hover:bg-white/40 active:scale-95" : "bg-white/10 text-white/50 cursor-not-allowed"}`}>
                      💎 {hat.price}
                    </button>
                  )}

                  {owned && (
                    <button onClick={(e) => { e.stopPropagation(); onEquip(equipped ? null : hat.id); }}
                      className={`mt-2 w-full py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${equipped ? "bg-white text-purple-700" : "bg-white/30 text-white hover:bg-white/40"}`}>
                      {equipped ? "✓ Надета" : "Надеть"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
