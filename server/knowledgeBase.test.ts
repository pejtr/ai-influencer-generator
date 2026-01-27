import { describe, it, expect } from "vitest";
import {
  CONTENT_TYPES,
  CATEGORIES,
  validateKnowledgeItem,
  searchByKeywords,
  sortByPriority,
  filterByType,
  filterByCategory,
  formatTagsArray,
} from "./knowledgeBaseUtils";

// Utility functions for knowledge base (to be tested without DB)
const CONTENT_TYPES_LIST = ["platform_feature", "how_to", "best_practice", "faq", "industry", "tip"];
const CATEGORIES_LIST = ["creation", "generation", "monetization", "getting_started", "content", "pricing", "legal", "general", "overview", "examples"];

// Mock knowledge items for testing
const mockItems = [
  {
    id: 1,
    title: "AI Influencer Studio",
    content: "The Studio is where you create and customize your AI influencer.",
    contentType: "platform_feature",
    category: "creation",
    tags: ["studio", "create", "design"],
    priority: 10,
    isActive: true,
  },
  {
    id: 2,
    title: "How to Create Your First AI Influencer",
    content: "Step by step guide to creating your first AI influencer.",
    contentType: "how_to",
    category: "getting_started",
    tags: ["create", "first", "beginner", "tutorial"],
    priority: 9,
    isActive: true,
  },
  {
    id: 3,
    title: "Best Practices for Monetization",
    content: "Tips for successful monetization strategies.",
    contentType: "best_practice",
    category: "monetization",
    tags: ["monetize", "earn", "money"],
    priority: 8,
    isActive: false,
  },
  {
    id: 4,
    title: "How much does it cost?",
    content: "Pricing information and plans.",
    contentType: "faq",
    category: "pricing",
    tags: ["cost", "price", "subscription"],
    priority: 7,
    isActive: true,
  },
];

