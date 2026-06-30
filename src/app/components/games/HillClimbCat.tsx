import { useState, useEffect, useRef } from "react";

interface HillClimbProps {
  onBack: () => void;
}

const W = 300;
const H = 500;

function generateHills(startX: number) {
  const hills: { x: number; y: number; r: number }[] = [];
  let x = startX;
  for (let i = 0; i < 20; i++) {
    const r = 80 + Math.random() * 120;
    hills.push({ x, y: H - 60 + (Math.random() - 0.5) * 80, r });
    x += r * 1.5 + Math.random() * 40;
  }
  return hills;
}

export function HillClimbCat({ onBack }: HillClimbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    carX: 80,
    carY: H - 100,
    speed: 0,
    angle: 0,
    scrollX: 0,
    hills: generateHills(0),
    dist: 0,
    onGround: true,
    wheelAngle: 0,
    boosting: false,
  });

  const startGame = () => {
    setStarted(true);
    setDistance(0);
    setGameOver(false);
    stateRef.current = {
      carX: 80, carY: H - 100, speed: 0, angle: 0, scrollX: 0,
      hills: generateHills(0), dist: 0, onGround: true, wheelAngle: 0, boosting: false,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId = 0;
    let keys: Record<string, boolean> = {};

    const handleKey = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const relX = (e.touches[0].clientX - rect.left) / rect.width;
      if (relX < 0.5) keys["ArrowLeft"] = true;
      else keys["ArrowRight"] = true;
    };
    const handleTouchEnd = () => { keys = {}; };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    const getGroundY = (x: number) => {
      const s = stateRef.current;
      let bestY = H;
      for (const h of s.hills) {
        const dx = x - h.x;
        if (Math.abs(dx) < h.r) {
          const t = dx / h.r;
          const y = h.y + Math.sqrt(1 - t * t) * (h.r * 0.5) - h.r * 0.5;
          bestY = Math.min(bestY, y + 60);
        }
      }
      return bestY;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a1628");
      grad.addColorStop(0.5, "#1a2a4a");
      grad.addColorStop(1, "#2a3a5a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,200,0.3)";
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc((i * 67) % W, (i * 31) % (H * 0.3), 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const s = stateRef.current;
      if (started && !gameOver) {
        const accel = keys["ArrowRight"] || keys["d"] || keys[" "];
        const brake = keys["ArrowLeft"] || keys["a"];
        s.boosting = accel;

        if (accel) s.speed = Math.min(s.speed + 0.08, 3);
        else if (brake) s.speed = Math.max(s.speed - 0.05, -1);
        else s.speed *= 0.98;

        const worldX = s.scrollX + s.carX;
        const groundY = getGroundY(worldX);
        const nextGroundY = getGroundY(worldX + 15);

        s.angle = Math.atan2(nextGroundY - groundY, 15);

        s.carY += (groundY - 30 - s.carY) * 0.3;
        s.scrollX += s.speed;

        s.wheelAngle += s.speed * 0.2;
        s.dist = Math.floor(s.scrollX / 10);
        setDistance(s.dist);

        if (s.angle > 0.6 || s.angle < -0.8) {
          setGameOver(true);
        }
      }

      ctx.save();
      ctx.translate(-s.scrollX, 0);
      s.hills.forEach((h) => {
        if (h.x + h.r < s.scrollX - 50 || h.x - h.r > s.scrollX + W + 50) return;
        ctx.fillStyle = "#3a5a3a";
        ctx.beginPath();
        ctx.arc(h.x, h.y + 60, h.r, Math.PI, 0);
        ctx.lineTo(h.x + h.r, H + 10);
        ctx.lineTo(h.x - h.r, H + 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#4a7a4a";
        ctx.beginPath();
        ctx.arc(h.x, h.y + 60, h.r * 0.95, Math.PI, 0);
        ctx.lineTo(h.x + h.r * 0.95, H + 10);
        ctx.lineTo(h.x - h.r * 0.95, H + 10);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      ctx.save();
      ctx.translate(s.scrollX + s.carX, s.carY);
      ctx.rotate(s.angle);

      ctx.fillStyle = "#d04040";
      ctx.beginPath();
      ctx.roundRect(-22, -18, 44, 16, 4);
      ctx.fill();

      ctx.fillStyle = "#e0e0e0";
      ctx.beginPath();
      ctx.roundRect(-18, -20, 18, 8, 2);
      ctx.fill();

      ctx.fillStyle = "#40a0f0";
      ctx.beginPath();
      ctx.roundRect(-16, -19, 14, 6, 2);
      ctx.fill();

      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(-12, 2, 7, 0, Math.PI * 2);
      ctx.arc(12, 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#666";
      ctx.beginPath();
      ctx.arc(-12, 2, 4, 0, Math.PI * 2);
      ctx.arc(12, 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(-12, 2);
      ctx.rotate(s.wheelAngle);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
      ctx.moveTo(0, -3); ctx.lineTo(0, 3);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(12, 2);
      ctx.rotate(s.wheelAngle);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
      ctx.moveTo(0, -3); ctx.lineTo(0, 3);
      ctx.stroke();
      ctx.restore();

      if (s.boosting && Math.random() > 0.5) {
        ctx.fillStyle = "rgba(255,200,50,0.6)";
        ctx.beginPath();
        ctx.arc(-24, -10, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${s.dist}м`, W / 2, 35);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [started, gameOver]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[clamp(24px,5vw,40px)] text-white font-bold">🚗 Hill Climb Cat</div>
        <canvas ref={canvasRef} width={W} height={H} className="rounded-2xl shadow-xl" />
        <button onClick={startGame} className="bg-amber-500 text-white px-8 py-3 rounded-2xl text-lg font-bold active:scale-95 shadow-lg">
          Играть
        </button>
        <button onClick={onBack} className="text-white/60 text-sm">← Назад</button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[clamp(20px,4vw,32px)] text-white font-bold">Машина перевернулась!</div>
        <div className="text-white text-xl">Дистанция: {distance}м</div>
        <div className="flex gap-3 mt-4">
          <button onClick={startGame} className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold active:scale-95 shadow-lg">
            Заново
          </button>
          <button onClick={onBack} className="bg-white/20 text-white px-6 py-3 rounded-2xl font-bold active:scale-95">
            Домой
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <canvas ref={canvasRef} width={W} height={H} className="rounded-2xl shadow-xl" />
      <div className="flex gap-4 mt-4">
        <button className="w-16 h-16 bg-white/20 rounded-full text-xl active:bg-white/30">←</button>
        <button className="w-16 h-16 bg-amber-500/80 rounded-full text-xl active:bg-amber-600">Газ</button>
      </div>
    </div>
  );
}
