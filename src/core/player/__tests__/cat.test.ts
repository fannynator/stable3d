import { describe, it, expect } from "vitest";
import { deriveCatMood, decayCat, feedCat, restCat } from "../cat";
import type { CatState } from "../../../app/types";

const baseCat = (overrides: Partial<CatState> = {}): CatState => ({
  mood: "happy",
  hunger: 100,
  energy: 100,
  lastUpdate: 0,
  hat: null,
  ownedHats: [],
  toys: [],
  ...overrides,
});

describe("deriveCatMood", () => {
  it("returns playful when stats are full (100/100)", () => {
    expect(deriveCatMood(baseCat())).toBe("playful");
  });

  it("returns happy when stats are moderate", () => {
    expect(deriveCatMood(baseCat({ hunger: 50, energy: 50 }))).toBe("happy");
  });

  it("returns sleepy when energy is low", () => {
    expect(deriveCatMood(baseCat({ energy: 10 }))).toBe("sleepy");
  });

  it("returns hungry when hunger is low", () => {
    expect(deriveCatMood(baseCat({ hunger: 10 }))).toBe("hungry");
  });

  it("returns playful when both stats are high", () => {
    expect(deriveCatMood(baseCat({ hunger: 80, energy: 80 }))).toBe("playful");
  });

  it("returns sleepy over hungry when both are low (energy < 20 is first check)", () => {
    expect(deriveCatMood(baseCat({ hunger: 10, energy: 10 }))).toBe("sleepy");
  });
});

describe("decayCat", () => {
  it("decays hunger and energy over time", () => {
    const result = decayCat(baseCat({ lastUpdate: 0 }), 60000); // 1 minute later
    expect(result.hunger).toBeCloseTo(99.5, 1);
    expect(result.energy).toBeCloseTo(99.7, 1);
    expect(result.lastUpdate).toBe(60000);
  });

  it("does not go below 0", () => {
    const result = decayCat(baseCat({ hunger: 1, energy: 1, lastUpdate: 0 }), 600000); // 10 minutes
    expect(result.hunger).toBe(0);
    expect(result.energy).toBe(0);
  });

  it("does not decay if no time passed", () => {
    const result = decayCat(baseCat({ lastUpdate: 60000 }), 60000);
    expect(result.hunger).toBe(100);
    expect(result.energy).toBe(100);
  });
});

describe("feedCat", () => {
  it("increases hunger", () => {
    const result = feedCat(baseCat({ hunger: 50 }), 30);
    expect(result.hunger).toBe(80);
  });

  it("caps at 100", () => {
    const result = feedCat(baseCat({ hunger: 90 }), 30);
    expect(result.hunger).toBe(100);
  });
});

describe("restCat", () => {
  it("increases energy", () => {
    const result = restCat(baseCat({ energy: 50 }), 30);
    expect(result.energy).toBe(80);
  });

  it("caps at 100", () => {
    const result = restCat(baseCat({ energy: 90 }), 30);
    expect(result.energy).toBe(100);
  });
});
