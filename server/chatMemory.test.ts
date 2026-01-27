import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildMemoryContext,
  type UserMemory,
  type ConversationSummary,
} from "./chatMemory";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "[]" } }],
  }),
}));

describe("Chat Memory System", () => {
  describe("buildMemoryContext", () => {
    it("should return empty string when no memories or summaries", () => {
      const result = buildMemoryContext([], []);
      expect(result).toBe("");
    });

    it("should build context with memories only", () => {
      const memories: UserMemory[] = [
        {
          id: 1,
          fanUserId: 1,
          personalityId: 1,
          memoryType: "fact",
          category: "work",
          content: "Works as a software engineer",
          confidence: 0.95,
          timesUsed: 3,
          isActive: true,
          isVerified: false,
        },
        {
          id: 2,
          fanUserId: 1,
          personalityId: 1,
          memoryType: "preference",
          category: "food",
          content: "Loves Italian food",
          confidence: 0.85,
          timesUsed: 1,
          isActive: true,
          isVerified: false,
        },
      ];

      const result = buildMemoryContext(memories, []);
      
      expect(result).toContain("MEMORY CONTEXT");
      expect(result).toContain("Things you remember about this fan");
      expect(result).toContain("Works as a software engineer");
      expect(result).toContain("Loves Italian food");
      expect(result).toContain("(fact)");
      expect(result).toContain("(preference)");
    });

    it("should build context with summaries only", () => {
      const summaries: ConversationSummary[] = [
        {
          id: 1,
          conversationId: 1,
          summary: "Discussed photography and travel plans",
          keyTopics: ["photography", "travel", "vacation"],
          emotionalTone: "excited",
          messageCount: 25,
        },
      ];

      const result = buildMemoryContext([], summaries);
      
      expect(result).toContain("MEMORY CONTEXT");
      expect(result).toContain("Previous conversation summary");
      expect(result).toContain("Discussed photography and travel plans");
      expect(result).toContain("Topics discussed: photography, travel, vacation");
    });

    it("should build context with both memories and summaries", () => {
      const memories: UserMemory[] = [
        {
          id: 1,
          fanUserId: 1,
          personalityId: 1,
          memoryType: "interest",
          category: "hobby",
          content: "Interested in photography",
          confidence: 0.9,
          timesUsed: 5,
          isActive: true,
          isVerified: true,
        },
      ];

      const summaries: ConversationSummary[] = [
        {
          id: 1,
          conversationId: 1,
          summary: "Had a great conversation about cameras",
          keyTopics: ["cameras", "lenses"],
          emotionalTone: "friendly",
          messageCount: 15,
        },
      ];

      const result = buildMemoryContext(memories, summaries);
      
      expect(result).toContain("Things you remember about this fan");
      expect(result).toContain("Interested in photography");
      expect(result).toContain("Previous conversation summary");
      expect(result).toContain("Had a great conversation about cameras");
      expect(result).toContain("Use this context naturally");
    });

    it("should include instruction to not be creepy", () => {
      const memories: UserMemory[] = [
        {
          id: 1,
          fanUserId: 1,
          personalityId: 1,
          memoryType: "fact",
          category: "personal",
          content: "Has a dog named Max",
          confidence: 0.95,
          timesUsed: 2,
          isActive: true,
          isVerified: false,
        },
      ];

      const result = buildMemoryContext(memories, []);
      expect(result).toContain("don't be creepy");
    });
  });

  describe("Memory Types", () => {
    it("should support all memory types", () => {
      const memoryTypes: UserMemory["memoryType"][] = [
        "fact",
        "preference",
        "interest",
        "relationship",
        "goal",
        "experience",
        "context",
      ];

      memoryTypes.forEach((type) => {
        const memory: UserMemory = {
          id: 1,
          fanUserId: 1,
          personalityId: 1,
          memoryType: type,
          category: "test",
          content: `Test ${type} content`,
          confidence: 0.9,
          timesUsed: 1,
          isActive: true,
          isVerified: false,
        };

        const result = buildMemoryContext([memory], []);
        expect(result).toContain(`(${type})`);
      });
    });
  });

  describe("Conversation Summary", () => {
    it("should handle empty keyTopics", () => {
      const summaries: ConversationSummary[] = [
        {
          id: 1,
          conversationId: 1,
          summary: "General chat about life",
          keyTopics: [],
          emotionalTone: "neutral",
          messageCount: 10,
        },
      ];

      const result = buildMemoryContext([], summaries);
      expect(result).toContain("General chat about life");
      expect(result).not.toContain("Topics discussed:");
    });

    it("should use only the latest summary", () => {
      const summaries: ConversationSummary[] = [
        {
          id: 2,
          conversationId: 1,
          summary: "Latest conversation about music",
          keyTopics: ["music"],
          emotionalTone: "happy",
          messageCount: 30,
        },
        {
          id: 1,
          conversationId: 1,
          summary: "Old conversation about movies",
          keyTopics: ["movies"],
          emotionalTone: "excited",
          messageCount: 20,
        },
      ];

      const result = buildMemoryContext([], summaries);
      expect(result).toContain("Latest conversation about music");
      // Should not include old summary in the main context
      expect(result.indexOf("Old conversation about movies")).toBe(-1);
    });
  });
});
