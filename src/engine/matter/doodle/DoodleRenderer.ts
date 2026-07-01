import type { DoodleState } from "./DoodlePhysics";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./DoodlePhysics";

/**
 * Canvas renderer for Doodle Jump physics.
 * Pure rendering function — no game logic, just draws the state.
 */

const CAT_COLOR = "#F59E0B";
const CAT_EYE_COLOR = "#1E293B";
const PLATFORM_COLOR = "#7C3AED";
const PLATFORM_GRADIENT_TOP = "#8B5CF6";
const BG_COLOR = "#0a1628";
const BG_STAR_COLORS = ["#ffffff", "#a78bfa", "#fbbf24"];

interface DoodleRendererOptions {
  /** Current canvas 2D context */
  ctx: CanvasRenderingContext2D;
  /** Camera Y scroll offset */
  scrollY: number;
}

let stars: { x: number; y: number; r: number; color: string }[] | null = null;

function ensureStars() {
  if (stars) return stars;
  stars = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      r: 0.5 + Math.random() * 2,
      color: BG_STAR_COLORS[Math.floor(Math.random() * BG_STAR_COLORS.length)],
    });
  }
  return stars;
}

/**
 * Render the current physics state to canvas.
 */
export function renderDoodle(state: DoodleState, opts: DoodleRendererOptions): void {
  const { ctx, scrollY } = opts;

  // Clear + background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Stars (parallax, scroll slower)
  const allStars = ensureStars();
  for (const star of allStars) {
    const sy = star.y + scrollY * 0.3;
    ctx.fillStyle = star.color;
    ctx.globalAlpha = 0.4 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(star.x, sy % (WORLD_HEIGHT + 50) - 25, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Scroll transform
  ctx.save();
  ctx.translate(0, scrollY);

  // Platforms
  for (const platform of state.platforms) {
    const { x, y } = platform.body.position;
    const w = 60;
    const h = 12;
    const gradient = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
    gradient.addColorStop(0, PLATFORM_GRADIENT_TOP);
    gradient.addColorStop(1, PLATFORM_COLOR);

    ctx.fillStyle = gradient;
    ctx.shadowColor = "#7C3AED66";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Cat
  const cx = state.cat.position.x;
  const cy = state.cat.position.y;
  const angle = state.cat.angle;
  const r = 14;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Cat body
  ctx.fillStyle = CAT_COLOR;
  ctx.shadowColor = "#F59E0B44";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-5, -3, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, -3, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = CAT_EYE_COLOR;
  ctx.beginPath();
  ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = "#F472B6";
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(-2, 4);
  ctx.lineTo(2, 4);
  ctx.closePath();
  ctx.fill();

  // Ears
  ctx.fillStyle = CAT_COLOR;
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-4, -10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -10);
  ctx.lineTo(12, -18);
  ctx.lineTo(4, -10);
  ctx.fill();

  // Inner ears
  ctx.fillStyle = "#F472B6";
  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.lineTo(-10, -16);
  ctx.lineTo(-5, -10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7, -10);
  ctx.lineTo(10, -16);
  ctx.lineTo(5, -10);
  ctx.fill();

  ctx.restore();

  // Restore scroll transform
  ctx.restore();
}
