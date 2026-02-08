import { describe, it, expect } from "vitest";
import {
  buildFunnelSteps,
  compareFunnels,
  generateFunnelInsights,
  getPeriodBoundaries,
  FUNNEL_STEPS,
} from "../shared/conversionFunnel";

describe("Conversion Funnel", () => {
  describe("buildFunnelSteps", () => {
    it("builds correct funnel steps from raw data", () => {
      const data = { visits: 1000, signups: 200, generations: 100, paidUsers: 20 };
      const steps = buildFunnelSteps(data);

      expect(steps).toHaveLength(4);
      expect(steps[0].id).toBe("visits");
      expect(steps[0].count).toBe(1000);
      expect(steps[0].conversionRate).toBe(100);
      expect(steps[0].dropOffRate).toBe(0);
      expect(steps[0].absoluteRate).toBe(100);

      expect(steps[1].id).toBe("signups");
      expect(steps[1].count).toBe(200);
      expect(steps[1].conversionRate).toBe(20); // 200/1000
      expect(steps[1].dropOffRate).toBe(80);
      expect(steps[1].absoluteRate).toBe(20);

      expect(steps[2].id).toBe("generations");
      expect(steps[2].count).toBe(100);
      expect(steps[2].conversionRate).toBe(50); // 100/200
      expect(steps[2].dropOffRate).toBe(50);
      expect(steps[2].absoluteRate).toBe(10);

      expect(steps[3].id).toBe("paid");
      expect(steps[3].count).toBe(20);
      expect(steps[3].conversionRate).toBe(20); // 20/100
      expect(steps[3].dropOffRate).toBe(80);
      expect(steps[3].absoluteRate).toBe(2);
    });

    it("handles zero visits gracefully", () => {
      const data = { visits: 0, signups: 0, generations: 0, paidUsers: 0 };
      const steps = buildFunnelSteps(data);

      expect(steps).toHaveLength(4);
      steps.forEach(step => {
        expect(step.count).toBe(0);
        expect(step.absoluteRate).toBe(0);
      });
    });

    it("handles data where later steps exceed earlier steps", () => {
      // This can happen when counting unique users across different tables
      const data = { visits: 50, signups: 100, generations: 30, paidUsers: 5 };
      const steps = buildFunnelSteps(data);

      expect(steps[0].count).toBe(50);
      expect(steps[1].count).toBe(100);
      expect(steps[1].conversionRate).toBe(200); // 100/50 * 100
      expect(steps[2].conversionRate).toBe(30); // 30/100
    });

    it("rounds conversion rates to 1 decimal place", () => {
      const data = { visits: 300, signups: 100, generations: 33, paidUsers: 7 };
      const steps = buildFunnelSteps(data);

      expect(steps[1].conversionRate).toBe(33.3); // 100/300 = 33.333...
      expect(steps[3].conversionRate).toBe(21.2); // 7/33 = 21.212...
    });

    it("assigns correct colors from FUNNEL_STEPS", () => {
      const data = { visits: 100, signups: 50, generations: 25, paidUsers: 10 };
      const steps = buildFunnelSteps(data);

      steps.forEach((step, i) => {
        expect(step.color).toBe(FUNNEL_STEPS[i].color);
        expect(step.label).toBe(FUNNEL_STEPS[i].label);
      });
    });
  });

  describe("compareFunnels", () => {
    it("calculates changes between current and previous periods", () => {
      const current = buildFunnelSteps({ visits: 1000, signups: 250, generations: 120, paidUsers: 30 });
      const previous = buildFunnelSteps({ visits: 800, signups: 160, generations: 80, paidUsers: 16 });

      const comparison = compareFunnels(current, previous);

      expect(comparison.current).toBe(current);
      expect(comparison.previous).toBe(previous);
      expect(comparison.changes).toHaveLength(4);

      // Visits step: both are 100% → change = 0
      expect(comparison.changes[0].stepId).toBe("visits");
      expect(comparison.changes[0].change).toBe(0);

      // Signups: 25% vs 20% → +5
      expect(comparison.changes[1].stepId).toBe("signups");
      expect(comparison.changes[1].change).toBe(5);
    });

    it("handles identical periods", () => {
      const data = { visits: 500, signups: 100, generations: 50, paidUsers: 10 };
      const funnel = buildFunnelSteps(data);

      const comparison = compareFunnels(funnel, funnel);
      comparison.changes.forEach(c => {
        expect(c.change).toBe(0);
      });
    });
  });

  describe("generateFunnelInsights", () => {
    it("warns about low signup rate", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 50, generations: 30, paidUsers: 5 });
      const insights = generateFunnelInsights(funnel, null);

      const signupInsight = insights.find(i => i.stepId === "signups" && i.type === "warning");
      expect(signupInsight).toBeDefined();
      expect(signupInsight!.title).toBe("Low Signup Rate");
    });

    it("celebrates strong signup rate", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 300, generations: 200, paidUsers: 50 });
      const insights = generateFunnelInsights(funnel, null);

      const signupInsight = insights.find(i => i.stepId === "signups" && i.type === "success");
      expect(signupInsight).toBeDefined();
      expect(signupInsight!.title).toBe("Strong Signup Rate");
    });

    it("warns about low activation rate", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 200, generations: 40, paidUsers: 10 });
      const insights = generateFunnelInsights(funnel, null);

      const genInsight = insights.find(i => i.stepId === "generations" && i.type === "warning");
      expect(genInsight).toBeDefined();
      expect(genInsight!.title).toBe("Low Activation Rate");
    });

    it("warns about low monetization", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 200, generations: 100, paidUsers: 3 });
      const insights = generateFunnelInsights(funnel, null);

      const paidInsight = insights.find(i => i.stepId === "paid" && i.type === "warning");
      expect(paidInsight).toBeDefined();
      expect(paidInsight!.title).toBe("Low Monetization");
    });

    it("identifies biggest drop-off point", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 100, generations: 80, paidUsers: 60 });
      const insights = generateFunnelInsights(funnel, null);

      const dropInsight = insights.find(i => i.title === "Biggest Drop-off");
      expect(dropInsight).toBeDefined();
      expect(dropInsight!.stepId).toBe("signups"); // 90% drop-off
    });

    it("includes overall conversion insight", () => {
      const funnel = buildFunnelSteps({ visits: 1000, signups: 200, generations: 100, paidUsers: 20 });
      const insights = generateFunnelInsights(funnel, null);

      const overallInsight = insights.find(i => i.title === "Overall Conversion");
      expect(overallInsight).toBeDefined();
      expect(overallInsight!.message).toContain("2%");
    });

    it("detects improving steps in comparison", () => {
      const current = buildFunnelSteps({ visits: 1000, signups: 300, generations: 150, paidUsers: 30 });
      const previous = buildFunnelSteps({ visits: 1000, signups: 200, generations: 100, paidUsers: 20 });
      const comparison = compareFunnels(current, previous);

      const insights = generateFunnelInsights(current, comparison);
      const improvingInsight = insights.find(i => i.title === "Improving Step");
      expect(improvingInsight).toBeDefined();
      expect(improvingInsight!.type).toBe("success");
    });

    it("detects declining steps in comparison", () => {
      const current = buildFunnelSteps({ visits: 1000, signups: 150, generations: 80, paidUsers: 15 });
      const previous = buildFunnelSteps({ visits: 1000, signups: 250, generations: 120, paidUsers: 30 });
      const comparison = compareFunnels(current, previous);

      const insights = generateFunnelInsights(current, comparison);
      const decliningInsight = insights.find(i => i.title === "Declining Step");
      expect(decliningInsight).toBeDefined();
      expect(decliningInsight!.type).toBe("warning");
    });

    it("returns empty insights for zero data", () => {
      const funnel = buildFunnelSteps({ visits: 0, signups: 0, generations: 0, paidUsers: 0 });
      const insights = generateFunnelInsights(funnel, null);

      // Should not crash, may have some insights or none
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe("getPeriodBoundaries", () => {
    it("returns current and previous period boundaries", () => {
      const { current, previous } = getPeriodBoundaries(30);

      expect(current.start).toBeInstanceOf(Date);
      expect(current.end).toBeInstanceOf(Date);
      expect(previous.start).toBeInstanceOf(Date);
      expect(previous.end).toBeInstanceOf(Date);

      // Current period should be 30 days
      const currentDays = (current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(currentDays)).toBe(30);

      // Previous period should end before current starts
      expect(previous.end.getTime()).toBeLessThan(current.start.getTime());
    });

    it("handles 7-day period", () => {
      const { current, previous } = getPeriodBoundaries(7);

      const currentDays = (current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(currentDays)).toBe(7);
    });

    it("previous period has same duration as current", () => {
      const { current, previous } = getPeriodBoundaries(90);

      const currentDuration = current.end.getTime() - current.start.getTime();
      const previousDuration = previous.end.getTime() - previous.start.getTime();

      // Should be approximately equal (within a few hours due to boundary rounding)
      const dayMs = 1000 * 60 * 60 * 24;
      expect(Math.abs(currentDuration - previousDuration)).toBeLessThan(dayMs);
    });
  });

  describe("FUNNEL_STEPS", () => {
    it("has 4 steps", () => {
      expect(FUNNEL_STEPS).toHaveLength(4);
    });

    it("has correct step IDs in order", () => {
      expect(FUNNEL_STEPS[0].id).toBe("visits");
      expect(FUNNEL_STEPS[1].id).toBe("signups");
      expect(FUNNEL_STEPS[2].id).toBe("generations");
      expect(FUNNEL_STEPS[3].id).toBe("paid");
    });

    it("each step has required fields", () => {
      FUNNEL_STEPS.forEach(step => {
        expect(step.id).toBeTruthy();
        expect(step.label).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.color).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });
});
