import { describe, it, expect } from "vitest";
import {
  getAnalyticsOverview,
  getTopTopics,
  getSentimentDistribution,
  getTimeSeriesData,
  getRecentConversations,
  getMemoryInsights,
} from "./chatAnalytics";

describe("Chat Analytics", () => {
  describe("getAnalyticsOverview", () => {
    it("should return overview statistics or null", async () => {
      const result = await getAnalyticsOverview();
      // Result can be null if no database connection
      if (result) {
        expect(result).toHaveProperty("totalConversations");
        expect(result).toHaveProperty("activeUsers");
        expect(result).toHaveProperty("avgMessagesPerConversation");
        expect(result).toHaveProperty("satisfactionScore");
        expect(typeof result.totalConversations).toBe("number");
        expect(typeof result.activeUsers).toBe("number");
        expect(typeof result.avgMessagesPerConversation).toBe("number");
        expect(typeof result.satisfactionScore).toBe("number");
      }
    });

    it("should handle date range filtering", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";
      const result = await getAnalyticsOverview(startDate, endDate);
      // Result can be null if no database connection
      if (result) {
        expect(result).toHaveProperty("totalConversations");
      }
    });
  });

  describe("getTopTopics", () => {
    it("should return top topics array", async () => {
      const result = await getTopTopics(5);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("topic");
        expect(result[0]).toHaveProperty("count");
        expect(typeof result[0].topic).toBe("string");
        expect(typeof result[0].count).toBe("number");
      }
    });

    it("should respect limit parameter", async () => {
      const limit = 3;
      const result = await getTopTopics(limit);
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it("should handle date range filtering", async () => {
      const result = await getTopTopics(10, "2024-01-01", "2024-12-31");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSentimentDistribution", () => {
    it("should return sentiment distribution array", async () => {
      const result = await getSentimentDistribution();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("sentiment");
        expect(result[0]).toHaveProperty("count");
        expect(result[0]).toHaveProperty("percentage");
        expect(typeof result[0].sentiment).toBe("string");
        expect(typeof result[0].count).toBe("number");
        expect(typeof result[0].percentage).toBe("number");
      }
    });

    it("should have percentages that sum to approximately 100", async () => {
      const result = await getSentimentDistribution();
      if (result.length > 0) {
        const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);
        expect(totalPercentage).toBeGreaterThanOrEqual(99);
        expect(totalPercentage).toBeLessThanOrEqual(101);
      }
    });

    it("should handle date range filtering", async () => {
      const result = await getSentimentDistribution("2024-01-01", "2024-12-31");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getTimeSeriesData", () => {
    it("should return time series data array", async () => {
      const result = await getTimeSeriesData(7);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("date");
        expect(result[0]).toHaveProperty("conversations");
        expect(result[0]).toHaveProperty("messages");
        expect(typeof result[0].conversations).toBe("number");
        expect(typeof result[0].messages).toBe("number");
      }
    });

    it("should respect days parameter", async () => {
      const days = 7;
      const result = await getTimeSeriesData(days);
      expect(result.length).toBeLessThanOrEqual(days);
    });

    it("should return data in ascending date order", async () => {
      const result = await getTimeSeriesData(30);
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const prevDate = new Date(result[i - 1].date);
          const currDate = new Date(result[i].date);
          expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
        }
      }
    });
  });

  describe("getRecentConversations", () => {
    it("should return recent conversations array", async () => {
      const result = await getRecentConversations(5);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("userId");
        expect(result[0]).toHaveProperty("userName");
        expect(result[0]).toHaveProperty("messageCount");
        expect(result[0]).toHaveProperty("lastMessageAt");
        expect(typeof result[0].id).toBe("number");
        expect(typeof result[0].userId).toBe("number");
        expect(typeof result[0].userName).toBe("string");
        expect(typeof result[0].messageCount).toBe("number");
      }
    });

    it("should respect limit parameter", async () => {
      const limit = 3;
      const result = await getRecentConversations(limit);
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it("should return conversations in descending date order", async () => {
      const result = await getRecentConversations(10);
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const prevDate = new Date(result[i - 1].lastMessageAt);
          const currDate = new Date(result[i].lastMessageAt);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });
  });

  describe("getMemoryInsights", () => {
    it("should return memory insights or null", async () => {
      const result = await getMemoryInsights();
      // Result can be null if no database connection
      if (result) {
        expect(result).toHaveProperty("totalMemories");
        expect(result).toHaveProperty("avgMemoriesPerUser");
        expect(result).toHaveProperty("topCategories");
        expect(typeof result.totalMemories).toBe("number");
        expect(typeof result.avgMemoriesPerUser).toBe("number");
        expect(Array.isArray(result.topCategories)).toBe(true);
      }
    });

    it("should return top categories with correct structure", async () => {
      const result = await getMemoryInsights();
      if (result && result.topCategories.length > 0) {
        expect(result.topCategories[0]).toHaveProperty("category");
        expect(result.topCategories[0]).toHaveProperty("count");
        expect(typeof result.topCategories[0].category).toBe("string");
        expect(typeof result.topCategories[0].count).toBe("number");
      }
    });

    it("should limit top categories to 5", async () => {
      const result = await getMemoryInsights();
      if (result) {
        expect(result.topCategories.length).toBeLessThanOrEqual(5);
      }
    });
  });
});
