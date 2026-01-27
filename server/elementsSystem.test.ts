import { describe, it, expect } from "vitest";
import {
  ELEMENT_CATEGORIES,
  ELEMENT_PRESETS,
  DEFAULT_STRENGTHS,
  buildReferencePrompt,
  combineReferencePrompts,
  createReferenceElement,
  validateReferenceElement,
  type ElementType,
  type ReferenceElement,
} from "../shared/elementsSystem";

describe("Elements System", () => {
  describe("Element Categories", () => {
    it("should have all element types defined", () => {
      const types: ElementType[] = ["character", "outfit", "scene", "object", "style"];
      
      types.forEach((type) => {
        expect(ELEMENT_CATEGORIES[type]).toBeDefined();
        expect(ELEMENT_CATEGORIES[type].name).toBeTruthy();
        expect(ELEMENT_CATEGORIES[type].description).toBeTruthy();
        expect(ELEMENT_CATEGORIES[type].icon).toBeTruthy();
        expect(ELEMENT_CATEGORIES[type].extractableFeatures.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Default Strengths", () => {
    it("should have default strengths for all element types", () => {
      const types: ElementType[] = ["character", "outfit", "scene", "object", "style"];
      
      types.forEach((type) => {
        expect(DEFAULT_STRENGTHS[type]).toBeDefined();
        expect(DEFAULT_STRENGTHS[type]).toBeGreaterThanOrEqual(0);
        expect(DEFAULT_STRENGTHS[type]).toBeLessThanOrEqual(100);
      });
    });

    it("should have highest strength for character type", () => {
      expect(DEFAULT_STRENGTHS.character).toBeGreaterThanOrEqual(DEFAULT_STRENGTHS.outfit);
      expect(DEFAULT_STRENGTHS.character).toBeGreaterThanOrEqual(DEFAULT_STRENGTHS.scene);
    });
  });

  describe("Element Presets", () => {
    it("should have valid presets", () => {
      expect(ELEMENT_PRESETS.length).toBeGreaterThan(0);
      
      ELEMENT_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.type).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.features).toBeDefined();
      });
    });

    it("should have presets for multiple element types", () => {
      const types = new Set(ELEMENT_PRESETS.map(p => p.type));
      expect(types.size).toBeGreaterThan(2);
    });
  });

  describe("createReferenceElement", () => {
    it("should create element with required fields", () => {
      const element = createReferenceElement("character", "Test Character");
      
      expect(element.id).toBeTruthy();
      expect(element.type).toBe("character");
      expect(element.name).toBe("Test Character");
      expect(element.strength).toBe(DEFAULT_STRENGTHS.character);
      expect(element.createdAt).toBeInstanceOf(Date);
      expect(element.updatedAt).toBeInstanceOf(Date);
    });

    it("should create element with custom options", () => {
      const element = createReferenceElement("outfit", "Red Dress", {
        imageUrl: "https://example.com/dress.jpg",
        description: "Elegant red evening dress",
        strength: 80,
        features: {
          outfitType: "evening gown",
          outfitColor: "red",
        },
      });
      
      expect(element.imageUrl).toBe("https://example.com/dress.jpg");
      expect(element.description).toBe("Elegant red evening dress");
      expect(element.strength).toBe(80);
      expect(element.extractedFeatures?.outfitType).toBe("evening gown");
    });

    it("should generate unique IDs", () => {
      const element1 = createReferenceElement("character", "Test 1");
      const element2 = createReferenceElement("character", "Test 2");
      
      expect(element1.id).not.toBe(element2.id);
    });
  });

  describe("validateReferenceElement", () => {
    it("should validate correct element", () => {
      const element: Partial<ReferenceElement> = {
        type: "character",
        name: "Test",
        imageUrl: "https://example.com/image.jpg",
        strength: 75,
      };
      
      const result = validateReferenceElement(element);
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject element without type", () => {
      const element: Partial<ReferenceElement> = {
        name: "Test",
        imageUrl: "https://example.com/image.jpg",
      };
      
      const result = validateReferenceElement(element);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Element type is required");
    });

    it("should reject element without name", () => {
      const element: Partial<ReferenceElement> = {
        type: "character",
        imageUrl: "https://example.com/image.jpg",
      };
      
      const result = validateReferenceElement(element);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Element name is required");
    });

    it("should reject element with invalid strength", () => {
      const element: Partial<ReferenceElement> = {
        type: "character",
        name: "Test",
        imageUrl: "https://example.com/image.jpg",
        strength: 150,
      };
      
      const result = validateReferenceElement(element);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Strength must be between 0 and 100");
    });
  });

  describe("buildReferencePrompt", () => {
    it("should build prompt for character element", () => {
      const element = createReferenceElement("character", "Test", {
        features: {
          gender: "woman",
          age: "25",
          hairColor: "blonde",
          hairStyle: "long wavy",
          eyeColor: "blue",
        },
      });
      
      const result = buildReferencePrompt(element);
      
      expect(result).toContain("woman");
      expect(result).toContain("25 years old");
      expect(result).toContain("blonde");
      expect(result).toContain("blue eyes");
    });

    it("should build prompt for outfit element", () => {
      const element = createReferenceElement("outfit", "Test", {
        features: {
          outfitType: "evening gown",
          outfitColor: "red",
          outfitStyle: "elegant",
          accessories: ["diamond earrings", "clutch"],
        },
      });
      
      const result = buildReferencePrompt(element);
      
      expect(result).toContain("wearing red evening gown");
      expect(result).toContain("elegant style");
      expect(result).toContain("diamond earrings");
    });

    it("should build prompt for scene element", () => {
      const element = createReferenceElement("scene", "Test", {
        features: {
          location: "tropical beach",
          timeOfDay: "sunset",
          weather: "sunny",
          mood: "romantic",
        },
      });
      
      const result = buildReferencePrompt(element);
      
      expect(result).toContain("in tropical beach");
      expect(result).toContain("at sunset");
      expect(result).toContain("sunny weather");
    });

    it("should apply strength modifiers", () => {
      const highStrength = createReferenceElement("character", "Test", {
        strength: 90,
        features: { gender: "woman" },
      });
      
      const lowStrength = createReferenceElement("character", "Test", {
        strength: 30,
        features: { gender: "woman" },
      });
      
      const highResult = buildReferencePrompt(highStrength, true);
      const lowResult = buildReferencePrompt(lowStrength, true);
      
      expect(highResult).toContain(":1.3");
      expect(lowResult).toContain(":0.7");
    });

    it("should return empty string for element without features", () => {
      const element = createReferenceElement("character", "Test");
      const result = buildReferencePrompt(element);
      
      expect(result).toBe("");
    });
  });

  describe("combineReferencePrompts", () => {
    it("should combine multiple elements with base prompt", () => {
      const basePrompt = "professional photo";
      const elements = [
        createReferenceElement("character", "Model", {
          features: { gender: "woman", age: "25" },
        }),
        createReferenceElement("outfit", "Dress", {
          features: { outfitType: "red dress" },
        }),
      ];
      
      const result = combineReferencePrompts(elements, basePrompt);
      
      expect(result).toContain(basePrompt);
      expect(result).toContain("woman");
      expect(result).toContain("red dress");
    });

    it("should sort elements by type priority", () => {
      const elements = [
        createReferenceElement("style", "Style", {
          features: { artStyle: "cinematic" },
        }),
        createReferenceElement("character", "Model", {
          features: { gender: "woman" },
        }),
      ];
      
      const result = combineReferencePrompts(elements, "base");
      
      // Character should come before style
      const characterIndex = result.indexOf("woman");
      const styleIndex = result.indexOf("cinematic");
      expect(characterIndex).toBeLessThan(styleIndex);
    });

    it("should handle empty elements array", () => {
      const result = combineReferencePrompts([], "base prompt");
      expect(result).toBe("base prompt");
    });
  });
});
