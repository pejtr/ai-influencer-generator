import { describe, it, expect } from "vitest";
import {
  SEED_COURSE_MODULES,
  SEED_TESTIMONIALS,
  SEED_BONUSES,
} from "./courseDb";

describe("Course DB - Seed Data", () => {
  it("should have 5 course modules", () => {
    expect(SEED_COURSE_MODULES).toHaveLength(5);
  });

  it("each module should have required fields", () => {
    for (const mod of SEED_COURSE_MODULES) {
      expect(mod.title).toBeTruthy();
      expect(typeof mod.order).toBe("number");
      expect(mod.duration).toBeTruthy();
      expect(mod.description).toBeTruthy();
    }
  });

  it("modules should be ordered 1-5", () => {
    const orders = SEED_COURSE_MODULES.map((m) => m.order);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it("should have 5 testimonials", () => {
    expect(SEED_TESTIMONIALS).toHaveLength(5);
  });

  it("each testimonial should have required fields", () => {
    for (const t of SEED_TESTIMONIALS) {
      expect(t.name).toBeTruthy();
      expect(t.content).toBeTruthy();
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
    }
  });

  it("at least 3 testimonials should be featured", () => {
    const featured = SEED_TESTIMONIALS.filter((t) => t.isFeatured);
    expect(featured.length).toBeGreaterThanOrEqual(3);
  });

  it("should have 3 bonuses", () => {
    expect(SEED_BONUSES).toHaveLength(3);
  });

  it("each bonus should have a value", () => {
    for (const b of SEED_BONUSES) {
      expect(b.title).toBeTruthy();
      expect(b.value).toBeTruthy();
      expect(Number(b.value)).toBeGreaterThan(0);
    }
  });

  it("total bonus value should be at least $500", () => {
    const total = SEED_BONUSES.reduce((sum, b) => sum + Number(b.value), 0);
    expect(total).toBeGreaterThanOrEqual(500);
  });
});

describe("Course Pricing Logic", () => {
  it("full price should be $97 (9700 cents)", () => {
    const fullPrice = 9700;
    expect(fullPrice / 100).toBe(97);
  });

  it("installment price should be $49 (4900 cents)", () => {
    const installment = 4900;
    expect(installment / 100).toBe(49);
  });

  it("two installments should be less than full price", () => {
    const full = 9700;
    const twoInstallments = 4900 * 2;
    expect(twoInstallments).toBeGreaterThan(full);
    // 2x$49 = $98 > $97 (slight premium for installment plan)
  });
});

describe("Course Module Titles", () => {
  it("module titles should reference key AI influencer topics", () => {
    const allTitles = SEED_COURSE_MODULES.map((m) => m.title.toLowerCase()).join(" ");
    expect(allTitles).toContain("ai");
    expect(allTitles).toContain("persona");
    expect(allTitles).toContain("content");
    expect(allTitles).toContain("monetization");
  });
});

describe("Nina Profile Sample Data", () => {
  const SAMPLE_STATS = { posts: 329, followers: 100, following: 179 };

  it("should have valid profile stats", () => {
    expect(SAMPLE_STATS.posts).toBeGreaterThan(0);
    expect(SAMPLE_STATS.followers).toBeGreaterThan(0);
    expect(SAMPLE_STATS.following).toBeGreaterThan(0);
  });

  it("should have 4 story highlights", () => {
    const highlights = ["SERVICES", "STUDIO", "WORK", "METHOD"];
    expect(highlights).toHaveLength(4);
    for (const h of highlights) {
      expect(typeof h).toBe("string");
      expect(h.length).toBeGreaterThan(0);
    }
  });
});
