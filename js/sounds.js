// js/sounds.js

function getCtx() {
    try {
        return new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        return null;
    }
}

function playCorrectSound() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
        o1.type = 'sine'; o1.frequency.setValueAtTime(523.25, now); o1.frequency.setValueAtTime(659.25, now + 0.08);
        g1.gain.setValueAtTime(0.25, now); g1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o1.connect(g1); g1.connect(ctx.destination); o1.start(now); o1.stop(now + 0.3);
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.setValueAtTime(659.25, now + 0.1); o2.frequency.setValueAtTime(783.99, now + 0.18);
        g2.gain.setValueAtTime(0.2, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(now + 0.1); o2.stop(now + 0.45);
    } catch (e) {}
}

function playWrongSound() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(220, now); o.frequency.linearRampToValueAtTime(110, now + 0.35);
        g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.4);
    } catch (e) {}
}

function playAchievementSound() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((f, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.22, now + i * 0.12); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
            o.connect(g); g.connect(ctx.destination); o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.35);
        });
        [523.25, 659.25, 783.99].forEach(f => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(f, now + 0.5);
            g.gain.setValueAtTime(0.15, now + 0.5); g.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
            o.connect(g); g.connect(ctx.destination); o.start(now + 0.5); o.stop(now + 0.9);
        });
    } catch (e) {}
}

function playMeowSound() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        // "Мя" — короткий высокий
        const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(650, now);
        o1.frequency.linearRampToValueAtTime(850, now + 0.06);
        g1.gain.setValueAtTime(0.2, now);
        g1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        o1.connect(g1); g1.connect(ctx.destination); o1.start(now); o1.stop(now + 0.15);
        // "у" — протяжный низкий
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(450, now + 0.08);
        o2.frequency.linearRampToValueAtTime(320, now + 0.35);
        g2.gain.setValueAtTime(0.14, now + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(now + 0.08); o2.stop(now + 0.4);
    } catch (e) {}
}

export function spawnConfetti() {
    const c = document.createElement('div'); c.className = 'confetti-container'; document.body.appendChild(c);
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('span'); p.className = 'confetti-piece'; p.textContent = '●';
        p.style.left = Math.random() * 100 + '%'; p.style.top = -(Math.random() * 100) + 'px';
        p.style.color = colors[Math.floor(Math.random() * colors.length)];
        p.style.fontSize = (Math.random() * 10 + 6) + 'px';
        p.style.animationDelay = Math.random() * 0.3 + 's';
        p.style.animationDuration = (Math.random() * 0.4 + 0.5) + 's';
        c.appendChild(p);
    }
    setTimeout(() => c.remove(), 1200);
}

export function spawnLeaves() {
    const c = document.createElement('div'); c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;';
    document.body.appendChild(c);
    const leaves = ['🍃', '🌿', '🍂', '🍁', '🌱', '✨'];
    for (let i = 0; i < 20; i++) {
        const l = document.createElement('span'); l.className = 'leaf-particle'; l.textContent = leaves[Math.floor(Math.random() * leaves.length)];
        l.style.left = Math.random() * 100 + '%'; l.style.top = -(Math.random() * 50) + 'px';
        l.style.fontSize = (Math.random() * 16 + 10) + 'px';
        l.style.animationDelay = Math.random() * 0.8 + 's';
        l.style.animationDuration = (Math.random() * 1.5 + 2) + 's';
        c.appendChild(l);
    }
    setTimeout(() => c.remove(), 3500);
}

export function spawnGems(count, startX, startY, targetEl) {
    const target = targetEl || document.getElementById('gemCount');
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    for (let i = 0; i < count; i++) {
        const gem = document.createElement('span');
        gem.textContent = '💎';
        gem.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;font-size:16px;pointer-events:none;z-index:1000;transition:all 0.8s;opacity:1;`;
        document.body.appendChild(gem);
        requestAnimationFrame(() => {
            gem.style.left = targetX + 'px';
            gem.style.top = targetY + 'px';
            gem.style.opacity = '0';
            gem.style.transform = 'scale(0.3)';
        });
        setTimeout(() => gem.remove(), 900);
    }
}

/** Звуковые пресеты для тем */
const THEME_SOUNDS = {
    forest: {
        correct: () => playXylophone([523, 659, 784]),
        wrong: () => playWoodThump(),
        achievement: () => playXylophone([392, 523, 659, 784], 0.15)
    },
    space: {
        correct: () => playSynthChime(),
        wrong: () => playAlienBuzz(),
        achievement: () => playSynthArpeggio()
    },
    underwater: {
        correct: () => playBubblePop(),
        wrong: () => playSplash(),
        achievement: () => playBubbleMelody()
    }
};

function playXylophone(notes, delay = 0.12) {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        notes.forEach((f, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * delay);
            g.gain.setValueAtTime(0.2, now + i * delay);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * delay + 0.35);
            o.connect(g); g.connect(ctx.destination);
            o.start(now + i * delay); o.stop(now + i * delay + 0.35);
        });
    } catch (e) {}
}

function playWoodThump() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(180, now);
        o.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.35);
    } catch (e) {}
}

function playSynthChime() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        [880, 1100, 1320].forEach((f, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            const f1 = ctx.createBiquadFilter();
            f1.type = 'lowpass'; f1.frequency.value = 3000;
            o.type = 'sawtooth'; o.frequency.setValueAtTime(f, now + i * 0.08);
            g.gain.setValueAtTime(0.12, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
            o.connect(f1); f1.connect(g); g.connect(ctx.destination);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.25);
        });
    } catch (e) {}
}

function playAlienBuzz() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const f1 = ctx.createBiquadFilter();
        f1.type = 'lowpass'; f1.frequency.value = 500;
        o.type = 'square'; o.frequency.setValueAtTime(150, now);
        o.frequency.linearRampToValueAtTime(80, now + 0.35);
        g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        o.connect(f1); f1.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.4);
    } catch (e) {}
}

function playSynthArpeggio() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        [660, 880, 1100, 1320].forEach((f, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            const f1 = ctx.createBiquadFilter();
            f1.type = 'lowpass'; f1.frequency.value = 3000;
            o.type = 'sawtooth'; o.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.1, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
            o.connect(f1); f1.connect(g); g.connect(ctx.destination);
            o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.3);
        });
    } catch (e) {}
}

function playBubblePop() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(400, now);
        o.frequency.linearRampToValueAtTime(600, now + 0.06);
        o.frequency.linearRampToValueAtTime(800, now + 0.12);
        g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.25);
    } catch (e) {}
}

function playSplash() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(100, now + 0.45);
        g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.5);
    } catch (e) {}
}

function playBubbleMelody() {
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        [350, 500, 700, 900].forEach((f, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.15);
            o.frequency.linearRampToValueAtTime(f * 1.2, now + i * 0.15 + 0.1);
            g.gain.setValueAtTime(0.15, now + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
            o.connect(g); g.connect(ctx.destination);
            o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.4);
        });
    } catch (e) {}
}

export function playSound(type, themeId) {
    const theme = themeId && THEME_SOUNDS[themeId];
    if (theme && theme[type]) {
        theme[type]();
        if (type === 'achievement') spawnConfetti();
        return;
    }
    switch (type) {
        case 'correct': playCorrectSound(); break;
        case 'wrong': playWrongSound(); break;
        case 'achievement': playAchievementSound(); spawnConfetti(); break;
        case 'pet': playMeowSound(); break;
        case 'meow': playMeowSound(); break;
    }
}