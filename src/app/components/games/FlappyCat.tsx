import { useState, useEffect, useCallback, useRef } from "react";

interface FlappyCatProps {
  onBack: () => void;
}

const GRAVITY = 0.35;
const JUMP = -6;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const CAT_SIZE = 30;
const GAME_SPEED = 2;

export function FlappyCat({ onBack }: FlappyCatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const s = localStorage.getItem("flappy_best");
    return s ? parseInt(s) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    catY: 200,
    velocity: 0,
    pipes: [] as { x: number; gapY: number }[],
    frame: 0,
    score: 0,
  });

  const jump = useCallback(() => {
    if (!started) {
      setStarted(true);
      stateRef.current = { catY: 200, velocity: 0, pipes: [], frame: 0, score: 0 };
    }
    stateRef.current.velocity = JUMP;
  }, [started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let animId = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a0a3e");
      grad.addColorStop(1, "#3a1d70");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,200,0.3)";
      for (let i = 0; i < 15; i++) {
        const sx = (i * 97 + stateRef.current.frame * 0.1) % W;
        const sy = (i * 43) % (H * 0.4);
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const s = stateRef.current;
      if (started && !gameOver) {
        s.velocity += GRAVITY;
        s.catY += s.velocity;
        s.frame++;

        if (s.frame % 90 === 0) {
          const gapY = 80 + Math.random() * (H - PIPE_GAP - 160);
          s.pipes.push({ x: W, gapY });
        }

        s.pipes.forEach((p) => { p.x -= GAME_SPEED; });

        s.pipes = s.pipes.filter((p) => p.x > -PIPE_WIDTH);

        s.pipes.forEach((p) => {
          if (p.x + PIPE_WIDTH < W / 2 - CAT_SIZE / 2 && p.x + PIPE_WIDTH + GAME_SPEED >= W / 2 - CAT_SIZE / 2) {
            s.score++;
            setScore(s.score);
          }
        });

        for (const p of s.pipes) {
          const catLeft = W / 2 - CAT_SIZE / 2;
          const catRight = W / 2 + CAT_SIZE / 2;
          const catTop = s.catY - CAT_SIZE / 2;
          const catBot = s.catY + CAT_SIZE / 2;

          if (catRight > p.x && catLeft < p.x + PIPE_WIDTH) {
            if (catTop < p.gapY || catBot > p.gapY + PIPE_GAP) {
              setGameOver(true);
              return;
            }
          }
        }

        if (s.catY > H || s.catY < 0) {
          setGameOver(true);
          return;
        }
      }

      s.pipes.forEach((p) => {
        const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
        pipeGrad.addColorStop(0, "#4a90d9");
        pipeGrad.addColorStop(0.5, "#6ab0f0");
        pipeGrad.addColorStop(1, "#4a90d9");
        ctx.fillStyle = pipeGrad;

        ctx.beginPath();
        ctx.roundRect(p.x, 0, PIPE_WIDTH, p.gapY, [6, 6, 0, 0]);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - p.gapY - PIPE_GAP, [0, 0, 6, 6]);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(p.x + 3, 0, 4, p.gapY);
        ctx.fillRect(p.x + 3, p.gapY + PIPE_GAP, 4, H - p.gapY - PIPE_GAP);
      });

      const cx = W / 2;
      const cy = s.catY;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.min(s.velocity * 0.05, 0.5));

      ctx.fillStyle = "#f0a030";
      ctx.beginPath();
      ctx.ellipse(0, 0, CAT_SIZE / 2, CAT_SIZE / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e09020";
      ctx.beginPath();
      ctx.ellipse(0, 2, CAT_SIZE / 2 - 3, CAT_SIZE / 2 - 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(-5, -4, 5, 0, Math.PI * 2);
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-4, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f0a030";
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-4, -18);
      ctx.lineTo(0, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(4, -18);
      ctx.lineTo(8, -10);
      ctx.fill();

      ctx.fillStyle = "#ff8888";
      ctx.beginPath();
      ctx.ellipse(-4, -1, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4, -1, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(s.score), W / 2, 40);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [started, gameOver]);

  useEffect(() => {
    if (gameOver) {
      const best = Math.max(score, bestScore);
      setBestScore(best);
      localStorage.setItem("flappy_best", String(best));
    }
  }, [gameOver]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6" onClick={jump}>
        <div className="text-[clamp(24px,5vw,40px)] text-white font-bold">🐱 Flappy Cat</div>
        <canvas ref={canvasRef} width={300} height={500} className="rounded-2xl shadow-xl" />
        <button className="bg-amber-500 text-white px-8 py-3 rounded-2xl text-lg font-bold active:scale-95 shadow-lg">
          Тапни чтобы начать
        </button>
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="text-white/60 text-sm">← Назад</button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" onClick={jump}>
        <div className="text-[clamp(20px,4vw,32px)] text-white font-bold">Игра окончена!</div>
        <div className="text-white text-xl">Счёт: {score}</div>
        <div className="text-white/60 text-sm">Рекорд: {bestScore}</div>
        <div className="flex gap-3 mt-4">
          <button onClick={(e) => { e.stopPropagation(); setScore(0); setGameOver(false); setStarted(false); }} className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold active:scale-95 shadow-lg">
            Заново
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="bg-white/20 text-white px-6 py-3 rounded-2xl font-bold active:scale-95">
            Домой
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full" onClick={jump}>
      <canvas ref={canvasRef} width={300} height={500} className="rounded-2xl shadow-xl cursor-pointer" />
    </div>
  );
}
