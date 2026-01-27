import { describe, it, expect, vi } from "vitest";
import { 
  generateChatResponse, 
  generateWelcomeMessage, 
  generateContentOfferMessage,
  calculatePlatformFee,
  MESSAGE_COST,
  PLATFORM_FEE_PERCENT,
  buildPersonalityPrompt
} from "./chatCompanion";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "Hey there! So nice to meet you! 💕"
      }
    }]
  })
}));

describe("Chat Companion Service", () => {
  describe("calculatePlatformFee", () => {
    it("should calculate 10% platform fee correctly", () => {
      const result = calculatePlatformFee(100);
      expect(result.platformFee).toBe(10);
      expect(result.creatorEarnings).toBe(90);
    });

    it("should handle decimal amounts", () => {
      const result = calculatePlatformFee(9.99);
      expect(result.platformFee).toBeCloseTo(0.999, 2);
      expect(result.creatorEarnings).toBeCloseTo(8.991, 2);
    });

    it("should handle small amounts", () => {
      const result = calculatePlatformFee(1);
      expect(result.platformFee).toBe(0.1);
      expect(result.creatorEarnings).toBe(0.9);
    });

    it("should handle large amounts", () => {
      const result = calculatePlatformFee(1000);
      expect(result.platformFee).toBe(100);
      expect(result.creatorEarnings).toBe(900);
    });
  });

  describe("buildPersonalityPrompt", () => {
    const mockPersonality = {
      id: 1,
      userId: 1,
      name: "Luna",
      bio: "A friendly AI companion",
      avatarUrl: null,
      personalityType: "friendly" as const,
      chatStyle: "casual" as const,
      responseLength: "medium" as const,
      customTraits: ["caring", "supportive"],
      interests: ["music", "art"],
      welcomeMessage: "Hey there!",
      isActive: true,
      totalConversations: 10,
      totalMessages: 100,
      totalRevenue: "50.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should include personality name", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("Luna");
    });

    it("should include personality type", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("friendly");
    });

    it("should include chat style description", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("CHAT STYLE");
    });

    it("should include bio if present", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("A friendly AI companion");
    });

    it("should include interests if present", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("music");
      expect(prompt).toContain("art");
    });

    it("should include custom traits if present", () => {
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("caring");
      expect(prompt).toContain("supportive");
    });
  });

  describe("generateWelcomeMessage", () => {
    const mockPersonality = {
      id: 1,
      userId: 1,
      name: "Luna",
      bio: "A friendly AI companion",
      avatarUrl: null,
      personalityType: "friendly" as const,
      chatStyle: "casual" as const,
      responseLength: "medium" as const,
      customTraits: null,
      interests: null,
      welcomeMessage: "Custom welcome!",
      isActive: true,
      totalConversations: 0,
      totalMessages: 0,
      totalRevenue: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should return custom welcome message if set", async () => {
      const message = await generateWelcomeMessage(mockPersonality);
      expect(message).toBe("Custom welcome!");
    });

    it("should generate welcome message if not set", async () => {
      const personalityWithoutWelcome = { ...mockPersonality, welcomeMessage: null };
      const message = await generateWelcomeMessage(personalityWithoutWelcome);
      expect(message).toBeTruthy();
      expect(typeof message).toBe("string");
    });
  });

  describe("generateChatResponse", () => {
    const mockPersonality = {
      id: 1,
      userId: 1,
      name: "Luna",
      bio: "A friendly AI companion",
      avatarUrl: null,
      personalityType: "friendly" as const,
      chatStyle: "casual" as const,
      responseLength: "medium" as const,
      customTraits: null,
      interests: null,
      welcomeMessage: null,
      isActive: true,
      totalConversations: 0,
      totalMessages: 0,
      totalRevenue: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should generate a response", async () => {
      const result = await generateChatResponse(
        mockPersonality,
        [{ role: "fan" as const, content: "Hello!" }],
        "Hello!"
      );
      
      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("shouldOfferContent");
      expect(typeof result.response).toBe("string");
    });

    it("should handle content offer context", async () => {
      const result = await generateChatResponse(
        mockPersonality,
        [{ role: "fan" as const, content: "Show me something special" }],
        "Show me something special",
        {
          shouldOfferContent: true,
          contentToOffer: {
            id: 1,
            title: "Exclusive Photo",
            price: "9.99"
          }
        }
      );
      
      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("shouldOfferContent");
    });
  });

  describe("generateContentOfferMessage", () => {
    const mockPersonality = {
      id: 1,
      userId: 1,
      name: "Luna",
      bio: "A friendly AI companion",
      avatarUrl: null,
      personalityType: "flirty" as const,
      chatStyle: "romantic" as const,
      responseLength: "medium" as const,
      customTraits: null,
      interests: null,
      welcomeMessage: null,
      isActive: true,
      totalConversations: 0,
      totalMessages: 0,
      totalRevenue: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockContent = {
      id: 1,
      title: "Exclusive Photo Set",
      price: "19.99"
    };

    it("should generate content offer message", async () => {
      const message = await generateContentOfferMessage(mockPersonality, mockContent);
      expect(message).toBeTruthy();
      expect(typeof message).toBe("string");
    });
  });

  describe("Constants", () => {
    it("should have MESSAGE_COST defined", () => {
      expect(MESSAGE_COST).toBeDefined();
      expect(typeof MESSAGE_COST).toBe("number");
    });

    it("should have PLATFORM_FEE_PERCENT defined", () => {
      expect(PLATFORM_FEE_PERCENT).toBeDefined();
      expect(typeof PLATFORM_FEE_PERCENT).toBe("number");
    });
  });
});

