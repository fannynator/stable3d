import { useState } from "react";
import { PET_DEFS } from "../../config";

interface PetCollectionProps {
  ownedIds: string[];
  onClose: () => void;
}

export function PetCollection({ ownedIds, onClose }: PetCollectionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const owned = PET_DEFS.filter(p => ownedIds.includes(p.id));
  const locked = PET_DEFS.filter(p => !ownedIds.includes(p.id));
  const selectedPet = PET_DEFS.find(p => p.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,16,64,0.95)]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <h2 className="font-black text-gray-800 text-lg">Мои питомцы</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 font-black text-xs px-2.5 py-1 rounded-full">{owned.length}/{PET_DEFS.length}</span>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">×</button>
          </div>
        </div>

        {selectedPet && (
          <div className="mb-4 p-4 rounded-2xl text-center" style={{ background: `${selectedPet.color}15`, border: `2px solid ${selectedPet.color}30` }}>
            <div className="text-5xl mb-2">{selectedPet.emoji}</div>
            <div className="font-black text-gray-800">{selectedPet.name}</div>
            <div className="text-gray-500 text-sm font-bold mt-1">{selectedPet.description}</div>
            <button onClick={() => setSelected(null)} className="mt-3 text-xs font-bold text-purple-600">← Назад к списку</button>
          </div>
        )}

        {!selectedPet && (
          <div className="flex-1 overflow-y-auto">
            {owned.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Получены</div>
                <div className="grid grid-cols-5 gap-2">
                  {owned.map(p => (
                    <button key={p.id} onClick={() => setSelected(p.id)}
                      className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all active:scale-90 hover:scale-110"
                      style={{ background: `${p.color}15`, border: `2px solid ${p.color}30` }}>
                      {p.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {locked.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ещё не получены</div>
                <div className="grid grid-cols-5 gap-2">
                  {locked.map(p => (
                    <div key={p.id} className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-2xl opacity-40 border-2 border-dashed border-gray-200">
                      🔒
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-xs font-bold mt-3 text-center">Проходи истории, чтобы получить питомцев!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
