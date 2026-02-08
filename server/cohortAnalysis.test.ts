import { describe, it, expect } from "vitest";
import {
  buildCohortRows,
  calculateCohortSummary,
  getRetentionColor,
  getRetentionTextColor,
  formatPeriodLabel,
  getISOWeek,
  getCohortLabel,
  getPeriodOffset,
} from "../shared/cohortAnalysis";

describe("Cohort Analysis", () => {
  describe("getISOWeek", () => {
    it("returns correct ISO week number", () => {
      // Jan 1, 2026 is a Thursday → Week 1
      expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
      // Jan 5, 2026 is a Monday → Week 2
      expect(getISOWeek(new Date(2026, 0, 5))).toBe(2);
    });

    it("handles year boundaries", () => {
      // Dec 31, 2025 is a Wednesday → Week 1 of 2026 (ISO)
      const week = getISOWeek(new Date(2025, 11, 31));
      expect(week).toBeGreaterThan(0);
    });
  });

  describe("getCohortLabel", () => {
    it("returns weekly label format", () => {
      const label = getCohortLabel(new Date(2026, 0, 5), "weekly");
      expect(label).toMatch(/^2026-W\d{2}$/);
    });

    it("returns monthly label format", () => {
      const label = getCohortLabel(new Date(2026, 0, 15), "monthly");
      expect(label).toBe("2026-01");
    });

    it("pads month with zero", () => {
      expect(getCohortLabel(new Date(2026, 2, 1), "monthly")).toBe("2026-03");
    });

    it("handles December correctly", () => {
      expect(getCohortLabel(new Date(2026, 11, 25), "monthly")).toBe("2026-12");
    });
  });

  describe("getPeriodOffset", () => {
    it("returns 0 for same week", () => {
      const reg = new Date(2026, 0, 5); // Monday
      const act = new Date(2026, 0, 7); // Wednesday same week
      expect(getPeriodOffset(reg, act, "weekly")).toBe(0);
    });

    it("returns 1 for next week", () => {
      const reg = new Date(2026, 0, 5); // Monday
      const act = new Date(2026, 0, 12); // Next Monday
      expect(getPeriodOffset(reg, act, "weekly")).toBe(1);
    });

    it("returns 0 for same month", () => {
      const reg = new Date(2026, 0, 1);
      const act = new Date(2026, 0, 28);
      expect(getPeriodOffset(reg, act, "monthly")).toBe(0);
    });

    it("returns 1 for next month", () => {
      const reg = new Date(2026, 0, 15);
      const act = new Date(2026, 1, 10);
      expect(getPeriodOffset(reg, act, "monthly")).toBe(1);
    });

    it("returns correct offset for multiple months", () => {
      const reg = new Date(2026, 0, 1);
      const act = new Date(2026, 5, 1);
      expect(getPeriodOffset(reg, act, "monthly")).toBe(5);
    });
  });

  describe("getRetentionColor", () => {
    it("returns green for high retention", () => {
      expect(getRetentionColor(85)).toBe("#22c55e");
    });

    it("returns red for low retention", () => {
      expect(getRetentionColor(8)).toBe("#ef4444");
    });

    it("returns gray for zero", () => {
      expect(getRetentionColor(0)).toBe("#1f2937");
    });

    it("returns amber for medium retention", () => {
      expect(getRetentionColor(30)).toBe("#fbbf24");
    });
  });

  describe("getRetentionTextColor", () => {
    it("returns black for high retention (readable on green)", () => {
      expect(getRetentionTextColor(60)).toBe("#000000");
    });

    it("returns white for low retention (readable on dark)", () => {
      expect(getRetentionTextColor(10)).toBe("#ffffff");
    });
  });

  describe("formatPeriodLabel", () => {
    it("formats weekly labels", () => {
      expect(formatPeriodLabel(0, "weekly")).toBe("W0");
      expect(formatPeriodLabel(3, "weekly")).toBe("W3");
    });

    it("formats monthly labels", () => {
      expect(formatPeriodLabel(0, "monthly")).toBe("M0");
      expect(formatPeriodLabel(6, "monthly")).toBe("M6");
    });
  });

  describe("buildCohortRows", () => {
    it("groups users into cohorts by registration date", () => {
      const users = [
        { id: 1, createdAt: new Date(2026, 0, 5) }, // Week 2
        { id: 2, createdAt: new Date(2026, 0, 6) }, // Week 2
        { id: 3, createdAt: new Date(2026, 0, 12) }, // Week 3
      ];
      const activities: { userId: number; date: Date; revenue: number; generations: number }[] = [];

      const rows = buildCohortRows(users, activities, "weekly", 4);
      expect(rows.length).toBe(2); // 2 weekly cohorts
      expect(rows[0].totalUsers + rows[1].totalUsers).toBe(3);
    });

    it("calculates retention rates correctly", () => {
      const users = [
        { id: 1, createdAt: new Date(2026, 0, 1) },
        { id: 2, createdAt: new Date(2026, 0, 1) },
      ];
      const activities = [
        { userId: 1, date: new Date(2026, 0, 1), revenue: 0, generations: 1 }, // Period 0
        { userId: 2, date: new Date(2026, 0, 1), revenue: 0, generations: 1 }, // Period 0
        { userId: 1, date: new Date(2026, 1, 1), revenue: 0, generations: 1 }, // Period 1
        // User 2 doesn't return in period 1
      ];

      const rows = buildCohortRows(users, activities, "monthly", 2);
      expect(rows.length).toBe(1);

      const cohort = rows[0];
      const period0 = cohort.cells.find(c => c.periodOffset === 0);
      const period1 = cohort.cells.find(c => c.periodOffset === 1);

      expect(period0?.retentionRate).toBe(100); // Both users active
      expect(period1?.retentionRate).toBe(50);  // Only user 1 active
    });

    it("tracks revenue per cohort period", () => {
      const users = [
        { id: 1, createdAt: new Date(2026, 0, 1) },
      ];
      const activities = [
        { userId: 1, date: new Date(2026, 0, 15), revenue: 19.99, generations: 5 },
        { userId: 1, date: new Date(2026, 1, 10), revenue: 49.99, generations: 10 },
      ];

      const rows = buildCohortRows(users, activities, "monthly", 3);
      const cohort = rows[0];

      const period0 = cohort.cells.find(c => c.periodOffset === 0);
      const period1 = cohort.cells.find(c => c.periodOffset === 1);

      expect(period0?.revenue).toBe(19.99);
      expect(period0?.generations).toBe(5);
      expect(period1?.revenue).toBe(49.99);
      expect(period1?.generations).toBe(10);
    });

    it("handles empty users array", () => {
      const rows = buildCohortRows([], [], "weekly", 4);
      expect(rows).toEqual([]);
    });

    it("handles users with no activity", () => {
      const users = [
        { id: 1, createdAt: new Date(2026, 0, 1) },
        { id: 2, createdAt: new Date(2026, 0, 1) },
      ];

      const rows = buildCohortRows(users, [], "monthly", 3);
      expect(rows.length).toBe(1);
      expect(rows[0].totalUsers).toBe(2);
      // All cells should have 0 retention
      rows[0].cells.forEach(cell => {
        expect(cell.activeUsers).toBe(0);
        expect(cell.retentionRate).toBe(0);
      });
    });

    it("sorts cohorts chronologically", () => {
      const users = [
        { id: 1, createdAt: new Date(2026, 2, 1) }, // March
        { id: 2, createdAt: new Date(2026, 0, 1) }, // January
        { id: 3, createdAt: new Date(2026, 1, 1) }, // February
      ];

      const rows = buildCohortRows(users, [], "monthly", 3);
      expect(rows[0].label).toBe("2026-01");
      expect(rows[1].label).toBe("2026-02");
      expect(rows[2].label).toBe("2026-03");
    });
  });

  describe("calculateCohortSummary", () => {
    it("returns empty summary for no cohorts", () => {
      const summary = calculateCohortSummary([]);
      expect(summary.totalCohorts).toBe(0);
      expect(summary.totalUsers).toBe(0);
      expect(summary.bestCohort).toBeNull();
      expect(summary.worstCohort).toBeNull();
    });

    it("calculates total users across cohorts", () => {
      const cohorts = [
        {
          label: "2026-01", startDate: "2026-01-01", endDate: "2026-01-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 50 },
            { periodOffset: 1, activeUsers: 25, retentionRate: 50, revenue: 100, generations: 25 },
          ],
        },
        {
          label: "2026-02", startDate: "2026-02-01", endDate: "2026-02-28",
          totalUsers: 30,
          cells: [
            { periodOffset: 0, activeUsers: 30, retentionRate: 100, revenue: 0, generations: 30 },
            { periodOffset: 1, activeUsers: 20, retentionRate: 66.7, revenue: 200, generations: 20 },
          ],
        },
      ];

      const summary = calculateCohortSummary(cohorts);
      expect(summary.totalCohorts).toBe(2);
      expect(summary.totalUsers).toBe(80);
    });

    it("identifies best and worst cohorts", () => {
      const cohorts = [
        {
          label: "2026-01", startDate: "2026-01-01", endDate: "2026-01-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 10, retentionRate: 20, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-02", startDate: "2026-02-01", endDate: "2026-02-28",
          totalUsers: 30,
          cells: [
            { periodOffset: 0, activeUsers: 30, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 24, retentionRate: 80, revenue: 0, generations: 0 },
          ],
        },
      ];

      const summary = calculateCohortSummary(cohorts);
      // Best cohort should have higher avg retention (excluding period 0)
      expect(summary.bestCohort?.label).toBe("2026-02");
      expect(summary.worstCohort?.label).toBe("2026-01");
    });

    it("calculates average revenue per user", () => {
      const cohorts = [
        {
          label: "2026-01", startDate: "2026-01-01", endDate: "2026-01-31",
          totalUsers: 10,
          cells: [
            { periodOffset: 0, activeUsers: 10, retentionRate: 100, revenue: 100, generations: 0 },
            { periodOffset: 1, activeUsers: 5, retentionRate: 50, revenue: 50, generations: 0 },
          ],
        },
      ];

      const summary = calculateCohortSummary(cohorts);
      expect(summary.avgRevenuePerUser).toBe(15); // (100 + 50) / 10
    });

    it("detects improving retention trend", () => {
      const cohorts = [
        {
          label: "2026-01", startDate: "2026-01-01", endDate: "2026-01-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 5, retentionRate: 10, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-02", startDate: "2026-02-01", endDate: "2026-02-28",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 8, retentionRate: 16, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-03", startDate: "2026-03-01", endDate: "2026-03-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 20, retentionRate: 40, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-04", startDate: "2026-04-01", endDate: "2026-04-30",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 25, retentionRate: 50, revenue: 0, generations: 0 },
          ],
        },
      ];

      const summary = calculateCohortSummary(cohorts);
      expect(summary.retentionTrend).toBe("improving");
    });

    it("detects stable retention trend when difference is small", () => {
      const cohorts = [
        {
          label: "2026-01", startDate: "2026-01-01", endDate: "2026-01-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 15, retentionRate: 30, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-02", startDate: "2026-02-01", endDate: "2026-02-28",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 16, retentionRate: 32, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-03", startDate: "2026-03-01", endDate: "2026-03-31",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 14, retentionRate: 28, revenue: 0, generations: 0 },
          ],
        },
        {
          label: "2026-04", startDate: "2026-04-01", endDate: "2026-04-30",
          totalUsers: 50,
          cells: [
            { periodOffset: 0, activeUsers: 50, retentionRate: 100, revenue: 0, generations: 0 },
            { periodOffset: 1, activeUsers: 15, retentionRate: 30, revenue: 0, generations: 0 },
          ],
        },
      ];

      const summary = calculateCohortSummary(cohorts);
      expect(summary.retentionTrend).toBe("stable");
    });
  });
});
