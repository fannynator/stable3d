import { Suspense, useCallback, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { CatMood } from "../../app/types";

const MODEL_PATH = "/cat_hub.glb";

// ── Camera controller — runs inside Canvas ──
function AvatarCamera({ z }: { z: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 3.5, 6.0);
    camera.fov = 35;
    camera.lookAt(0, 3.5, 0);
    camera.updateProjectionMatrix();
  }, [camera, z]);
  return null;
}

interface CatHeadProps {
  mood: CatMood;
  lookTarget: React.MutableRefObject<{ x: number; y: number }>;
}

function CatHead({ mood, lookTarget }: CatHeadProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const eyeBonesRef = useRef<THREE.Bone[]>([]);
  const setupDoneRef = useRef(false);
  const { scene, animations } = useGLTF(MODEL_PATH);

  useEffect(() => {
    if (!groupRef.current || setupDoneRef.current) return;
    setupDoneRef.current = true;
    const group = groupRef.current;

    // Scale and position for tight head close-up
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 8;
    const s = targetSize / maxDim;
    group.scale.setScalar(s);
    group.position.set(0, -center.y * s + 1.5, 0);

    // Face the camera (model naturally faces +Z toward camera)
    group.rotation.set(0, 0, 0);

    // Find eye bones
    group.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
      }
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        if (
          name.includes("eye") ||
          name.includes("pupil") ||
          name.includes("look")
        ) {
          eyeBonesRef.current.push(child);
        }
      }
    });

    // Play idle animation
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(group);
      const idle = animations.find((a) =>
        a.name.toLowerCase().includes("idle")
      ) || animations[0];
      if (idle) mixer.clipAction(idle).play();
      mixerRef.current = mixer;
    }

    applyFriendlyExpression(group);
    applyFurMaterial(group);
    return () => mixerRef.current?.stopAllAction();
  }, [scene, animations]);

  // Animation loop: idle + eye tracking
  useFrame((_, delta) => {
    if (mixerRef.current) {
      const speed = mood === "playful" ? 1.4 : mood === "sleepy" ? 0.6 : 1.0;
      mixerRef.current.update(delta * speed);
    }

    // Eye tracking — rotate eye bones toward cursor
    const { x, y } = lookTarget.current;
    const eyeAngleX = y * 0.3; // up/down
    const eyeAngleY = x * 0.3; // left/right
    for (const bone of eyeBonesRef.current) {
      bone.rotation.x = eyeAngleX;
      bone.rotation.y = eyeAngleY;
    }

    // Subtle head tilt toward cursor if no eye bones found
    if (eyeBonesRef.current.length === 0 && groupRef.current) {
      groupRef.current.rotation.x = y * 0.08;
      groupRef.current.rotation.y = x * 0.12;
      groupRef.current.rotation.z = -x * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

const SMILE_NAMES = ["smile", "Smile", "Mouth_Smile", "mouthSmile", "happy", "Happy"];
const FROWN_NAMES = ["frown", "Frown", "Mouth_Frown", "mouthFrown", "sad", "Sad", "browDown"];

/** Make cat fur matte by adjusting roughness/metalness on all mesh materials */
function applyFurMaterial(group: THREE.Group): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
          m.roughness = 0.75;
          m.metalness = 0.0;
          m.needsUpdate = true;
        }
      });
    } else if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.roughness = 0.75;
      mat.metalness = 0.0;
      mat.needsUpdate = true;
    }
  });
}

function applyFriendlyExpression(group: THREE.Group): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry;
    if (!geo.morphAttributes?.position || !geo.morphTargetDictionary) return;
    const dict = geo.morphTargetDictionary;
    for (const name of SMILE_NAMES) {
      const idx = dict[name];
      if (idx !== undefined) {
        if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
        child.morphTargetInfluences[idx] = 0.6;
      }
    }
    for (const name of FROWN_NAMES) {
      const idx = dict[name];
      if (idx !== undefined) {
        if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
        child.morphTargetInfluences[idx] = 0;
      }
    }
  });
}

interface CatAvatar3DProps {
  mood: CatMood;
  size?: number;
  camZ?: number;
}

export function CatAvatar3D({ mood, size = 85, camZ = 5 }: CatAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef({ x: 0, y: 0 });

  const updateLook = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    lookRef.current = {
      x: ((clientX - cx) / (rect.width / 2)) * 0.8,
      y: ((clientY - cy) / (rect.height / 2)) * 0.8,
    };
  }, []);

  const resetLook = useCallback(() => {
    lookRef.current = { x: 0, y: 0 };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    updateLook(e.clientX, e.clientY);
  }, [updateLook]);

  const handlePointerLeave = useCallback(() => {
    resetLook();
  }, [resetLook]);

  return (
    <div
      ref={containerRef}
      className="rounded-full overflow-hidden flex-shrink-0 shadow-xl touch-none"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(255,255,255,0.3)",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        dpr={[0.5, 1]}
        gl={{ alpha: true, antialias: false, toneMappingExposure: 1.2 }}
      >
        <AvatarCamera z={camZ} />
        <ambientLight intensity={2.2} />
        <directionalLight position={[5, 10, 8]} intensity={1.8} />
        {/* Rim light — back/side highlight for cinematic contour */}
        <directionalLight position={[-4, 5, -3]} intensity={1.2} color="#a78bfa" />
        <Suspense fallback={null}>
          <CatHead mood={mood} lookTarget={lookRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
