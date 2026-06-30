import { useState } from "react";

interface ZoneConfig {
  name: string;
  top: string;
  left: string;
  width: string;
  height: string;
  icon: string;
}

const ZONES: ZoneConfig[] = [
  { name: "computer",  top: "31%", left: "75%", width: "18%", height: "14%", icon: "🎮" },
  { name: "bed",       top: "38%", left: "5%",  width: "40%", height: "16%", icon: "😴" },
  { name: "plant",     top: "44%", left: "80%", width: "12%", height: "10%", icon: "💧" },
  { name: "photos",    top: "16%", left: "2%",  width: "25%", height: "14%", icon: "🏆" },
  { name: "bookshelf", top: "12%", left: "30%", width: "18%", height: "12%", icon: "📖" },
];

interface InteractiveZoneProps {
  zoneName: string;
  onZoneClick: (zone: string) => void;
  pulse?: boolean;
}

export function InteractiveZone({ zoneName, onZoneClick, pulse }: InteractiveZoneProps) {
  const zone = ZONES.find(z => z.name === zoneName);
  if (!zone) return null;

  return (
    <div
      className="absolute cursor-pointer rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/12 hover:shadow-[0_0_20px_rgba(255,200,100,0.3)] hover:scale-103 active:scale-97 active:bg-white/18"
      style={{
        top: zone.top,
        left: zone.left,
        width: zone.width,
        height: zone.height,
      }}
      onClick={() => onZoneClick(zoneName)}
    >
      <span className="text-[clamp(20px,4vw,36px)] opacity-0 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] pointer-events-none">
        {zone.icon}
      </span>
      {pulse && (
        <div
          className="absolute inset-0 border-2 border-amber-200/40 rounded-xl"
          style={{ animation: "zonePulse 2s ease-in-out 3" }}
        />
      )}
    </div>
  );
}

export { ZONES };
