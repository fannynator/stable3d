import { useState, useCallback, useEffect, useRef } from "react";
import type { CatState } from "../../types";
import { CatRoomScene } from "../../../engine/three/cat-room";
import { InteractiveZone, ZONES } from "./InteractiveZone";
import { PetCollection } from "./PetCollection";
import { HatShop } from "./HatShop";
import { PET_DEFS, HATS } from "../../config";
import { catListen, catSpeak, catStop } from "../../voice";
import { canUseVoice } from "../../useSubscription";
import { playMeowSound } from "../../sounds";

interface CatRoomProps {
  cat: CatState;
  totalPets: number;
  ownedPetIds: string[];
  gems: number;
  onPet: () => void;
  onUpdateCat: (updates: Partial<CatState>) => void;
  onOpenZone: (zone: string) => void;
  onBuyHat: (hatId: string, price: number) => void;
  onOpenPaywall?: () => void;
}

const PET_ACTIONS = [
  { label: "Погладить", emoji: "🤗", effect: "happy" },
  { label: "Покормить", emoji: "🍖", effect: "feed" },
  { label: "Поиграть", emoji: "⚽", effect: "play" },
  { label: "Уложить спать", emoji: "😴", effect: "sleep" },
];

export function CatRoom({ cat, totalPets, ownedPetIds, gems, onPet, onUpdateCat, onOpenZone, onBuyHat, onOpenPaywall }: CatRoomProps) {
  const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({});
  const [allHintsOff, setAllHintsOff] = useState(false);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [showHatShop, setShowHatShop] = useState(false);
  const [petHearts, setPetHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const speechTimer = useRef<ReturnType<typeof setTimeout>>();
  const heartId = useRef(0);
  const ownedPets = PET_DEFS.filter(p => ownedPetIds.includes(p.id));
  const currentHat = HATS.find(h => h.id === cat.hat);

  const handleZoneClick = useCallback((zoneName: string) => {
    setHintsShown(prev => ({ ...prev, [zoneName]: true }));
    setAllHintsOff(true);
    onOpenZone(zoneName);
  }, [onOpenZone]);

  const showSpeech = useCallback((text: string, duration = 2500) => {
    clearTimeout(speechTimer.current);
    setSpeechText(text);
    speechTimer.current = setTimeout(() => setSpeechText(null), duration);
  }, []);

  const spawnHeart = useCallback((x: number, y: number) => {
    const id = heartId.current++;
    setPetHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => setPetHearts(prev => prev.filter(h => h.id !== id)), 1200);
  }, []);

  const handleCatClick = useCallback(() => {
    if (showActions) {
      setShowActions(false);
      return;
    }
    setShowActions(true);
    onPet();
    playMeowSound();
    spawnHeart(50 + Math.random() * 30, 30 + Math.random() * 20);
  }, [showActions, onPet, spawnHeart]);

  const handleAction = useCallback((effect: string) => {
    setShowActions(false);
    switch (effect) {
      case "happy":
        onPet();
        const happyPhrases: Record<string, string[]> = {
          happy: ["Муррр! 💕", "Обожаю это! 🥰", "Ещё! Ещё! 😻"],
          sleepy: ["Мур... *зевает* 😴", "Сонный мурчик... 💤"],
          hungry: ["Мур! А потом покормишь? 😺", "Ням-мур! 🍖"],
          playful: ["Мяу-мяу! 🎉", "Давай играть! ⚽"],
        };
        showSpeech((happyPhrases[cat.mood] || happyPhrases.happy)[Math.floor(Math.random() * 3)]);
        break;
      case "feed":
        onUpdateCat({ hunger: Math.min(100, cat.hunger + 30) });
        const feedPhrases = ["Ням-ням! 😋", "Вкуснотища! 🍖", "Спасибо! 😺", "Мур! Люблю рыбу! 🐟"];
        showSpeech(feedPhrases[Math.floor(Math.random() * feedPhrases.length)]);
        break;
      case "play":
        onUpdateCat({ energy: Math.max(0, cat.energy - 15), hunger: Math.max(0, cat.hunger - 10) });
        const playPhrases = ["Ух ты! 🎉", "Здорово! ⚽", "Хи-хи! 😸", "Я быстрый! 🏃"];
        showSpeech(playPhrases[Math.floor(Math.random() * playPhrases.length)]);
        break;
      case "sleep":
        onUpdateCat({ energy: Math.min(100, cat.energy + 40) });
        const sleepPhrases = ["Zzz... 😴", "Сладкие сны... 💤", "Спокойной ночи... 🌙", "Мур-мур... *храп*"];
        showSpeech(sleepPhrases[Math.floor(Math.random() * sleepPhrases.length)]);
        break;
    }
  }, [cat.hunger, cat.energy, cat.mood, onPet, onUpdateCat, showSpeech]);

  const handleMic = useCallback(async () => {
    if (!canUseVoice()) {
      onOpenPaywall?.();
      return;
    }
    catStop();
    setIsListening(true);
    try {
      const text = await catListen();
      if (text) {
        // Echo what the child said — cat repeats via Kokoro
        await catSpeak(`Мур! Ты сказал: «${text}». Мяу!`);
        showSpeech(text, 4000);
      }
    } catch {
      // Silently fail — child can try again
    } finally {
      setIsListening(false);
    }
  }, [showSpeech]);

  useEffect(() => {
    const id = setTimeout(() => setAllHintsOff(true), 8000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const moodPhrases: Record<string, string[]> = {
      happy: ["Мяу! 🐱", "Я кот-учёный!", "Всё отлично!", "Мур-мур!"],
      sleepy: ["*зевает* 😴", "Хочу спать...", "Нужен отдых..."],
      hungry: ["Хочу есть! 🍖", "*мурчит*", "Корми меня!"],
      playful: ["Давай! 🎮", "Я готов!", "Ооо, интересно!"],
    };
    const phrases = moodPhrases[cat.mood] || moodPhrases.happy;
    const interval = setInterval(() => {
      showSpeech(phrases[Math.floor(Math.random() * phrases.length)], 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, [cat.mood, showSpeech]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{
      backgroundImage: "url(/room_bg.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {ZONES.map((zone) => (
        <InteractiveZone
          key={zone.name}
          zoneName={zone.name}
          onZoneClick={handleZoneClick}
          pulse={!allHintsOff && !hintsShown[zone.name]}
        />
      ))}

      <CatRoomScene
        mood={cat.mood}
        gems={gems}
        hunger={cat.hunger}
        energy={cat.energy}
        onPetCat={handleCatClick}
      />

      {currentHat && (
        <div className="absolute bottom-[38%] left-1/2 -translate-x-1/2 text-[clamp(28px,5vw,48px)] z-[61] pointer-events-none select-none"
          style={{ animation: "catBreathe 3s ease-in-out infinite", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
          {currentHat.emoji}
        </div>
      )}

      {petHearts.map(h => (
        <div
          key={h.id}
          className="absolute text-2xl pointer-events-none z-[70]"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            animation: "floatUp 1.2s ease-out forwards",
          }}
        >
          💖
        </div>
      ))}

      {showActions && (
        <div
          className="absolute bottom-[42%] left-1/2 -translate-x-1/2 flex gap-2 z-[70]"
          style={{ animation: "fadeSlideUp 0.2s ease-out" }}
        >
          {PET_ACTIONS.map((action) => (
            <button
              key={action.effect}
              onClick={(e) => { e.stopPropagation(); handleAction(action.effect); }}
              className="flex flex-col items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-lg active:scale-90 transition-transform"
            >
              <span className="text-[22px]">{action.emoji}</span>
              <span className="text-[10px] text-[#2d1b69] font-semibold whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {speechText && (
        <div
          className="absolute bottom-[40%] left-1/2 -translate-x-1/2 z-[71] pointer-events-none"
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}
        >
          <div className="relative bg-white/95 text-[#2d1b69] px-4 py-2 rounded-[20px] text-[clamp(12px,2.5vw,16px)] font-semibold whitespace-nowrap shadow-lg">
            {speechText}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid rgba(255,255,255,0.95)",
              }}
            />
          </div>
        </div>
      )}

      <div className="fixed top-3 right-3 flex gap-2 z-50">
        <button onClick={handleMic}
          className={`px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 active:scale-95 transition-all ${isListening ? "bg-red-500/80 animate-pulse" : "bg-black/40 backdrop-blur-md"}`}>
          🎤
        </button>
        <button onClick={() => setShowHatShop(true)}
          className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 active:scale-95 transition-transform">
          🎩
        </button>
        <button onClick={() => setShowPets(true)}
          className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 active:scale-95 transition-transform">
          🐾 {ownedPetIds.length}
        </button>
      </div>

      {showHatShop && <HatShop gems={gems} ownedHats={cat.ownedHats} equippedHat={cat.hat} onBuy={onBuyHat} onEquip={(hat) => onUpdateCat({ hat })} onClose={() => setShowHatShop(false)} />}
      {showPets && <PetCollection ownedIds={ownedPetIds} onClose={() => setShowPets(false)} />}

      {ownedPets.length > 0 && (
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-2 z-[55]">
          {ownedPets.slice(0, 5).map(p => (
            <div key={p.id} className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
              style={{ background: `${p.color}20`, border: `2px solid ${p.color}40` }}>
              {p.emoji}
            </div>
          ))}
          {ownedPets.length > 5 && (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-white/20 text-white">
              +{ownedPets.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.15)" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center animate-pulse"
              style={{ border: "3px solid rgba(239,68,68,0.6)" }}>
              <span className="text-4xl">🎤</span>
            </div>
            <p className="text-white font-black text-sm drop-shadow-lg">Кот слушает...</p>
          </div>
        </div>
      )}
    </div>
  );
}
