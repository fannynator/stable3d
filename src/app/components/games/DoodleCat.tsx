import { useState, useEffect, useCallback, useRef } from "react";

interface DoodleCatProps {
  onBack: () => void;
}

const W = 300;
const H = 500;
const CAT_W = 28;
const CAT_H = 28;
const PLAT_W = 60;
const PLAT_H = 12;
const JUMP_VEL = -9;
const GRAVITY = 0.3;

function makePlatforms() {
  const ps: { x: number; y: number; w: number }[] = [];
  ps.push({ x: W / 2 - PLAT_W / 2, y: H - 30, w: PLAT_W });
  for (let i = 1; i < 8; i++) {
    ps.push({ x: 20 + Math.random() * (W - PLAT_W - 40), y: H - 30 - i * 55, w: PLAT_W });
  }
  return ps;
}

export function DoodleCat({ onBack }: DoodleCatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    catX: W / 2 - CAT_W / 2,
    catY: H - 60,
    velY: 0,
    dir: 1,
    platforms: makePlatforms(),
    scrollY: 0,
    score: 0,
    tilt: 0,
  });

  const jump = useCallback(() => {
    stateRef.current.velY = JUMP_VEL;
  }, []);

  const handleTilt = useCallback((dir: number) => {
    stateRef.current.dir = dir;
    stateRef.current.tilt = dir;
  }, []);

  const startGame = useCallback(() => {
    setStarted(true);
    setScore(0);
    setGameOver(false);
    stateRef.current = {
      catX: W / 2 - CAT_W / 2,
      catY: H - 60,
      velY: 0,
      dir: 1,
      platforms: makePlatforms(),
      scrollY: 0,
      score: 0,
      tilt: 0,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId = 0;
    let moveDir = 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") moveDir = -1;
      if (e.key === "ArrowRight" || e.key === "d") moveDir = 1;
    };
    const handleKeyUp = () => { moveDir = 0; };

    const handleTouch = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const rect = canvas.getBoundingClientRect();
      const relX = (x - rect.left) / rect.width;
      moveDir = relX < 0.5 ? -1 : 1;
    };
    const handleTouchEnd = () => { moveDir = 0; };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouch);
    canvas.addEventListener("touchend", handleTouchEnd);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a0a3e");
      grad.addColorStop(1, "#2d1566");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const s = stateRef.current;
      if (started && !gameOver) {
        s.velY += GRAVITY;
        s.catY += s.velY;
        s.catX += moveDir * 3.5;

        if (s.catX < 0) s.catX = W - CAT_W;
        if (s.catX > W) s.catX = 0;

        if (s.velY > 0) {
          for (const p of s.platforms) {
            if (
              s.catX + CAT_W > p.x &&
              s.catX < p.x + p.w &&
              s.catY + CAT_H >= p.y &&
              s.catY + CAT_H <= p.y + PLAT_H + 4
            ) {
              s.velY = JUMP_VEL;
              break;
            }
          }
        }

        const targetScroll = s.catY - H * 0.4;
        if (targetScroll < s.scrollY) {
          s.scrollY = targetScroll;
        }

        if (s.catY - s.scrollY > H) {
          setGameOver(true);
          return;
        }

        s.platforms.forEach((p) => {
          const screenY = p.y - s.scrollY;
          if (screenY > H + 20) {
            p.y = s.scrollY - 20;
            p.x = 20 + Math.random() * (W - PLAT_W - 40);
          }
        });

        const newScore = Math.floor(-s.scrollY / 55);
        if (newScore > s.score) {
          s.score = newScore;
          setScore(s.score);
        }
      }

      s.platforms.forEach((p) => {
        const sy = p.y - s.scrollY;
        if (sy < -20 || sy > H + 20) return;
        ctx.fillStyle = "#6ab0f0";
        ctx.beginPath();
        ctx.roundRect(p.x, sy, p.w, PLAT_H, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(p.x + 4, sy + 2, p.w - 8, 3);
      });

      const screenCatY = s.catY - s.scrollY;
      ctx.save();
      ctx.translate(s.catX + CAT_W / 2, screenCatY + CAT_H / 2);

      ctx.fillStyle = "#f0a030";
      ctx.beginPath();
      ctx.ellipse(0, 0, CAT_W / 2, CAT_H / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(-5, -3, 4, 0, Math.PI * 2);
      ctx.arc(5, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-4 + moveDir * 1.5, -3, 2, 0, Math.PI * 2);
      ctx.arc(6 + moveDir * 1.5, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f0a030";
      ctx.beginPath();
      ctx.moveTo(-6, -9);
      ctx.lineTo(-3, -16);
      ctx.lineTo(0, -9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(3, -16);
      ctx.lineTo(6, -9);
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(s.score), W / 2, 35);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [started, gameOver]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[clamp(24px,5vw,40px)] text-white font-bold">🐱 Doodle Cat</div>
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
        <div className="text-[clamp(20px,4vw,32px)] text-white font-bold">Игра окончена!</div>
        <div className="text-white text-xl">Счёт: {score}</div>
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
      <canvas ref={canvasRef} width={W} height={H} className="rounded-2xl shadow-xl" onClick={jump} />
      <div className="flex gap-4 mt-4">
        <button onMouseDown={() => handleTilt(-1)} onMouseUp={() => handleTilt(0)} onTouchStart={() => handleTilt(-1)} onTouchEnd={() => handleTilt(0)} className="w-16 h-16 bg-white/20 rounded-full text-2xl active:bg-white/30">←</button>
        <button onMouseDown={() => handleTilt(1)} onMouseUp={() => handleTilt(0)} onTouchStart={() => handleTilt(1)} onTouchEnd={() => handleTilt(0)} className="w-16 h-16 bg-white/20 rounded-full text-2xl active:bg-white/30">→</button>
      </div>
    </div>
  );
}
