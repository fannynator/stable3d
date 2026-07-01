import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import type { CatMood } from "../../../app/types";
import { CatModel } from "./CatModel";

interface CatRoomSceneProps {
  mood: CatMood;
  gems: number;
  hunger: number;
  energy: number;
  onPetCat: () => void;
}

/**
 * Declarative R3F cat room scene with player stats overlay.
 * Uses @react-three/fiber Canvas with CatModel + lights.
 */
export function CatRoomScene({ mood, gems, hunger, energy, onPetCat }: CatRoomSceneProps) {
  const [modelLoaded, setModelLoaded] = useState(false);

  return (
    <>
      <Canvas
        camera={{ position: [0, 6, 35], fov: 45 }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={() => setModelLoaded(true)}
      >
        {/* Lighting */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 80, 40]} intensity={2} />

        {/* Cat model with loading fallback */}
        <Suspense fallback={null}>
          <CatModel mood={mood} onClick={onPetCat} />
        </Suspense>

        {/* Subtle environment lighting */}
        <Environment preset="apartment" resolution={64} />
      </Canvas>

      {/* Player stats overlay */}
      <div className="fixed top-3 right-3 flex gap-2 z-50 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 shadow-lg">
          💎 {gems}
        </div>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 shadow-lg">
          🍖 {Math.round(hunger)}%
        </div>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-[13px] flex items-center gap-1 shadow-lg">
          ⚡ {Math.round(energy)}%
        </div>
      </div>

      {/* Emoji fallback while 3D model loads */}
      {!modelLoaded && (
        <div
          className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-[clamp(40px,8vw,80px)] pointer-events-none select-none z-10"
          style={{ animation: "catBreathe 3s ease-in-out infinite" }}
        >
          {mood === "playful" ? "😸" : mood === "sleepy" ? "😴" : mood === "hungry" ? "😿" : "😺"}
        </div>
      )}

      {/* Shadow under the cat */}
      {modelLoaded && (
        <div
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 w-[45%] h-[6%] rounded-[50%] opacity-15 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }}
        />
      )}
    </>
  );
}
