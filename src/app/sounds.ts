let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

export function playCorrectSound() {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
  o1.type = "sine"; o1.frequency.setValueAtTime(523.25, now); o1.frequency.setValueAtTime(659.25, now + 0.08);
  g1.gain.setValueAtTime(0.25, now); g1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  o1.connect(g1); g1.connect(ctx.destination); o1.start(now); o1.stop(now + 0.3);
  const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
  o2.type = "sine"; o2.frequency.setValueAtTime(659.25, now + 0.1); o2.frequency.setValueAtTime(783.99, now + 0.18);
  g2.gain.setValueAtTime(0.2, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
  o2.connect(g2); g2.connect(ctx.destination); o2.start(now + 0.1); o2.stop(now + 0.45);
}

export function playWrongSound() {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(220, now); o.frequency.linearRampToValueAtTime(110, now + 0.35);
  g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.4);
}

export function playMeowSound() {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
  o1.type = "triangle"; o1.frequency.setValueAtTime(650, now); o1.frequency.linearRampToValueAtTime(850, now + 0.06);
  g1.gain.setValueAtTime(0.2, now); g1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  o1.connect(g1); g1.connect(ctx.destination); o1.start(now); o1.stop(now + 0.15);
  const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
  o2.type = "triangle"; o2.frequency.setValueAtTime(450, now + 0.08); o2.frequency.linearRampToValueAtTime(320, now + 0.35);
  g2.gain.setValueAtTime(0.14, now + 0.08); g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  o2.connect(g2); g2.connect(ctx.destination); o2.start(now + 0.08); o2.stop(now + 0.4);
}

export function playAchievementSound() {
  const ctx = getCtx(); if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f, now + i * 0.12);
    g.gain.setValueAtTime(0.22, now + i * 0.12); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.35);
  });
}

export function spawnConfetti() {
  const c = document.createElement("div");
  c.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;";
  document.body.appendChild(c);
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.textContent = "●";
    p.style.cssText = `position:fixed;left:${Math.random() * 100}%;top:-${Math.random() * 100}px;color:${colors[Math.floor(Math.random() * colors.length)]};font-size:${Math.random() * 10 + 6}px;animation:confettiDrop ${Math.random() * 0.4 + 0.5}s ${Math.random() * 0.3}s ease-in forwards;`;
    c.appendChild(p);
  }
  setTimeout(() => c.remove(), 1200);
}

export function spawnLeaves() {
  const c = document.createElement("div");
  c.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;";
  document.body.appendChild(c);
  const leaves = ["🍃", "🌿", "🍂", "🍁", "🌱", "✨"];
  for (let i = 0; i < 20; i++) {
    const l = document.createElement("span");
    l.textContent = leaves[Math.floor(Math.random() * leaves.length)];
    l.style.cssText = `position:fixed;left:${Math.random() * 100}%;top:-${Math.random() * 50}px;font-size:${Math.random() * 16 + 10}px;animation:leafFall ${Math.random() * 1.5 + 2}s ${Math.random() * 0.8}s linear forwards;pointer-events:none;`;
    c.appendChild(l);
  }
  setTimeout(() => c.remove(), 3500);
}
