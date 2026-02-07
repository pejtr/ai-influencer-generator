import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process before importing
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));
vi.mock("util", () => ({
  promisify: vi.fn((fn: any) => fn),
}));
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => Buffer.from("mock-audio")),
    readdirSync: vi.fn(() => ["test.mp3"]),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => Buffer.from("mock-audio")),
  readdirSync: vi.fn(() => ["test.mp3"]),
  unlinkSync: vi.fn(),
}));
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/audio.mp3", key: "test" }),
}));
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id-123"),
}));

import {
  VOICE_PRESETS,
  SUPPORTED_LANGUAGES,
  getEarnTier,
  getNextTierViews,
  calculateEarnings,
  EARN_TIERS,
  MONETIZATION_STRATEGIES,
  CONTENT_STRATEGY_TIPS,
  PINTEREST_STRATEGY,
} from "./earnProgram";

import {
  VOICE_PRESETS as VOICE_PRESETS_TA,
  SUPPORTED_LANGUAGES as SUPPORTED_LANGUAGES_TA,
} from "./talkingAvatar";

describe("Talking Avatar - Voice Presets", () => {
  it("should have at least 5 voice presets", () => {
    expect(VOICE_PRESETS_TA.length).toBeGreaterThanOrEqual(5);
  });

  it("each voice preset should have required fields", () => {
    for (const preset of VOICE_PRESETS_TA) {
      expect(preset).toHaveProperty("id");
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("gender");
      expect(preset).toHaveProperty("style");
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
    }
  });

  it("should have both male and female voices", () => {
    const females = VOICE_PRESETS_TA.filter(v => v.gender === "female");
    const males = VOICE_PRESETS_TA.filter(v => v.gender === "male");
    expect(females.length).toBeGreaterThan(0);
    expect(males.length).toBeGreaterThan(0);
  });

  it("should have unique voice IDs", () => {
    const ids = VOICE_PRESETS_TA.map(v => v.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("Talking Avatar - Supported Languages", () => {
  it("should support at least 10 languages", () => {
    expect(SUPPORTED_LANGUAGES_TA.length).toBeGreaterThanOrEqual(10);
  });

  it("should include English", () => {
    const english = SUPPORTED_LANGUAGES_TA.find(l => l.code === "English");
    expect(english).toBeDefined();
  });

  it("should include Czech", () => {
    const czech = SUPPORTED_LANGUAGES_TA.find(l => l.code === "Czech");
    expect(czech).toBeDefined();
  });

  it("each language should have code and label", () => {
    for (const lang of SUPPORTED_LANGUAGES_TA) {
      expect(lang).toHaveProperty("code");
      expect(lang).toHaveProperty("label");
      expect(lang.code).toBeTruthy();
      expect(lang.label).toBeTruthy();
    }
  });
});

describe("Earn Program - Tiers", () => {
  it("should have 5 earn tiers", () => {
    expect(Object.keys(EARN_TIERS)).toHaveLength(5);
  });

  it("each tier should have required properties", () => {
    for (const [key, tier] of Object.entries(EARN_TIERS)) {
      expect(tier).toHaveProperty("name");
      expect(tier).toHaveProperty("minViews");
      expect(tier).toHaveProperty("ratePerView");
      expect(tier).toHaveProperty("color");
      expect(tier).toHaveProperty("icon");
      expect(tier).toHaveProperty("benefits");
      expect(tier.ratePerView).toBeGreaterThan(0);
      expect(tier.benefits.length).toBeGreaterThan(0);
    }
  });

  it("tiers should have increasing view requirements", () => {
    const tiers = Object.values(EARN_TIERS);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].minViews).toBeGreaterThan(tiers[i - 1].minViews);
    }
  });

  it("tiers should have increasing rates per view", () => {
    const tiers = Object.values(EARN_TIERS);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].ratePerView).toBeGreaterThan(tiers[i - 1].ratePerView);
    }
  });
});

describe("Earn Program - getEarnTier", () => {
  it("should return starter for 0 views", () => {
    expect(getEarnTier(0)).toBe("starter");
  });

  it("should return starter for 9999 views", () => {
    expect(getEarnTier(9999)).toBe("starter");
  });

  it("should return rising for 10000 views", () => {
    expect(getEarnTier(10000)).toBe("rising");
  });

  it("should return established for 100000 views", () => {
    expect(getEarnTier(100000)).toBe("established");
  });

  it("should return elite for 1000000 views", () => {
    expect(getEarnTier(1000000)).toBe("elite");
  });

  it("should return legend for 10000000 views", () => {
    expect(getEarnTier(10000000)).toBe("legend");
  });

  it("should return legend for very high views", () => {
    expect(getEarnTier(999999999)).toBe("legend");
  });
});