describe("Personality Types", () => {
  const personalityTypes = ["flirty", "friendly", "mysterious", "playful", "sophisticated", "bold"];
  
  personalityTypes.forEach((type) => {
    it(`should handle ${type} personality type`, () => {
      const mockPersonality = {
        id: 1,
        userId: 1,
        name: "Test",
        bio: null,
        avatarUrl: null,
        personalityType: type as "flirty" | "friendly" | "mysterious" | "playful" | "sophisticated" | "bold",
        chatStyle: "casual" as const,
        responseLength: "medium" as const,
        customTraits: null,
        interests: null,
        welcomeMessage: null,
        isActive: true,
        totalConversations: 0,
        totalMessages: 0,
        totalRevenue: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("PERSONALITY");
      expect(prompt).toBeTruthy();
    });
  });
});

describe("Chat Styles", () => {
  const chatStyles = ["casual", "formal", "romantic", "witty", "seductive"];
  
  chatStyles.forEach((style) => {
    it(`should handle ${style} chat style`, () => {
      const mockPersonality = {
        id: 1,
        userId: 1,
        name: "Test",
        bio: null,
        avatarUrl: null,
        personalityType: "friendly" as const,
        chatStyle: style as "casual" | "formal" | "romantic" | "witty" | "seductive",
        responseLength: "medium" as const,
        customTraits: null,
        interests: null,
        welcomeMessage: null,
        isActive: true,
        totalConversations: 0,
        totalMessages: 0,
        totalRevenue: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toContain("CHAT STYLE");
      expect(prompt).toBeTruthy();
    });
  });
});

describe("Response Lengths", () => {
  const responseLengths = ["short", "medium", "long"];
  
  responseLengths.forEach((length) => {
    it(`should handle ${length} response length`, () => {
      const mockPersonality = {
        id: 1,
        userId: 1,
        name: "Test",
        bio: null,
        avatarUrl: null,
        personalityType: "friendly" as const,
        chatStyle: "casual" as const,
        responseLength: length as "short" | "medium" | "long",
        customTraits: null,
        interests: null,
        welcomeMessage: null,
        isActive: true,
        totalConversations: 0,
        totalMessages: 0,
        totalRevenue: "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const prompt = buildPersonalityPrompt(mockPersonality);
      expect(prompt).toBeTruthy();
    });
  });
});
