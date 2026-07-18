import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { CatMood } from "../../../app/types";
import { moodToAnimSpeed } from "./cat-mood";

const MODEL_PATH = "/cat_hub.glb";

/** Known morph target names for friendly/smile expression across various rigs */
const SMILE_MORPH_NAMES = [
  "smile", "Smile", "Mouth_Smile", "mouthSmile",
  "happy", "Happy", "Mouth_Happy", "mouthHappy",
  "smileLeft", "smileRight", "MouthSmile_L", "MouthSmile_R",
  "cheekRaise", "CheekRaise_L", "CheekRaise_R",
  "browInnerUp", "InnerBrowUp_L", "InnerBrowUp_R",
];

const FROWN_MORPH_NAMES = [
  "frown", "Frown", "Mouth_Frown", "mouthFrown",
  "sad", "Sad", "Mouth_Sad", "mouthSad",
  "browDown", "BrowDown_L", "BrowDown_R",
];

/**
 * Tries to apply a friendly expression by finding morph targets
 * on any SkinnedMesh in the model. Falls back silently if no matching
 * morphs are found.
 */
function applyFriendlyExpression(group: THREE.Group): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry;
    if (!geo.morphAttributes || !geo.morphAttributes.position) return;

    const dict = geo.morphTargetDictionary;
    if (!dict) return;

    // Try to find smile morphs
    for (const name of SMILE_MORPH_NAMES) {
      const idx = dict[name];
      if (idx !== undefined) {
        setMorphInfluence(child, idx, 0.6);
      }
    }

    // Reduce any frown morphs
    for (const name of FROWN_MORPH_NAMES) {
      const idx = dict[name];
      if (idx !== undefined) {
        setMorphInfluence(child, idx, 0);
      }
    }
  });
}

function setMorphInfluence(mesh: THREE.Mesh, index: number, value: number): void {
  if (!mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences = [];
  }
  mesh.morphTargetInfluences[index] = value;
}

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

interface CatModelProps {
  mood: CatMood;
  onClick?: () => void;
  lookTarget?: React.MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}

/**
 * Declarative R3F cat model with mood-driven animation speed.
 * Replaces the imperative Three.js setup in Cat3D.tsx.
 */
export function CatModel({ mood, onClick, lookTarget, onReady }: CatModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const eyeBonesRef = useRef<THREE.Bone[]>([]);
  const { scene, animations } = useGLTF(MODEL_PATH);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    // Fit model within target size (matching original Cat3D scaling logic)
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 30;
    const s = targetSize / maxDim;
    group.scale.setScalar(s);
    group.position.sub(center.clone().multiplyScalar(s));
    // Lift model so feet touch floor plane (y=0)
    group.position.y += targetSize * 0.15;

    // Frustum culling off for skinned meshes + find eye bones
    group.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
      }
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        if (name.includes("eye") || name.includes("pupil") || name.includes("look")) {
          eyeBonesRef.current.push(child);
        }
      }
    });

    // Apply friendly expression via morph targets
    applyFriendlyExpression(group);

    // Apply matte fur material
    applyFurMaterial(group);

    // Animation mixer
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(group);
      const idle = animations.find((a) =>
        a.name.toLowerCase().includes("idle")
      ) || animations[0];
      if (idle) mixer.clipAction(idle).play();
      mixerRef.current = mixer;
    }

    onReady?.();

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [scene, animations, onReady]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const speed = moodToAnimSpeed(mood);
      mixerRef.current.update(delta * speed);
    }

    // Eye tracking — follow mouse/finger
    if (lookTarget) {
      const { x, y } = lookTarget.current;
      for (const bone of eyeBonesRef.current) {
        bone.rotation.x = y * 0.3;
        bone.rotation.y = x * 0.3;
      }
      // Fallback: subtle head tilt
      if (eyeBonesRef.current.length === 0 && groupRef.current) {
        groupRef.current.rotation.x += y * 0.03;
        groupRef.current.rotation.y += x * 0.04;
      }
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      <primitive object={scene} />
    </group>
  );
}

// Preload model for instant display on mount
useGLTF.preload(MODEL_PATH);
