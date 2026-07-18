import { Suspense, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { CatMood } from "../../../app/types";
import { CatModel } from "./CatModel";

interface CatRoomSceneProps {
  mood: CatMood;
  gems: number;
  hunger: number;
  energy: number;
  onPetCat: () => void;
}

export function CatRoomScene({ mood, gems, hunger, energy, onPetCat }: CatRoomSceneProps) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const lookRef = useRef({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    lookRef.current = {
      x: ((e.clientX - cx) / (rect.width / 2)) * 0.6,
      y: ((e.clientY - cy) / (rect.height / 2)) * 0.6,
    };
  }, []);

  const handlePointerLeave = useCallback(() => {
    lookRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <>
      {/* Wrapper for pointer tracking on the big room cat */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <Canvas
          camera={{ position: [0, 4, 18], fov: 50 }}
          style={{
            position: "absolute",
            bottom: "18%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "55%",
            height: "42%",
            zIndex: 1,
          }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, toneMappingExposure: 1.2 }}
        >
          {/* Lighting */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 80, 40]} intensity={2} />
          <directionalLight position={[-15, 15, -10]} intensity={1.5} color="#a78bfa" />

          <Suspense fallback={null}>
            <CatModel mood={mood} onClick={onPetCat} lookTarget={lookRef} onReady={() => setModelLoaded(true)} />
          </Suspense>
        </Canvas>
      </div>

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

      {!modelLoaded && (
        <div
          className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-[clamp(40px,8vw,80px)] pointer-events-none select-none z-10"
          style={{ animation: "catBreathe 3s ease-in-out infinite" }}
        >
          {mood === "playful" ? "😸" : mood === "sleepy" ? "😴" : mood === "hungry" ? "😿" : "😺"}
        </div>
      )}
      {modelLoaded && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[45%] h-[6%] rounded-[50%] opacity-15 pointer-events-none z-0"
          style={{ bottom: "14%", background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }}
        />
      )}
    </>
  );
}
