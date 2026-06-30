import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CatMood } from "../../types";

const MODEL_PATH = "/cat_hub.glb";

const moodEmojis: Record<CatMood, string> = {
  happy: "😺", sleepy: "😴", hungry: "😿", playful: "😸",
};

interface Cat3DProps {
  mood: CatMood;
  onClick?: () => void;
}

export function Cat3D({ mood, onClick }: Cat3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelVisible, setModelVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    camera.position.set(0, 6, 35);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 80, 40);
    scene.add(dirLight);

    let mixer: THREE.AnimationMixer | null = null;
    let modelObj: THREE.Object3D | null = null;
    const skinnedMeshes: THREE.SkinnedMesh[] = [];

    const loader = new GLTFLoader();
    loader.load(MODEL_PATH, (gltf) => {
      modelObj = gltf.scene;
      modelObj.scale.setScalar(1);
      const box = new THREE.Box3().setFromObject(modelObj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 18;
      const s = targetSize / maxDim;
      modelObj.scale.setScalar(s);
      modelObj.position.sub(center.multiplyScalar(s));
      scene.add(modelObj);
      modelObj.updateMatrixWorld(true);

      modelObj.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh) {
          child.frustumCulled = false;
          skinnedMeshes.push(child);
        }
      });

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(modelObj);
        const idle = gltf.animations.find((a) =>
          a.name.toLowerCase().includes("idle")
        ) || gltf.animations[0];
        if (idle) mixer.clipAction(idle).play();
      }

      setModelVisible(true);
    });

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (mixer) mixer.update(dt);
      if (modelObj) {
        for (const mesh of skinnedMeshes) mesh.skeleton.update();
        modelObj.updateMatrixWorld(true);
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth || 300;
      const nh = container.clientHeight || 400;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[55%] h-[42%] select-none z-[60]"
      onClick={onClick}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {modelVisible && (
        <div
          className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[60%] h-[8%] rounded-[50%] opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)" }}
        />
      )}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[clamp(40px,8vw,80px)] cursor-pointer"
        style={{
          filter: modelVisible ? "none" : "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
          animation: modelVisible ? "none" : "catBreathe 3s ease-in-out infinite",
          opacity: modelVisible ? 0 : 1,
          pointerEvents: modelVisible ? "none" : "auto",
        }}
      >
        {moodEmojis[mood] || "😺"}
      </div>
    </div>
  );
}