describe("Earn Program - getNextTierViews", () => {
  it("should return 10000 for starter", () => {
    expect(getNextTierViews("starter")).toBe(10000);
  });

  it("should return 100000 for rising", () => {
    expect(getNextTierViews("rising")).toBe(100000);
  });

  it("should return 1000000 for established", () => {
    expect(getNextTierViews("established")).toBe(1000000);
  });

  it("should return 10000000 for elite", () => {
    expect(getNextTierViews("elite")).toBe(10000000);
  });

  it("should return Infinity for legend", () => {
    expect(getNextTierViews("legend")).toBe(Infinity);
  });
});

describe("Earn Program - calculateEarnings", () => {
  it("should calculate starter earnings correctly", () => {
    expect(calculateEarnings(10000, "starter")).toBeCloseTo(10);
  });

  it("should calculate rising earnings correctly", () => {
    expect(calculateEarnings(100000, "rising")).toBeCloseTo(200);
  });

  it("should calculate established earnings correctly", () => {
    expect(calculateEarnings(1000000, "established")).toBeCloseTo(3000);
  });

  it("should calculate elite earnings correctly", () => {
    expect(calculateEarnings(10000000, "elite")).toBeCloseTo(50000);
  });

  it("should return 0 for 0 views", () => {
    expect(calculateEarnings(0, "starter")).toBe(0);
  });
});

describe("Earn Program - Monetization Strategies", () => {
  it("should have at least 5 strategies", () => {
    expect(MONETIZATION_STRATEGIES.length).toBeGreaterThanOrEqual(5);
  });

  it("each strategy should have required fields", () => {
    for (const strategy of MONETIZATION_STRATEGIES) {
      expect(strategy).toHaveProperty("id");
      expect(strategy).toHaveProperty("title");
      expect(strategy).toHaveProperty("description");
      expect(strategy).toHaveProperty("icon");
      expect(strategy).toHaveProperty("difficulty");
      expect(strategy).toHaveProperty("potentialRevenue");
      expect(strategy).toHaveProperty("steps");
      expect(strategy.steps.length).toBeGreaterThan(0);
    }
  });

  it("should include earn program strategy", () => {
    const earnStrategy = MONETIZATION_STRATEGIES.find(s => s.id === "earn-program");
    expect(earnStrategy).toBeDefined();
  });

  it("should include affiliate marketing strategy", () => {
    const affiliateStrategy = MONETIZATION_STRATEGIES.find(s => s.id === "affiliate-marketing");
    expect(affiliateStrategy).toBeDefined();
  });
});

describe("Earn Program - Content Strategy Tips", () => {
  it("should have at least 4 tip categories", () => {
    expect(CONTENT_STRATEGY_TIPS.length).toBeGreaterThanOrEqual(4);
  });

  it("each category should have tips", () => {
    for (const section of CONTENT_STRATEGY_TIPS) {
      expect(section).toHaveProperty("category");
      expect(section).toHaveProperty("tips");
      expect(section.tips.length).toBeGreaterThan(0);
    }
  });

  it("should include consistency tips", () => {
    const consistency = CONTENT_STRATEGY_TIPS.find(s => s.category === "Consistency");
    expect(consistency).toBeDefined();
  });
});

describe("Earn Program - Pinterest Strategy", () => {
  it("should have a title and description", () => {
    expect(PINTEREST_STRATEGY.title).toBeTruthy();
    expect(PINTEREST_STRATEGY.description).toBeTruthy();
  });

  it("should have at least 5 steps", () => {
    expect(PINTEREST_STRATEGY.steps.length).toBeGreaterThanOrEqual(5);
  });

  it("each step should have step number, title, and description", () => {
    for (const step of PINTEREST_STRATEGY.steps) {
      expect(step).toHaveProperty("step");
      expect(step).toHaveProperty("title");
      expect(step).toHaveProperty("description");
      expect(step.step).toBeGreaterThan(0);
    }
  });

  it("steps should be in order", () => {
    for (let i = 0; i < PINTEREST_STRATEGY.steps.length; i++) {
      expect(PINTEREST_STRATEGY.steps[i].step).toBe(i + 1);
    }
  });
});
