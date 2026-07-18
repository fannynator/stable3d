import Matter from "matter-js";

/**
 * Sling Cat — vertical grappling hook (Sling Kong style).
 * Cat swings from anchor to anchor using slingshot mechanic.
 */

// ── Constants ──
const CAT_RADIUS = 14;
const ANCHOR_RADIUS = 18;
const WORLD_WIDTH = 300;
const WORLD_HEIGHT = 500;
const MAX_LIVES = 3;
const GRAVITY_Y = 0.8;
const ANCHOR_SPACING = 140;
const MAX_PULL_RADIUS = 90;
const VELOCITY_COEFFICIENT = 0.22;
const CAPTURE_THRESHOLD = CAT_RADIUS + ANCHOR_RADIUS + 10;
const CONSTRAINT_LENGTH = CAT_RADIUS + ANCHOR_RADIUS * 0.7 + 4;

// ── Types ──

export interface QuestionTask {
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export interface Anchor {
  body: Matter.Body;
  label: string;
  isCorrect: boolean;
  visited: boolean;
}

export interface SlingCatState {
  engine: Matter.Engine;
  cat: Matter.Body;
  anchors: Anchor[];
  currentAnchor: Anchor | null;
  constraint: Matter.Constraint | null;
  isAiming: boolean;
  aimStart: { x: number; y: number } | null;
  aimCurrent: { x: number; y: number } | null;
  score: number;
  lives: number;
  gameOver: boolean;
  currentTask: QuestionTask;
  correctHits: number;
  wrongHits: number;
  _callbacks?: {
    onAttach: () => void;
    onMiss: () => void;
    onGameOver: () => void;
  };
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeWrongs(correct: number, count: number): string[] {
  const s = new Set<string>();
  while (s.size < count) {
    const v = correct + rnd(-5, 5);
    if (v !== correct && v >= 0) s.add(String(v));
  }
  return [...s];
}

// ── Question generators ──

export function generateMathTask(difficulty: number): QuestionTask {
  const ops = ["+", "−", "×"] as const;
  const op = ops[rnd(0, 2)];
  let correct: number;
  let question: string;

  if (op === "+") {
    const a = rnd(2, difficulty <= 2 ? 15 : 40);
    const b = rnd(2, difficulty <= 2 ? 15 : 30);
    correct = a + b;
    question = `${a} + ${b} = ?`;
  } else if (op === "−") {
    const a = rnd(10, difficulty <= 2 ? 30 : 70);
    const b = rnd(1, a - 1);
    correct = a - b;
    question = `${a} − ${b} = ?`;
  } else {
    const a = rnd(2, 9); const b = rnd(2, 9);
    correct = a * b;
    question = `${a} × ${b} = ?`;
  }
  return { question, correctAnswer: String(correct), wrongAnswers: makeWrongs(correct, 2) };
}

export function generateRussianTask(_d: number): QuestionTask {
  const tasks = [
    { q: "ЖИ___А", a: "Р", w: ["Ы", "Ш"] },
    { q: "КОН___", a: "Ь", w: ["Ъ", "О"] },
    { q: "СЛО___О", a: "В", w: ["Ф", "Б"] },
    { q: "ПТИ___А", a: "Ц", w: ["Ч", "С"] },
    { q: "СА___А", a: "М", w: ["Н", "Л"] },
    { q: "КО___А", a: "Ш", w: ["Ж", "С"] },
    { q: "ВЕ___А", a: "Т", w: ["Д", "К"] },
    { q: "ДО___ОК", a: "М", w: ["Н", "Б"] },
  ];
  const t = tasks[rnd(0, tasks.length - 1)];
  return { question: t.q, correctAnswer: t.a, wrongAnswers: t.w };
}

// ── World creation ──

export function createSlingWorld(
  task: QuestionTask,
  callbacks?: SlingCatState["_callbacks"]
): SlingCatState {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
  });

  // Cat body
  const cat = Matter.Bodies.circle(WORLD_WIDTH / 2, WORLD_HEIGHT - 80, CAT_RADIUS, {
    restitution: 0.3,
    friction: 0.1,
    frictionAir: 0.01,
    label: "cat",
    collisionFilter: { category: 0x0001 },
  });

  // Start anchor (ground level)
  const startAnchorBody = Matter.Bodies.circle(WORLD_WIDTH / 2, WORLD_HEIGHT - 40, ANCHOR_RADIUS, {
    isStatic: true, label: "anchor_correct",
  });
  const startAnchor: Anchor = {
    body: startAnchorBody, label: "🐱", isCorrect: true, visited: true,
  };

  // Generate answer anchors
  const answerAnchors = generateAnchors(task);

