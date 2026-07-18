import type { SlingCatState } from "./FGOSDoodlePhysics";
import {
  WORLD_WIDTH, WORLD_HEIGHT, CAT_RADIUS, ANCHOR_RADIUS, MAX_LIVES,
  GRAVITY_Y, VELOCITY_COEFFICIENT, CONSTRAINT_LENGTH,
} from "./FGOSDoodlePhysics";

const FAR_STARS = Array.from({ length: 20 }, () => ({
  x: Math.random() * WORLD_WIDTH, y: Math.random() * WORLD_HEIGHT,
  r: 0.5 + Math.random() * 1.5, c: "#a78bfa" + Math.floor(40 + Math.random() * 40).toString(16),
}));

// ── Trail buffer ──
const MAX_TRAIL = 12;
const trail: { x: number; y: number; age: number }[] = [];

export function renderSlingCat(state: SlingCatState, ctx: CanvasRenderingContext2D): void {
  const time = performance.now() / 1000;

  // ── Background ──
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  sky.addColorStop(0, "#0a0a1e");
  sky.addColorStop(0.5, "#0f172a");
  sky.addColorStop(1, "#1a1040");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Stars
  for (const s of FAR_STARS) {
    ctx.fillStyle = s.c;
    ctx.globalAlpha = 0.3 + Math.sin(time * 2 + s.x * 0.05) * 0.15;
    ctx.beginPath();
    ctx.arc(s.x, (s.y + state.score * 2) % WORLD_HEIGHT, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Trail (during flight) ──
  if (!state.isAiming && !state.currentAnchor && !state.gameOver) {
    trail.push({ x: state.cat.position.x, y: state.cat.position.y, age: 0 });
    if (trail.length > MAX_TRAIL) trail.shift();
  }
  // Draw trail
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    t.age++;
    const alpha = Math.max(0, 1 - t.age / MAX_TRAIL) * 0.4;
    const size = CAT_RADIUS * 0.6 * (1 - t.age / MAX_TRAIL);
    ctx.fillStyle = `rgba(251,191,36,${alpha})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  // Clear trail when docked
  if (state.currentAnchor) trail.length = 0;

  // ── Rubber band + trajectory preview (while aiming) ──
  if (state.isAiming && state.aimStart && state.aimCurrent) {
    const catPos = state.cat.position;
    const mx = state.aimCurrent.x;
    const my = state.aimCurrent.y;

    // Rubber band line (from cat toward finger)
    ctx.strokeStyle = "#FCD34D";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(catPos.x, catPos.y);
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;

    // Trajectory preview — simulate forward from launch direction
    const anchorPos = state.currentAnchor?.body.position || { x: catPos.x, y: catPos.y };
    const dx = anchorPos.x - catPos.x;
    const dy = anchorPos.y - catPos.y;
    const g = GRAVITY_Y * 0.001;
    let sx = catPos.x, sy = catPos.y;
    let svx = dx * VELOCITY_COEFFICIENT;
    let svy = dy * VELOCITY_COEFFICIENT;
    for (let i = 0; i < 40; i++) {
      svy += g * 16.67 * 100;
      sx += svx * 16.67;
      sy += svy * 16.67;
      if (i % 2 === 0) {
        const fade = 1 - i / 40;
        ctx.fillStyle = `rgba(252,211,77,${fade * 0.6})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5 - (i / 40) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sy < -60 || sx < -40 || sx > WORLD_WIDTH + 40) break;
    }

    // Finger indicator
    ctx.fillStyle = "#FCD34D";
    ctx.shadowColor = "#FCD34D66";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Paw-arm (when cat is attached to anchor) ──
  if (state.currentAnchor && !state.isAiming) {
    const anchorPos = state.currentAnchor.body.position;
    const catPos = state.cat.position;

    // Draw a curved paw-arm from cat to anchor
    const midX = (anchorPos.x + catPos.x) / 2;
    const midY = (anchorPos.y + catPos.y) / 2 - 10;

    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(251,191,36,0.3)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(catPos.x, catPos.y - CAT_RADIUS * 0.5);
    ctx.quadraticCurveTo(midX, midY, anchorPos.x, anchorPos.y + ANCHOR_RADIUS * 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // Paw dot at anchor end
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(anchorPos.x, anchorPos.y + ANCHOR_RADIUS * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Anchors ──
  for (const anchor of state.anchors) {
    const { x, y } = anchor.body.position;
    const r = ANCHOR_RADIUS * 0.7;
    const isCurrent = state.currentAnchor === anchor;
    const pulse = isCurrent ? 1 + Math.sin(time * 5) * 0.1 : 1;

    // Glow
    const glowGrad = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.4);
    if (anchor.isCorrect) {
      glowGrad.addColorStop(0, anchor.visited ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.2)");
      glowGrad.addColorStop(1, "rgba(52,211,153,0)");
    } else {
      glowGrad.addColorStop(0, "rgba(248,113,113,0.3)");
      glowGrad.addColorStop(1, "rgba(248,113,113,0)");
    }
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(x, y, r * 1.4 * pulse, 0, Math.PI * 2); ctx.fill();

    // Anchor body
    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r);
    if (anchor.isCorrect) {
      if (anchor.visited) {
        grad.addColorStop(0, "#6EE7B7"); grad.addColorStop(1, "#059669");
      } else {
        grad.addColorStop(0, "#A7F3D0"); grad.addColorStop(1, "#34D399");
      }
    } else {
      grad.addColorStop(0, "#FCA5A5"); grad.addColorStop(1, "#DC2626");
    }
    ctx.fillStyle = grad;
    ctx.shadowColor = anchor.isCorrect ? "#34D39966" : "#F8717166";
    ctx.shadowBlur = 8 * pulse;
    ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Ring border
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, Math.PI * 2); ctx.stroke();

    // Label text
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${anchor.label.length > 3 ? 10 : 13}px 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 3;
    ctx.fillText(anchor.label, x, y);
    ctx.shadowBlur = 0;

    // Chain link icon if current
    if (isCurrent) {
      ctx.fillStyle = "#FCD34D";
      ctx.font = "12px sans-serif";
      ctx.fillText("🔗", x, y - r - 8);
    }
  }

  // ── Cat with squash & stretch ──
  const cx = state.cat.position.x;
  const cy = state.cat.position.y;
  const angle = state.cat.angle;
  const vx = state.cat.velocity.x;
  const vy = state.cat.velocity.y;
  const speed = Math.sqrt(vx * vx + vy * vy);

  // Squash/stretch based on velocity
  const stretchFactor = Math.min(speed * 0.08, 0.35);
  const stretchX = 1 + stretchFactor * 0.5;
  const stretchY = 1 - stretchFactor * 0.5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(stretchX, stretchY);

  // Glow
  const catGlow = ctx.createRadialGradient(0, 0, CAT_RADIUS * 0.5, 0, 0, CAT_RADIUS * 1.8);
  catGlow.addColorStop(0, "rgba(251,191,36,0.35)");
  catGlow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = catGlow;
  ctx.beginPath(); ctx.arc(0, 0, CAT_RADIUS * 1.8, 0, Math.PI * 2); ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(-3, -5, 2, 0, 0, CAT_RADIUS);
  bodyGrad.addColorStop(0, "#FEF3C7");
  bodyGrad.addColorStop(0.4, "#FBBF24");
  bodyGrad.addColorStop(1, "#D97706");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(0, 0, CAT_RADIUS, 0, Math.PI * 2); ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(-5.5, -3.5, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5.5, -3.5, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6EE7B7";
  ctx.beginPath(); ctx.arc(-4.5, -2.5, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6.5, -2.5, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-3.5, -1.5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7.5, -1.5, 2, 0, Math.PI * 2); ctx.fill();

  // Nose + ears
  ctx.fillStyle = "#F472B6";
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-3, 6); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#F59E0B";
  ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(-13, -21); ctx.lineTo(-3, -9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, -10); ctx.lineTo(13, -21); ctx.lineTo(3, -9); ctx.closePath(); ctx.fill();

  ctx.restore();

  // ── HUD ──
  for (let i = 0; i < MAX_LIVES; i++) {
    ctx.globalAlpha = i < state.lives ? 1 : 0.2;
    ctx.font = "16px sans-serif";
    ctx.fillText("❤️", 8 + i * 24, 22);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`🏆 ${state.score}`, WORLD_WIDTH - 8, 22);
  ctx.textAlign = "center";

  // Game over
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px 'Segoe UI', sans-serif";
    ctx.fillText("Игра окончена!", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 20);
    ctx.fillStyle = "#FCD34D";
    ctx.font = "bold 16px 'Segoe UI', sans-serif";
    ctx.fillText(`Счёт: ${state.score}`, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 10);
    ctx.fillStyle = "#34D399";
    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText(`✅ ${state.correctHits}  ❌ ${state.wrongHits}`, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 35);
  }
}
