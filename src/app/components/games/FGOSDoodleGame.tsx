import { useState, useEffect, useRef, useCallback } from "react";
import {
  createSlingWorld,
  updateSlingPhysics,
  startAim,
  updateAim,
  launchCat,
  spawnNextAnchors,
  generateMathTask,
  generateRussianTask,
  destroySlingWorld,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  MAX_LIVES,
} from "../../../engine/matter/doodle/FGOSDoodlePhysics";
import { renderSlingCat } from "../../../engine/matter/doodle/FGOSDoodleRenderer";
import type { SlingCatState, QuestionTask } from "../../../engine/matter/doodle/FGOSDoodlePhysics";
import type { Subject } from "../../types";

interface SlingCatGameProps {
  subject: Subject;
  onBack: () => void;
  onReward: (gems: number) => void;
}

function makeTask(subject: Subject, level: number): QuestionTask {
  const d = Math.min(5, Math.floor(level / 5) + 1);
  return subject === "math" ? generateMathTask(d) : generateRussianTask(d);
}

export function FGOSDoodleGame({ subject, onBack, onReward }: SlingCatGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SlingCatState | null>(null);
  const levelRef = useRef(0);
  const [phase, setPhase] = useState<"briefing" | "playing" | "gameover">("briefing");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [question, setQuestion] = useState<QuestionTask | null>(null);

  const showBriefing = useCallback(() => {
    stateRef.current = null;
    levelRef.current = 0;
    const task = makeTask(subject, 0);
    setQuestion(task);
    setPhase("briefing");
  }, [subject]);

  const launchGame = useCallback(() => {
    const task = makeTask(subject, 0);
    const state = createSlingWorld(task, {
      onAttach: () => {
        const s = stateRef.current;
        if (!s) return;
        levelRef.current++;
        setScore(s.score);
        setTimeout(() => {
          if (s && !s.gameOver) {
            const nextTask = makeTask(subject, levelRef.current);
            spawnNextAnchors(s, nextTask);
            setQuestion(nextTask);
          }
        }, 400);
      },
      onMiss: () => {
        const s = stateRef.current;
        if (s) setLives(s.lives);
      },
      onGameOver: () => {
        const s = stateRef.current;
        if (!s) return;
        setScore(s.score);
        setLives(0);
        setPhase("gameover");
        onReward(s.correctHits * 5 + s.score);
      },
    });
    stateRef.current = state;
    setScore(0);
    setLives(MAX_LIVES);
    setQuestion(task);
    setPhase("playing");
  }, [subject, onReward]);

  // ── Slingshot controls (mouse + touch) ──
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let dragging = false;

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      dragging = true;
      const ce = "touches" in e ? e.touches[0] : e;
      const coords = getCanvasCoords(ce.clientX, ce.clientY);
      stateRef.current && startAim(stateRef.current, coords.x, coords.y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const ce = "touches" in e ? e.touches[0] : e;
      if (!ce) return;
      const coords = getCanvasCoords(ce.clientX, ce.clientY);
      stateRef.current && updateAim(stateRef.current, coords.x, coords.y);
    };
    const onUp = () => {
      dragging = false;
      stateRef.current && launchCat(stateRef.current);
    };

    container.addEventListener("mousedown", onDown);
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseup", onUp);
    container.addEventListener("mouseleave", onUp);
    container.addEventListener("touchstart", onDown, { passive: false });
    container.addEventListener("touchmove", onMove, { passive: false });
    container.addEventListener("touchend", onUp);

    return () => {
      container.removeEventListener("mousedown", onDown);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseup", onUp);
      container.removeEventListener("mouseleave", onUp);
      container.removeEventListener("touchstart", onDown);
      container.removeEventListener("touchmove", onMove);
      container.removeEventListener("touchend", onUp);
    };
  }, [getCanvasCoords]);

  // Keyboard fallback
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (phase === "briefing") launchGame();
        else if (phase === "gameover") showBriefing();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [phase, launchGame, showBriefing]);

  // ── Game loop ──
  useEffect(() => {
    if (phase !== "playing") return;
    let frameId = 0;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      updateSlingPhysics(state);

      const ctx = canvas.getContext("2d");
      if (ctx) renderSlingCat(state, ctx);

      if (state.gameOver) {
        setScore(state.score);
        setLives(0);
        setPhase("gameover");
        onReward(state.correctHits * 5 + state.score);
        cancelAnimationFrame(frameId);
      }
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [phase, onReward]);

  useEffect(() => () => { if (stateRef.current) destroySlingWorld(stateRef.current); }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm">
        <button onClick={onBack} className="text-white/80 hover:text-white font-bold text-sm">← Назад</button>
        <div className="flex items-center gap-3">
          {phase === "playing" && (
            <div className="flex gap-1">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={`text-sm ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
              ))}
            </div>
          )}
          <span className="text-white font-black text-sm">🏆 {score}</span>
        </div>
        <button onClick={showBriefing} className="text-white/80 hover:text-white font-bold text-sm">↻</button>
      </div>

      {/* Game canvas */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center relative cursor-crosshair">
        <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT}
          className="rounded-lg shadow-2xl" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
      </div>

      {/* Question overlay */}
      {phase === "playing" && question && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-xl">
            <p className="text-white font-black text-lg text-center drop-shadow-lg">
              {question.question}
            </p>
          </div>
        </div>
      )}

      {/* ── BRIEFING ── */}
      {phase === "briefing" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, #1a0a3e 0%, #2D1B69 60%, #4C1D95 100%)" }}>
          <div className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", animation: "fadeSlideUp 0.4s ease-out" }}>
            <div className="px-5 pt-5 pb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-400/20 flex items-center justify-center text-4xl flex-shrink-0"
                style={{ animation: "catBreathe 2s ease-in-out infinite", border: "2px solid rgba(251,191,36,0.3)" }}>🐱</div>
              <div>
                <div className="text-amber-200/70 text-[10px] font-bold uppercase tracking-wider">Кот-учёный</div>
                <p className="text-white font-black text-base leading-snug mt-0.5">Нажми на меня, потяни ВНИЗ и отпусти — я полечу к правильному ответу! 🎯</p>
              </div>
            </div>
            {question && (
              <div className="px-5 pb-3">
                <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-white/50 text-[10px] font-bold uppercase mb-1">Пример задания</p>
                  <p className="text-white font-black text-xl">{question.question}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    {[question.correctAnswer, ...question.wrongAnswers].sort(() => Math.random() - 0.5).map((v, i) => (
                      <span key={i} className="text-sm font-bold px-3 py-1 rounded-xl bg-white/10 text-white/70">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="px-5 pb-3">
              <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white/60 text-[10px] font-bold uppercase mb-2">Как играть</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">👇</span><span className="text-white/85 text-sm font-bold">Зажми кота и тяни вниз — появится линия прицела</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">🟢</span><span className="text-white/85 text-sm font-bold">Попади в ПРАВИЛЬНЫЙ ответ — кот зацепится!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span><span className="text-white/85 text-sm font-bold">Ошибёшься — потеряешь жизнь ❤️</span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={launchGame}
                className="w-full py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-lg"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "white", boxShadow: "0 8px 25px rgba(245,158,11,0.35)" }}>
                🚀 Поехали!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME OVER ── */}
      {phase === "gameover" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
          <div className="text-center px-6" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
            <div className="text-6xl mb-4">💫</div>
            <h2 className="text-white font-black text-2xl mb-2">Игра окончена!</h2>
            <p className="text-amber-300 font-black text-lg mb-1">Счёт: {score}</p>
            <p className="text-red-300 text-sm mb-4">Ошибок: {MAX_LIVES - lives}</p>
            <button onClick={showBriefing}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
              Играть снова 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