  const anchors = [startAnchor, ...answerAnchors];
  const allBodies = [cat, ...anchors.map((a) => a.body)];

  Matter.Composite.add(engine.world, allBodies);

  // Attach cat to start anchor (FIRM constraint — no wobble)
  const constraint = Matter.Constraint.create({
    bodyA: cat,
    bodyB: startAnchorBody,
    length: CONSTRAINT_LENGTH,
    stiffness: 0.95,
    damping: 0.08,
  });
  Matter.Composite.add(engine.world, constraint);

  const state: SlingCatState = {
    engine, cat, anchors,
    currentAnchor: startAnchor,
    constraint,
    isAiming: false,
    aimStart: null,
    aimCurrent: null,
    score: 0, lives: MAX_LIVES, gameOver: false,
    currentTask: task, correctHits: 0, wrongHits: 0,
    _callbacks: callbacks,
  };

  // Collision detection
  Matter.Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const a = pair.bodyA; const b = pair.bodyB;
      const catBody = a.label === "cat" ? a : b.label === "cat" ? b : null;
      const anchorBody =
        (a.label?.startsWith("anchor_")) ? a : (b.label?.startsWith("anchor_")) ? b : null;
      if (!catBody || !anchorBody) continue;

      const anchor = anchors.find((an) => an.body === anchorBody);
      if (!anchor || anchor.visited) continue;

      const isCorrect = anchor.isCorrect;
      anchor.visited = true;

      if (isCorrect) {
        // Snap to this anchor — instant attach
        state.correctHits++;
        state.score += 10;
        snapCatToAnchor(state, anchor);
      } else {
        // Wrong anchor — just bounce, lose life
        state.wrongHits++;
        state.lives--;
        // Weak repel force
        Matter.Body.applyForce(cat, cat.position, {
          x: (cat.position.x - anchorBody.position.x) * 0.003,
          y: -0.002,
        });
        state._callbacks?.onMiss();
        if (state.lives <= 0) {
          state.gameOver = true;
          state._callbacks?.onGameOver();
        }
      }
    }
  });

  return state;
}

// ── Anchor generation ──

function generateAnchors(task: QuestionTask): Anchor[] {
  const answers = [task.correctAnswer, ...task.wrongAnswers];
  const shuffled = answers.sort(() => Math.random() - 0.5);

  // Position anchors above the start anchor
  const baseY = WORLD_HEIGHT - 40 - ANCHOR_SPACING;

  // 3 anchors: left, center, right at one level
  const positions = [
    { x: 80, y: baseY },
    { x: WORLD_WIDTH / 2, y: baseY - 20 },
    { x: WORLD_WIDTH - 80, y: baseY },
  ];

  return shuffled.map((label, i) => ({
    body: Matter.Bodies.circle(positions[i].x, positions[i].y, ANCHOR_RADIUS * 0.7, {
      isStatic: true, isSensor: true,
      label: label === task.correctAnswer ? "anchor_correct" : "anchor_wrong",
    }),
    label,
    isCorrect: label === task.correctAnswer,
    visited: false,
  }));
}

function removeOldAnchors(state: SlingCatState): void {
  const catY = state.cat.position.y;
  for (let i = state.anchors.length - 1; i >= 0; i--) {
    const a = state.anchors[i];
    if (a.visited && a.body.position.y > catY + 50) {
      Matter.Composite.remove(state.engine.world, a.body);
      state.anchors.splice(i, 1);
    }
  }
}

// ── Constraint helpers ──

function removeConstraint(state: SlingCatState): void {
  if (state.constraint) {
    Matter.Composite.remove(state.engine.world, state.constraint);
    state.constraint = null;
  }
}

function snapCatToAnchor(state: SlingCatState, anchor: Anchor): void {
  // Teleport cat to anchor + instant firm constraint
  Matter.Body.setVelocity(state.cat, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(state.cat, 0);
  Matter.Body.setPosition(state.cat, {
    x: anchor.body.position.x,
    y: anchor.body.position.y + CONSTRAINT_LENGTH,
  });

  removeConstraint(state);

  const newConstraint = Matter.Constraint.create({
    bodyA: state.cat,
    bodyB: anchor.body,
    length: CONSTRAINT_LENGTH,
    stiffness: 0.95,
    damping: 0.08,
  });
  Matter.Composite.add(state.engine.world, newConstraint);
  state.constraint = newConstraint;
  state.currentAnchor = anchor;
  state.isAiming = false;
  state.aimStart = null;
  state.aimCurrent = null;
  state._callbacks?.onAttach();
  removeOldAnchors(state);
}

function findClosestAnchor(state: SlingCatState): { anchor: Anchor; distance: number } | null {
  let closest: Anchor | null = null;
  let minDist = Infinity;
  for (const a of state.anchors) {
    if (a === state.currentAnchor || a.visited) continue;
    const dx = state.cat.position.x - a.body.position.x;
    const dy = state.cat.position.y - a.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) { minDist = dist; closest = a; }
  }
  return closest ? { anchor: closest, distance: minDist } : null;
}

