import Matter from "matter-js";

/**
 * Pure Doodle Jump physics engine — no rendering, no DOM.
 * Manages: cat body, platforms, gravity, collisions, jumping.
 */

const CAT_RADIUS = 14;
const PLATFORM_W = 60;
const PLATFORM_H = 12;
const GRAVITY_Y = 1.2;
const JUMP_FORCE = -11;
const WORLD_WIDTH = 300;
const WORLD_HEIGHT = 500;

export interface DoodlePlatform {
  body: Matter.Body;
  passed: boolean; // whether the cat has landed on this platform before
}

export interface DoodleState {
  engine: Matter.Engine;
  cat: Matter.Body;
  platforms: DoodlePlatform[];
  scoreY: number; // highest Y reached (used for scoring)
  gameOver: boolean;
}

/**
 * Create a new Doodle Jump physics world.
 */
export function createDoodleWorld(): DoodleState {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
  });

  // Cat body (circle)
  const cat = Matter.Bodies.circle(
    WORLD_WIDTH / 2,
    WORLD_HEIGHT - 60,
    CAT_RADIUS,
    {
      restitution: 0,
      friction: 0.05,
      label: "cat",
      collisionFilter: { category: 0x0001 },
    }
  );

  // Initial platforms
  const platforms: DoodlePlatform[] = [];
  // Ground platform
  platforms.push({
    body: Matter.Bodies.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT - 20,
      PLATFORM_W,
      PLATFORM_H,
      { isStatic: true, label: "platform" }
    ),
    passed: false,
  });

  // Generate platforms going up
  for (let i = 1; i < 10; i++) {
    const x = 20 + Math.random() * (WORLD_WIDTH - PLATFORM_W - 40);
    const y = WORLD_HEIGHT - 30 - i * 55;
    platforms.push({
      body: Matter.Bodies.rectangle(x, y, PLATFORM_W, PLATFORM_H, {
        isStatic: true,
        label: "platform",
      }),
      passed: false,
    });
  }

  Matter.Composite.add(engine.world, [cat, ...platforms.map((p) => p.body)]);

  return { engine, cat, platforms, scoreY: WORLD_HEIGHT, gameOver: false };
}

/**
 * Advance physics by one frame (~16ms at 60fps).
 */
export function updatePhysics(state: DoodleState, delta: number = 16.666): void {
  if (state.gameOver) return;
  Matter.Engine.update(state.engine, delta);

  // Check for falling off bottom
  if (state.cat.position.y > WORLD_HEIGHT + 100) {
    state.gameOver = true;
  }

  // Track highest point for scoring
  if (state.cat.position.y < state.scoreY) {
    state.scoreY = state.cat.position.y;
  }
}

/**
 * Move the cat horizontally.
 */
export function moveCat(state: DoodleState, direction: -1 | 0 | 1): void {
  const speed = 4;
  Matter.Body.setVelocity(state.cat, {
    x: direction * speed,
    y: state.cat.velocity.y,
  });

  // Wrap around world edges
  if (state.cat.position.x < -CAT_RADIUS) {
    Matter.Body.setPosition(state.cat, {
      x: WORLD_WIDTH + CAT_RADIUS,
      y: state.cat.position.y,
    });
  }
  if (state.cat.position.x > WORLD_WIDTH + CAT_RADIUS) {
    Matter.Body.setPosition(state.cat, {
      x: -CAT_RADIUS,
      y: state.cat.position.y,
    });
  }
}

/**
 * Trigger a jump if cat is near a platform (low vertical velocity = resting or bouncing gently).
 */
export function jump(state: DoodleState): void {
  // Cat is on/near a platform when vertical velocity is low
  if (Math.abs(state.cat.velocity.y) < 5) {
    Matter.Body.setVelocity(state.cat, {
      x: state.cat.velocity.x,
      y: JUMP_FORCE,
    });
  }
}

/**
 * Generate a new platform above the current highest one.
 * Called when cat reaches upper portion of screen.
 */
export function addPlatform(state: DoodleState): void {
  // Find highest platform
  let minY = Infinity;
  for (const p of state.platforms) {
    if (p.body.position.y < minY) minY = p.body.position.y;
  }

  const x = 20 + Math.random() * (WORLD_WIDTH - PLATFORM_W - 40);
  const y = minY - 55;

  const platform: DoodlePlatform = {
    body: Matter.Bodies.rectangle(x, y, PLATFORM_W, PLATFORM_H, {
      isStatic: true,
      label: "platform",
    }),
    passed: false,
  };

  state.platforms.push(platform);
  Matter.Composite.add(state.engine.world, platform.body);

  // Remove platforms that have scrolled far off-screen
  if (state.platforms.length > 15) {
    const removed = state.platforms.shift();
    if (removed) {
      Matter.Composite.remove(state.engine.world, removed.body);
    }
  }
}

/**
 * Get current score (higher = better).
 */
export function getScore(state: DoodleState): number {
  // Score is total distance climbed
  return Math.max(0, Math.floor((WORLD_HEIGHT - state.scoreY) / 10));
}

/**
 * Clean up physics engine.
 */
export function destroyWorld(state: DoodleState): void {
  Matter.Engine.clear(state.engine);
}

export { WORLD_WIDTH, WORLD_HEIGHT };
