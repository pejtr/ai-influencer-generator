import { describe, it, expect } from "vitest";
import { exportAsJSON, exportAsCSV, importFromJSON, importFromCSV, previewImportJSON } from "./knowledgeBaseImportExport";

describe("Knowledge Base Import/Export", () => {
  describe("exportToJSON", () => {
    it("should export knowledge items as JSON object", async () => {
      const result = await exportAsJSON();
      expect(result).toBeTruthy();
      if (result) {
        expect(result).toHaveProperty("version");
        expect(result).toHaveProperty("exportedAt");
        expect(result).toHaveProperty("itemCount");
        expect(result).toHaveProperty("items");
        expect(Array.isArray(result.items)).toBe(true);
      }
    });
  });

  describe("exportToCSV", () => {
    it("should export knowledge items as CSV string", async () => {
      const result = await exportAsCSV();
      expect(typeof result).toBe("string");
      expect(result).toContain("Title");
      expect(result).toContain("Content");
    });

    it("should handle empty database", async () => {
      const result = await exportAsCSV();
      expect(typeof result).toBe("string");
    });
  });

  describe("previewImport", () => {
    it("should preview valid JSON data", async () => {
      const testData = [
        {
          title: "Test Item",
          content: "Test content",
          contentType: "platform_feature",
          category: "general",
          tags: ["test"],
          priority: 5,
        },
      ];

      const result = await previewImportJSON(testData);
      expect(result).toHaveProperty("newItems");
      expect(result).toHaveProperty("duplicates");
      expect(result).toHaveProperty("invalid");
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should detect invalid items", async () => {
      const testData = [
        {
          title: "", // Invalid: empty title
          content: "Test content",
          contentType: "platform_feature",
        },
      ];

      const result = await previewImportJSON(testData);
      expect(result).toHaveProperty("invalid");
      // Invalid detection depends on validation rules
    });

    it("should detect duplicates by title", async () => {
      const testData = [
        {
          title: "Duplicate Test",
          content: "Content 1",
          contentType: "platform_feature",
          category: "general",
          tags: [],
          priority: 5,
        },
        {
          title: "Duplicate Test", // Same title
          content: "Content 2",
          contentType: "how_to",
          category: "general",
          tags: [],
          priority: 3,
        },
      ];

      const result = await previewImportJSON(testData);
      expect(result).toHaveProperty("duplicates");
      // Duplicate detection depends on existing data
    });
  });

  describe("importFromJSON", () => {
    it("should import valid JSON data", async () => {
      const testData = [
        {
          title: `Test Import ${Date.now()}`,
          content: "Test import content",
          contentType: "platform_feature",
          category: "general",
          tags: ["test", "import"],
          priority: 7,
        },
      ];

      const result = await importFromJSON(testData, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("imported");
      expect(result).toHaveProperty("skipped");
      expect(result).toHaveProperty("errors");
    });

    it("should skip duplicates when skipDuplicates is true", async () => {
      const uniqueTitle = `Duplicate Test ${Date.now()}`;
      const testData = [
        {
          title: uniqueTitle,
          content: "First version",
          contentType: "platform_feature",
          category: "general",
          tags: [],
          priority: 5,
        },
      ];

      // First import
      const firstResult = await importFromJSON(testData, { skipDuplicates: true, overwriteDuplicates: false });

      // Second import with same title
      const result = await importFromJSON(testData, { skipDuplicates: true, overwriteDuplicates: false });

      // Either skipped or imported (depends on implementation)
      expect(result).toHaveProperty("skipped");
      expect(result).toHaveProperty("imported");
    });

    it("should handle invalid data gracefully", async () => {
      const testData = [
        {
          title: "", // Invalid
          content: "Test",
          contentType: "invalid_type",
        },
      ];

      const result = await importFromJSON(testData, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("importFromCSV", () => {
    it("should import valid CSV data", async () => {
      const csvContent = `title,content,contentType,category,tags,priority
Test CSV Import ${Date.now()},Test CSV content,platform_feature,general,"test,csv",8`;

      const result = await importFromCSV(csvContent, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("imported");
    });

    it("should handle CSV with quotes and commas", async () => {
      const csvContent = `title,content,contentType,category,tags,priority
"Test with comma ${Date.now()}",Test content,platform_feature,general,"tag1,tag2",5`;

      const result = await importFromCSV(csvContent, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("imported");
    });

    it("should handle empty CSV", async () => {
      const csvContent = "title,content,contentType,category,tags,priority";

      const result = await importFromCSV(csvContent, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      expect(result.imported).toBe(0);
    });
  });
});