// ── Aim mechanics ──

export function startAim(state: SlingCatState, x: number, y: number): void {
  if (state.gameOver || !state.currentAnchor) return;
  state.isAiming = true;
  state.aimStart = { x, y };
  state.aimCurrent = { x, y };
}

export function updateAim(state: SlingCatState, x: number, y: number): void {
  if (!state.isAiming || !state.aimStart || !state.currentAnchor) return;
  // Clamp pull distance from the current anchor
  const ax = state.currentAnchor.body.position.x;
  const ay = state.currentAnchor.body.position.y;
  const dx = x - ax, dy = y - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > MAX_PULL_RADIUS) {
    const ratio = MAX_PULL_RADIUS / dist;
    x = ax + dx * ratio;
    y = ay + dy * ratio;
  }
  state.aimCurrent = { x, y };
  // Move cat to pointer (constrained to radius from anchor)
  Matter.Body.setPosition(state.cat, { x, y });
  Matter.Body.setVelocity(state.cat, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(state.cat, 0);
}

export function launchCat(state: SlingCatState): void {
  if (!state.isAiming || !state.aimStart || !state.aimCurrent || !state.currentAnchor) return;
  state.isAiming = false;

  // 1. REMOVE constraint — cat becomes free body
  removeConstraint(state);
  const lastAnchor = state.currentAnchor;
  state.currentAnchor = null;

  // 2. Launch vector: from cat position TOWARD anchor (peg - cat)
  const anchorPos = lastAnchor.body.position;
  const catPos = state.cat.position;
  const dx = anchorPos.x - catPos.x;
  const dy = anchorPos.y - catPos.y;

  // 3. Powerful impulse via setVelocity
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 10) {
    Matter.Body.setVelocity(state.cat, {
      x: dx * VELOCITY_COEFFICIENT,
      y: dy * VELOCITY_COEFFICIENT,
    });
    Matter.Body.setAngularVelocity(state.cat, (Math.random() - 0.5) * 0.1);
  }

  state.aimStart = null;
  state.aimCurrent = null;
}

// ── New task anchors ──

export function spawnNextAnchors(state: SlingCatState, task: QuestionTask): void {
  const newAnchors = generateAnchors(task);
  for (const a of newAnchors) {
    state.anchors.push(a);
    Matter.Composite.add(state.engine.world, a.body);
  }
  state.currentTask = task;
}

// ── Update ──

export function updateSlingPhysics(state: SlingCatState, _delta: number = 16): void {
  if (state.gameOver) return;
  Matter.Engine.update(state.engine, 16);

  // Snap detection when flying — cat latches to nearest correct anchor
  if (!state.isAiming && !state.currentAnchor) {
    const snapResult = findClosestAnchor(state);
    if (snapResult && snapResult.distance < CAPTURE_THRESHOLD) {
      const anchor = snapResult.anchor;
      if (anchor.isCorrect) {
        state.correctHits++;
        state.score += 10;
        snapCatToAnchor(state, anchor);
      } else {
        state.wrongHits++;
        state.lives--;
        state._callbacks?.onMiss();
        anchor.visited = true;
        if (state.lives <= 0) {
          state.gameOver = true;
          state._callbacks?.onGameOver();
        }
      }
    }
  }

  // Game over: cat falls below screen
  if (state.cat.position.y > WORLD_HEIGHT + 100) {
    state.gameOver = true;
    state._callbacks?.onGameOver();
  }

  // Remove anchors far below
  const catY = state.cat.position.y;
  for (let i = state.anchors.length - 1; i >= 0; i--) {
    const a = state.anchors[i];
    if (a.visited && a.body.position.y > catY + WORLD_HEIGHT) {
      Matter.Composite.remove(state.engine.world, a.body);
      state.anchors.splice(i, 1);
    }
  }
}

// ── Cleanup ──

export function destroySlingWorld(state: SlingCatState): void {
  Matter.Engine.clear(state.engine);
}

export {
  WORLD_WIDTH, WORLD_HEIGHT, CAT_RADIUS, ANCHOR_RADIUS, MAX_LIVES,
  GRAVITY_Y, VELOCITY_COEFFICIENT, CONSTRAINT_LENGTH,
};
