/** Particle system shared between physics and renderer */

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

let particles: Particle[] = [];

export function emitParticles(x: number, y: number, count: number, color: string) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 5 - 1,
      life: 0, maxLife: 20 + Math.random() * 15,
      color,
      size: 1.5 + Math.random() * 3,
    });
  }
}

export function getParticles(): Particle[] {
  return particles;
}

export function getAndUpdateParticles(): Particle[] {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    if (p.life >= p.maxLife) particles.splice(i, 1);
  }
  return particles;
}
