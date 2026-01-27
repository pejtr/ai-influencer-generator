import { describe, it, expect } from "vitest";
import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  ASPECT_RATIO_OPTIONS,
  PORTRAIT_TEMPLATES,
  ANGLE_TEMPLATES,
  FULL_BODY_TEMPLATES,
  EMOTION_TEMPLATES,
  OUTFIT_TEMPLATES,
  SCENE_TEMPLATES,
  CHARACTER_SHEET_TEMPLATES,
  buildPromptFromTemplate,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  type PromptTemplate,
  type PromptCategory,
} from "../shared/promptTemplates";

describe("Prompt Templates", () => {
  describe("Template Structure", () => {
    it("should have all required template categories", () => {
      const categoryIds = TEMPLATE_CATEGORIES.map(c => c.id);
      expect(categoryIds).toContain("portrait");
      expect(categoryIds).toContain("angles");
      expect(categoryIds).toContain("full_body");
      expect(categoryIds).toContain("emotions");
      expect(categoryIds).toContain("outfits");
      expect(categoryIds).toContain("scenes");
      expect(categoryIds).toContain("character_sheet");
    });

    it("should have at least 30 templates total", () => {
      expect(ALL_TEMPLATES.length).toBeGreaterThanOrEqual(30);
    });

    it("should have unique template IDs", () => {
      const ids = ALL_TEMPLATES.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid aspect ratios for all templates", () => {
      const validRatios = ASPECT_RATIO_OPTIONS.map(ar => ar.value);
      ALL_TEMPLATES.forEach(template => {
        expect(validRatios).toContain(template.aspectRatio);
      });
    });
  });

  describe("Portrait Templates", () => {
    it("should have at least 3 portrait templates", () => {
      expect(PORTRAIT_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it("should include base portrait template", () => {
      const basePortrait = PORTRAIT_TEMPLATES.find(t => t.id === "portrait_base");
      expect(basePortrait).toBeDefined();
      expect(basePortrait?.prompt).toContain("{{CHARACTER}}");
    });

    it("should include glamour portrait template", () => {
      const glamour = PORTRAIT_TEMPLATES.find(t => t.id === "portrait_glamour");
      expect(glamour).toBeDefined();
    });
  });

  describe("Angle Templates", () => {
    it("should have templates for front, profile, and 3/4 views", () => {
      const front = ANGLE_TEMPLATES.find(t => t.id === "angle_front");
      const profile = ANGLE_TEMPLATES.find(t => t.id === "angle_profile");
      const threeQuarter = ANGLE_TEMPLATES.find(t => t.id === "angle_three_quarter");
      
      expect(front).toBeDefined();
      expect(profile).toBeDefined();
      expect(threeQuarter).toBeDefined();
    });
  });

  describe("Emotion Templates", () => {
    it("should have at least 5 emotion templates", () => {
      expect(EMOTION_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it("should include common emotions", () => {
      const emotionIds = EMOTION_TEMPLATES.map(t => t.id);
      expect(emotionIds).toContain("emotion_happy");
      expect(emotionIds).toContain("emotion_sad");
      expect(emotionIds).toContain("emotion_confident");
    });
  });

  describe("Outfit Templates", () => {
    it("should have at least 5 outfit templates", () => {
      expect(OUTFIT_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it("should include casual and formal outfits", () => {
      const outfitIds = OUTFIT_TEMPLATES.map(t => t.id);
      expect(outfitIds).toContain("outfit_casual");
      expect(outfitIds).toContain("outfit_formal");
    });
  });

  describe("Scene Templates", () => {
    it("should have at least 5 scene templates", () => {
      expect(SCENE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it("should include popular scenes", () => {
      const sceneIds = SCENE_TEMPLATES.map(t => t.id);
      expect(sceneIds).toContain("scene_cafe");
      expect(sceneIds).toContain("scene_beach_sunset");
    });
  });

  describe("Character Sheet Templates", () => {
    it("should have angle reference sheet", () => {
      const angleSheet = CHARACTER_SHEET_TEMPLATES.find(t => t.id === "sheet_angles");
      expect(angleSheet).toBeDefined();
      expect(angleSheet?.prompt).toContain("front view");
    });

    it("should have emotion reference sheet", () => {
      const emotionSheet = CHARACTER_SHEET_TEMPLATES.find(t => t.id === "sheet_emotions");
      expect(emotionSheet).toBeDefined();
    });
  });

  describe("buildPromptFromTemplate", () => {
    it("should replace all placeholder tokens", () => {
      const template = PORTRAIT_TEMPLATES[0];
      const result = buildPromptFromTemplate(template, {
        gender: "female",
        ethnicity: "Asian",
        age: 28,
        hairStyle: "long wavy",
        hairColor: "black",
        eyeColor: "brown",
        skinTone: "fair",
        bodyType: "slim",
      });

      expect(result).not.toContain("{{");
      expect(result).not.toContain("}}");
      expect(result).toContain("female");
      expect(result).toContain("Asian");
      expect(result).toContain("28");
      expect(result).toContain("long wavy");
      expect(result).toContain("black");
    });

    it("should use default values when not provided", () => {
      const template = PORTRAIT_TEMPLATES[0];
      const result = buildPromptFromTemplate(template, {});

      expect(result).not.toContain("{{");
      expect(result).toContain("female"); // default
      expect(result).toContain("European"); // default
      expect(result).toContain("25"); // default age
    });

    it("should handle outfit placeholders", () => {
      const sceneTemplate = SCENE_TEMPLATES.find(t => t.id === "scene_cafe");
      if (sceneTemplate) {
        const result = buildPromptFromTemplate(sceneTemplate, {
          outfit: "red dress",
          outfitColor: "red",
        });

        expect(result).toContain("red dress");
      }
    });

    it("should handle custom description", () => {
      const template = PORTRAIT_TEMPLATES[0];
      const result = buildPromptFromTemplate(template, {
        customDescription: "stunning supermodel with unique features",
      });

      expect(result).toContain("stunning supermodel with unique features");
    });
  });

  describe("getTemplatesByCategory", () => {
    it("should return only templates of specified category", () => {
      const portraits = getTemplatesByCategory("portrait");
      portraits.forEach(t => {
        expect(t.category).toBe("portrait");
      });
    });

    it("should return empty array for invalid category", () => {
      const result = getTemplatesByCategory("invalid" as PromptCategory);
      expect(result).toEqual([]);
    });

    it("should return all portrait templates", () => {
      const portraits = getTemplatesByCategory("portrait");
      expect(portraits.length).toBe(PORTRAIT_TEMPLATES.length);
    });
  });

  describe("getTemplateById", () => {
    it("should return template by ID", () => {
      const template = getTemplateById("portrait_base");
      expect(template).toBeDefined();
      expect(template?.id).toBe("portrait_base");
    });

    it("should return undefined for invalid ID", () => {
      const template = getTemplateById("invalid_id");
      expect(template).toBeUndefined();
    });
  });

  describe("searchTemplates", () => {
    it("should find templates by name", () => {
      const results = searchTemplates("glamour");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.name.toLowerCase().includes("glamour"))).toBe(true);
    });

    it("should find templates by tag", () => {
      const results = searchTemplates("beach");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = searchTemplates("xyznonexistent123");
      expect(results).toEqual([]);
    });

    it("should be case insensitive", () => {
      const results1 = searchTemplates("PORTRAIT");
      const results2 = searchTemplates("portrait");
      expect(results1.length).toBe(results2.length);
    });
  });

  describe("Aspect Ratio Options", () => {
    it("should have all common aspect ratios", () => {
      const ratios = ASPECT_RATIO_OPTIONS.map(ar => ar.value);
      expect(ratios).toContain("1:1");
      expect(ratios).toContain("4:3");
      expect(ratios).toContain("16:9");
      expect(ratios).toContain("9:16");
    });

    it("should have descriptions for all ratios", () => {
      ASPECT_RATIO_OPTIONS.forEach(ar => {
        expect(ar.description).toBeDefined();
        expect(ar.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Template Quality", () => {
    it("should have prompts ending with quality indicators", () => {
      ALL_TEMPLATES.forEach(template => {
        const hasQuality = template.prompt.includes("8k") || 
                          template.prompt.includes("4k") || 
                          template.prompt.includes("photorealistic");
        expect(hasQuality).toBe(true);
      });
    });

    it("should have professional photography terms", () => {
      const professionalTerms = ["photorealistic", "professional", "photography", "studio"];
      ALL_TEMPLATES.forEach(template => {
        const hasProfessionalTerm = professionalTerms.some(term => 
          template.prompt.toLowerCase().includes(term)
        );
        expect(hasProfessionalTerm).toBe(true);
      });
    });
  });
});
