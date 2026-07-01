import { describe, it, expect } from "vitest";
import Matter from "matter-js";
import {
  createDoodleWorld,
  updatePhysics,
  moveCat,
  jump,
  addPlatform,
  getScore,
  destroyWorld,
} from "../DoodlePhysics";

describe("createDoodleWorld", () => {
  it("creates a world with cat and platforms", () => {
    const state = createDoodleWorld();
    expect(state.cat).toBeDefined();
    expect(state.platforms.length).toBeGreaterThanOrEqual(1);
    expect(state.gameOver).toBe(false);
    expect(state.scoreY).toBe(500);
    destroyWorld(state);
  });

  it("cat starts near bottom of world", () => {
    const state = createDoodleWorld();
    expect(state.cat.position.y).toBeGreaterThan(400);
    destroyWorld(state);
  });

  it("has ground platform at bottom", () => {
    const state = createDoodleWorld();
    const ground = state.platforms[0];
    expect(ground.body.position.y).toBeGreaterThan(400);
    destroyWorld(state);
  });
});

describe("updatePhysics", () => {
  it("applies gravity (cat falls without jump)", () => {
    const state = createDoodleWorld();
    const initialY = state.cat.position.y;
    updatePhysics(state, 16);
    // Cat should have moved (gravity applied)
    expect(state.cat.position.y).not.toBe(initialY);
    destroyWorld(state);
  });

  it("does not update when game over", () => {
    const state = createDoodleWorld();
    state.gameOver = true;
    const initialY = state.cat.position.y;
    updatePhysics(state, 16);
    expect(state.cat.position.y).toBe(initialY);
    destroyWorld(state);
  });

  it("game over when cat falls below world", () => {
    const state = createDoodleWorld();
    // Manually set cat below the game-over threshold
    Matter.Body.setPosition(state.cat, { x: 150, y: 650 });
    updatePhysics(state, 16);
    expect(state.gameOver).toBe(true);
    destroyWorld(state);
  });
});

describe("moveCat", () => {
  it("moves cat left", () => {
    const state = createDoodleWorld();
    const initialX = state.cat.position.x;
    moveCat(state, -1);
    expect(state.cat.velocity.x).toBeLessThan(0);
    destroyWorld(state);
  });

  it("moves cat right", () => {
    const state = createDoodleWorld();
    moveCat(state, 1);
    expect(state.cat.velocity.x).toBeGreaterThan(0);
    destroyWorld(state);
  });
});

describe("jump", () => {
  it("applies upward velocity when cat is resting", () => {
    const state = createDoodleWorld();
    // Let cat settle on ground (enough updates for velocity to stabilize)
    for (let i = 0; i < 50; i++) updatePhysics(state, 16);
    jump(state);
    expect(state.cat.velocity.y).toBeLessThan(0); // going up
    destroyWorld(state);
  });
});

describe("addPlatform", () => {
  it("adds a new platform above existing ones", () => {
    const state = createDoodleWorld();
    const initialCount = state.platforms.length;
    addPlatform(state);
    expect(state.platforms.length).toBe(initialCount + 1);
    destroyWorld(state);
  });

  it("removes old platforms when exceeding limit", () => {
    const state = createDoodleWorld();
    for (let i = 0; i < 10; i++) {
      addPlatform(state);
    }
    expect(state.platforms.length).toBeLessThanOrEqual(15);
    destroyWorld(state);
  });
});

describe("getScore", () => {
  it("returns 0 at start", () => {
    const state = createDoodleWorld();
    expect(getScore(state)).toBe(0);
    destroyWorld(state);
  });

  it("increases when cat climbs higher", () => {
    const state = createDoodleWorld();
    state.scoreY = 300; // climbed 200 units
    expect(getScore(state)).toBeGreaterThan(0);
    destroyWorld(state);
  });
});
