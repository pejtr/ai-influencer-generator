import { describe, it, expect, vi } from "vitest";
import {
  PLATFORM_KNOWLEDGE,
  INTERNAL_LINKS,
  buildRAGContext,
  type KnowledgeItem,
  type RAGContext,
} from "./chatRAG";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"category":"general","keywords":["test"],"needsHelp":false}' } }],
  }),
}));

describe("Chat RAG System", () => {
  describe("PLATFORM_KNOWLEDGE", () => {
    it("should have knowledge items for all key features", () => {
      const categories = PLATFORM_KNOWLEDGE.map(k => k.category);
      
      expect(categories).toContain("creation");
      expect(categories).toContain("generation");
      expect(categories).toContain("monetization");
    });

    it("should have knowledge items for all content types", () => {
      const contentTypes = PLATFORM_KNOWLEDGE.map(k => k.contentType);
      
      expect(contentTypes).toContain("platform_feature");
      expect(contentTypes).toContain("how_to");
      expect(contentTypes).toContain("best_practice");
      expect(contentTypes).toContain("faq");
      expect(contentTypes).toContain("industry");
    });

    it("should have valid priority values", () => {
      PLATFORM_KNOWLEDGE.forEach(item => {
        expect(item.priority).toBeGreaterThanOrEqual(1);
        expect(item.priority).toBeLessThanOrEqual(10);
      });
    });

    it("should have tags for each knowledge item", () => {
      PLATFORM_KNOWLEDGE.forEach(item => {
        expect(Array.isArray(item.tags)).toBe(true);
        expect(item.tags.length).toBeGreaterThan(0);
      });
    });

    it("should have content about character consistency", () => {
      const consistencyItem = PLATFORM_KNOWLEDGE.find(
        k => k.title.toLowerCase().includes("consistency")
      );
      expect(consistencyItem).toBeDefined();
      expect(consistencyItem?.content).toContain("consistency");
    });

    it("should have content about monetization", () => {
      const monetizationItems = PLATFORM_KNOWLEDGE.filter(
        k => k.category === "monetization" || k.tags.includes("monetize")
      );
      expect(monetizationItems.length).toBeGreaterThan(0);
    });

    it("should have FAQ about pricing", () => {
      const pricingFaq = PLATFORM_KNOWLEDGE.find(
        k => k.contentType === "faq" && k.tags.includes("price")
      );
      expect(pricingFaq).toBeDefined();
    });
  });

  describe("INTERNAL_LINKS", () => {
    it("should have links to main pages", () => {
      const urls = INTERNAL_LINKS.map(l => l.url);
      
      expect(urls).toContain("/studio");
      expect(urls).toContain("/gallery");
      expect(urls).toContain("/pricing");
      expect(urls).toContain("/companion");
      expect(urls).toContain("/dashboard");
    });

    it("should have keywords for each link", () => {
      INTERNAL_LINKS.forEach(link => {
        expect(Array.isArray(link.keywords)).toBe(true);
        expect(link.keywords.length).toBeGreaterThan(0);
      });
    });

    it("should have human-readable labels", () => {
      INTERNAL_LINKS.forEach(link => {
        expect(link.label).toBeTruthy();
        expect(link.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("buildRAGContext", () => {
    it("should return empty string when no knowledge or links", () => {
      const ragContext: RAGContext = {
        relevantKnowledge: [],
        suggestedLinks: [],
      };

      const result = buildRAGContext(ragContext);
      expect(result).toBe("");
    });

    it("should build context with knowledge items", () => {
      const ragContext: RAGContext = {
        relevantKnowledge: [
          {
            id: 1,
            title: "AI Influencer Studio",
            content: "The Studio is where you create AI influencers.",
            contentType: "platform_feature",
            category: "creation",
            tags: ["studio", "create"],
            priority: 10,
          },
        ],
        suggestedLinks: [],
      };

      const result = buildRAGContext(ragContext);
      
      expect(result).toContain("PLATFORM KNOWLEDGE");
      expect(result).toContain("AI Influencer Studio");
      expect(result).toContain("The Studio is where you create AI influencers.");
    });

    it("should build context with suggested links", () => {
      const ragContext: RAGContext = {
        relevantKnowledge: [],
        suggestedLinks: [
          { url: "/studio", label: "AI Studio", reason: "Related to: create" },
          { url: "/pricing", label: "Pricing", reason: "Related to: cost" },
        ],
      };

      const result = buildRAGContext(ragContext);
      
      expect(result).toContain("PLATFORM KNOWLEDGE");
      expect(result).toContain("[AI Studio](/studio)");
      expect(result).toContain("[Pricing](/pricing)");
    });

    it("should build context with both knowledge and links", () => {
      const ragContext: RAGContext = {
        relevantKnowledge: [
          {
            id: 1,
            title: "How to Create Your First AI Influencer",
            content: "Go to Studio and start creating.",
            contentType: "how_to",
            category: "getting_started",
            tags: ["create", "start"],
            priority: 10,
          },
        ],
        suggestedLinks: [
          { url: "/studio", label: "AI Studio", reason: "Related to: create" },
        ],
      };

      const result = buildRAGContext(ragContext);
      
      expect(result).toContain("How to Create Your First AI Influencer");
      expect(result).toContain("[AI Studio](/studio)");
      expect(result).toContain("Use this knowledge to provide helpful");
    });

    it("should format knowledge items with markdown bold titles", () => {
      const ragContext: RAGContext = {
        relevantKnowledge: [
          {
            id: 1,
            title: "Test Title",
            content: "Test content here.",
            contentType: "platform_feature",
            category: "test",
            tags: ["test"],
            priority: 5,
          },
        ],
        suggestedLinks: [],
      };

      const result = buildRAGContext(ragContext);
      expect(result).toContain("**Test Title**");
    });
  });

  describe("Knowledge Item Structure", () => {
    it("should have all required fields", () => {
      PLATFORM_KNOWLEDGE.forEach(item => {
        expect(item.title).toBeTruthy();
        expect(item.content).toBeTruthy();
        expect(item.contentType).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.tags).toBeDefined();
        expect(item.priority).toBeDefined();
      });
    });

    it("should have unique titles", () => {
      const titles = PLATFORM_KNOWLEDGE.map(k => k.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it("should have content length within reasonable bounds", () => {
      PLATFORM_KNOWLEDGE.forEach(item => {
        expect(item.content.length).toBeGreaterThan(20);
        expect(item.content.length).toBeLessThan(1000);
      });
    });
  });

  describe("Content Type Coverage", () => {
    it("should have multiple platform features", () => {
      const features = PLATFORM_KNOWLEDGE.filter(k => k.contentType === "platform_feature");
      expect(features.length).toBeGreaterThanOrEqual(5);
    });

    it("should have multiple how-to guides", () => {
      const howTos = PLATFORM_KNOWLEDGE.filter(k => k.contentType === "how_to");
      expect(howTos.length).toBeGreaterThanOrEqual(2);
    });

    it("should have multiple FAQs", () => {
      const faqs = PLATFORM_KNOWLEDGE.filter(k => k.contentType === "faq");
      expect(faqs.length).toBeGreaterThanOrEqual(3);
    });

    it("should have best practices", () => {
      const bestPractices = PLATFORM_KNOWLEDGE.filter(k => k.contentType === "best_practice");
      expect(bestPractices.length).toBeGreaterThanOrEqual(2);
    });
  });
});