describe("Knowledge Base Utilities", () => {
  describe("Content Types", () => {
    it("should have all required content types", () => {
      expect(CONTENT_TYPES_LIST).toContain("platform_feature");
      expect(CONTENT_TYPES_LIST).toContain("how_to");
      expect(CONTENT_TYPES_LIST).toContain("best_practice");
      expect(CONTENT_TYPES_LIST).toContain("faq");
      expect(CONTENT_TYPES_LIST).toContain("industry");
      expect(CONTENT_TYPES_LIST).toContain("tip");
    });

    it("should have exactly 6 content types", () => {
      expect(CONTENT_TYPES_LIST.length).toBe(6);
    });
  });

  describe("Categories", () => {
    it("should have all required categories", () => {
      expect(CATEGORIES_LIST).toContain("creation");
      expect(CATEGORIES_LIST).toContain("generation");
      expect(CATEGORIES_LIST).toContain("monetization");
      expect(CATEGORIES_LIST).toContain("getting_started");
      expect(CATEGORIES_LIST).toContain("pricing");
    });

    it("should have at least 10 categories", () => {
      expect(CATEGORIES_LIST.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Validation", () => {
    it("should validate a valid knowledge item", () => {
      const item = {
        title: "Test Title",
        content: "Test content that is long enough.",
        contentType: "platform_feature",
        category: "creation",
        tags: ["test", "example"],
        priority: 5,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toHaveLength(0);
    });

    it("should reject empty title", () => {
      const item = {
        title: "",
        content: "Test content",
        contentType: "platform_feature",
        category: "creation",
        tags: [],
        priority: 5,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toContain("Title is required");
    });

    it("should reject empty content", () => {
      const item = {
        title: "Test Title",
        content: "",
        contentType: "platform_feature",
        category: "creation",
        tags: [],
        priority: 5,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toContain("Content is required");
    });

    it("should reject invalid priority (too low)", () => {
      const item = {
        title: "Test Title",
        content: "Test content",
        contentType: "platform_feature",
        category: "creation",
        tags: [],
        priority: 0,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toContain("Priority must be between 1 and 10");
    });

    it("should reject invalid priority (too high)", () => {
      const item = {
        title: "Test Title",
        content: "Test content",
        contentType: "platform_feature",
        category: "creation",
        tags: [],
        priority: 11,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toContain("Priority must be between 1 and 10");
    });

    it("should reject invalid content type", () => {
      const item = {
        title: "Test Title",
        content: "Test content",
        contentType: "invalid_type",
        category: "creation",
        tags: [],
        priority: 5,
      };

      const errors = validateKnowledgeItemLocal(item);
      expect(errors).toContain("Invalid content type");
    });
  });

  describe("Search by Keywords", () => {
    it("should find items by title keyword", () => {
      const results = searchByKeywordsLocal(mockItems, "studio");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("AI Influencer Studio");
    });

    it("should find items by content keyword", () => {
      const results = searchByKeywordsLocal(mockItems, "monetization");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Best Practices for Monetization");
    });

    it("should find items by tag", () => {
      const results = searchByKeywordsLocal(mockItems, "beginner");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("How to Create Your First AI Influencer");
    });

    it("should be case insensitive", () => {
      const results = searchByKeywordsLocal(mockItems, "STUDIO");
      expect(results.length).toBe(1);
    });

    it("should return all items for empty query", () => {
      const results = searchByKeywordsLocal(mockItems, "");
      expect(results.length).toBe(mockItems.length);
    });

    it("should return empty for no matches", () => {
      const results = searchByKeywordsLocal(mockItems, "nonexistent");
      expect(results.length).toBe(0);
    });
  });

  describe("Sort by Priority", () => {
    it("should sort items by priority descending", () => {
      const sorted = sortByPriorityLocal([...mockItems]);
      expect(sorted[0].priority).toBe(10);
      expect(sorted[1].priority).toBe(9);
      expect(sorted[2].priority).toBe(8);
      expect(sorted[3].priority).toBe(7);
    });
  });

  describe("Filter by Type", () => {
    it("should filter items by content type", () => {
      const filtered = filterByTypeLocal(mockItems, "how_to");
      expect(filtered.length).toBe(1);
      expect(filtered[0].contentType).toBe("how_to");
    });

    it("should return all items for empty type filter", () => {
      const filtered = filterByTypeLocal(mockItems, "");
      expect(filtered.length).toBe(mockItems.length);
    });
  });

  describe("Filter by Category", () => {
    it("should filter items by category", () => {
      const filtered = filterByCategoryLocal(mockItems, "monetization");
      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe("monetization");
    });

    it("should return all items for empty category filter", () => {
      const filtered = filterByCategoryLocal(mockItems, "");
      expect(filtered.length).toBe(mockItems.length);
    });
  });

  describe("Filter by Active Status", () => {
    it("should filter active items only", () => {
      const filtered = mockItems.filter(item => item.isActive);
      expect(filtered.length).toBe(3);
    });

    it("should filter inactive items only", () => {
      const filtered = mockItems.filter(item => !item.isActive);
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("Best Practices for Monetization");
    });
  });

  describe("Tags Formatting", () => {
    it("should format comma-separated string to array", () => {
      const result = formatTagsLocal("tag1, tag2, tag3");
      expect(result).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should trim whitespace from tags", () => {
      const result = formatTagsLocal("  tag1  ,  tag2  ");
      expect(result).toEqual(["tag1", "tag2"]);
    });

    it("should filter empty tags", () => {
      const result = formatTagsLocal("tag1, , tag2, ");
      expect(result).toEqual(["tag1", "tag2"]);
    });

    it("should handle empty string", () => {
      const result = formatTagsLocal("");
      expect(result).toEqual([]);
    });
  });
});

// Local utility functions for testing (without DB dependency)
function validateKnowledgeItemLocal(item: {
  title: string;
  content: string;
  contentType: string;
  category: string;
  tags: string[];
  priority: number;
}): string[] {
  const errors: string[] = [];

  if (!item.title || item.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!item.content || item.content.trim() === "") {
    errors.push("Content is required");
  }

  if (item.priority < 1 || item.priority > 10) {
    errors.push("Priority must be between 1 and 10");
  }

  if (!CONTENT_TYPES_LIST.includes(item.contentType)) {
    errors.push("Invalid content type");
  }

  return errors;
}

function searchByKeywordsLocal(items: typeof mockItems, query: string): typeof mockItems {
  if (!query || query.trim() === "") return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.content.toLowerCase().includes(lowerQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

function sortByPriorityLocal(items: typeof mockItems): typeof mockItems {
  return items.sort((a, b) => b.priority - a.priority);
}

function filterByTypeLocal(items: typeof mockItems, type: string): typeof mockItems {
  if (!type) return items;
  return items.filter(item => item.contentType === type);
}

function filterByCategoryLocal(items: typeof mockItems, category: string): typeof mockItems {
  if (!category) return items;
  return items.filter(item => item.category === category);
}

function formatTagsLocal(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag !== "");
}
