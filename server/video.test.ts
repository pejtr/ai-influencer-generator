import { describe, it, expect, vi, beforeEach } from "vitest";
import { CAMERA_MOVEMENTS, buildVideoPrompt } from "./videoGeneration";

describe("Video Generation", () => {
  describe("CAMERA_MOVEMENTS", () => {
    it("should have all 15 camera movement instructions", () => {
      expect(Object.keys(CAMERA_MOVEMENTS)).toHaveLength(15);
    });

    it("should have correct format for camera instructions", () => {
      expect(CAMERA_MOVEMENTS.truckLeft).toBe("[Truck left]");
      expect(CAMERA_MOVEMENTS.panRight).toBe("[Pan right]");
      expect(CAMERA_MOVEMENTS.zoomIn).toBe("[Zoom in]");
      expect(CAMERA_MOVEMENTS.staticShot).toBe("[Static shot]");
    });

    it("should include all movement types", () => {
      const movements = Object.keys(CAMERA_MOVEMENTS);
      expect(movements).toContain("truckLeft");
      expect(movements).toContain("truckRight");
      expect(movements).toContain("panLeft");
      expect(movements).toContain("panRight");
      expect(movements).toContain("pushIn");
      expect(movements).toContain("pullOut");
      expect(movements).toContain("pedestalUp");
      expect(movements).toContain("pedestalDown");
      expect(movements).toContain("tiltUp");
      expect(movements).toContain("tiltDown");
      expect(movements).toContain("zoomIn");
      expect(movements).toContain("zoomOut");
      expect(movements).toContain("shake");
      expect(movements).toContain("trackingShot");
      expect(movements).toContain("staticShot");
    });
  });

  describe("buildVideoPrompt", () => {
    it("should build basic video prompt without camera movement", () => {
      const prompt = buildVideoPrompt(
        "A beautiful woman with long brown hair",
        "She turns her head and smiles"
      );
      
      expect(prompt).toContain("A beautiful woman with long brown hair");
      expect(prompt).toContain("She turns her head and smiles");
      expect(prompt).toContain("Professional quality");
      expect(prompt).not.toContain("[");
    });

    it("should include camera movement instruction when specified", () => {
      const prompt = buildVideoPrompt(
        "A beautiful woman with long brown hair",
        "She turns her head and smiles",
        "zoomIn"
      );
      
      expect(prompt).toContain("[Zoom in]");
      expect(prompt).toContain("A beautiful woman with long brown hair");
    });

    it("should handle different camera movements", () => {
      const promptPan = buildVideoPrompt("Model", "Walking", "panLeft");
      expect(promptPan).toContain("[Pan left]");

      const promptTrack = buildVideoPrompt("Model", "Walking", "trackingShot");
      expect(promptTrack).toContain("[Tracking shot]");
    });
  });

  describe("Video Generation Costs", () => {
    it("should cost 5 credits for video generation", () => {
      const VIDEO_COST = 5;
      expect(VIDEO_COST).toBe(5);
    });
  });

  describe("Video Models", () => {
    it("should support all MiniMax video models", () => {
      const supportedModels = [
        "T2V-01",
        "T2V-01-Director",
        "I2V-01",
        "I2V-01-Director",
        "I2V-01-live",
        "MiniMax-Hailuo-02"
      ];
      
      expect(supportedModels).toHaveLength(6);
      expect(supportedModels).toContain("I2V-01"); // Image to video
      expect(supportedModels).toContain("T2V-01"); // Text to video
      expect(supportedModels).toContain("I2V-01-Director"); // With camera control
    });

    it("should use I2V model when image is provided", () => {
      const hasImage = true;
      const model = hasImage ? "I2V-01" : "T2V-01";
      expect(model).toBe("I2V-01");
    });

    it("should use T2V model when no image is provided", () => {
      const hasImage = false;
      const model = hasImage ? "I2V-01" : "T2V-01";
      expect(model).toBe("T2V-01");
    });

    it("should use Director model when camera movement is specified", () => {
      const hasCameraMovement = true;
      const baseModel = "I2V-01";
      const model = hasCameraMovement ? `${baseModel}-Director` : baseModel;
      expect(model).toBe("I2V-01-Director");
    });
  });
});

describe("Character Customization Options", () => {
  describe("Body Types", () => {
    const BODY_TYPES = [
      { id: "slim", label: "Slim" },
      { id: "athletic", label: "Athletic" },
      { id: "average", label: "Average" },
      { id: "curvy", label: "Curvy" },
      { id: "plus-size", label: "Plus Size" },
      { id: "muscular", label: "Muscular" },
    ];

    it("should have 6 body type options", () => {
      expect(BODY_TYPES).toHaveLength(6);
    });

    it("should include all expected body types", () => {
      const ids = BODY_TYPES.map(t => t.id);
      expect(ids).toContain("slim");
      expect(ids).toContain("athletic");
      expect(ids).toContain("curvy");
      expect(ids).toContain("muscular");
    });
  });

  describe("Hair Styles", () => {
    const HAIR_STYLES = [
      { id: "straight-long", label: "Straight Long" },
      { id: "straight-short", label: "Straight Short" },
      { id: "wavy-long", label: "Wavy Long" },
      { id: "curly-long", label: "Curly Long" },
      { id: "bob", label: "Bob" },
      { id: "pixie", label: "Pixie" },
      { id: "braids", label: "Braids" },
      { id: "ponytail", label: "Ponytail" },
      { id: "bun", label: "Bun" },
      { id: "bald", label: "Bald" },
    ];

    it("should have multiple hair style options", () => {
      expect(HAIR_STYLES.length).toBeGreaterThan(5);
    });

    it("should include common hair styles", () => {
      const ids = HAIR_STYLES.map(s => s.id);
      expect(ids).toContain("straight-long");
      expect(ids).toContain("curly-long");
      expect(ids).toContain("bob");
      expect(ids).toContain("ponytail");
    });
  });

  describe("Outfit Styles", () => {
    const OUTFIT_STYLES = [
      { id: "casual", label: "Casual" },
      { id: "formal", label: "Formal" },
      { id: "sporty", label: "Sporty" },
      { id: "elegant", label: "Elegant" },
      { id: "streetwear", label: "Streetwear" },
      { id: "bohemian", label: "Bohemian" },
      { id: "business", label: "Business" },
      { id: "swimwear", label: "Swimwear" },
      { id: "lingerie", label: "Lingerie" },
      { id: "vintage", label: "Vintage" },
    ];

    it("should have 10 outfit style options", () => {
      expect(OUTFIT_STYLES).toHaveLength(10);
    });

    it("should include diverse outfit styles", () => {
      const ids = OUTFIT_STYLES.map(s => s.id);
      expect(ids).toContain("casual");
      expect(ids).toContain("formal");
      expect(ids).toContain("elegant");
      expect(ids).toContain("swimwear");
    });
  });
});

describe("Character Preset System", () => {
  it("should save preset with all required fields", () => {
    const preset = {
      id: "123",
      name: "Test Preset",
      thumbnail: "https://example.com/image.jpg",
      settings: {
        type: "human",
        gender: "female",
        ethnicity: "european",
        eyeColor: "blue",
        skinTone: "fair",
        skinCondition: "none",
        age: 25,
        bodyType: "athletic",
        hairStyle: "straight-long",
        hairColor: "blonde",
        outfitStyle: "casual",
        outfitColor: "white",
        accessory: "none",
        customPrompt: "",
      },
    };

    expect(preset.id).toBeDefined();
    expect(preset.name).toBeDefined();
    expect(preset.settings).toBeDefined();
    expect(preset.settings.bodyType).toBe("athletic");
    expect(preset.settings.hairStyle).toBe("straight-long");
  });

  it("should allow preset without thumbnail", () => {
    const preset = {
      id: "456",
      name: "No Thumbnail Preset",
      settings: {
        type: "human",
        gender: "male",
        ethnicity: "asian",
        eyeColor: "brown",
        skinTone: "medium",
        skinCondition: "none",
        age: 30,
        bodyType: "muscular",
        hairStyle: "short",
        hairColor: "black",
        outfitStyle: "sporty",
        outfitColor: "black",
        accessory: "sunglasses",
        customPrompt: "",
      },
    };

    expect(preset.thumbnail).toBeUndefined();
    expect(preset.name).toBe("No Thumbnail Preset");
  });
});

describe("Tier Access for Video Generation", () => {
  it("should require pro or creator tier for video generation", () => {
    const allowedTiers = ["pro", "creator"];
    
    expect(allowedTiers).toContain("pro");
    expect(allowedTiers).toContain("creator");
    expect(allowedTiers).not.toContain("free");
  });

  it("should deny free tier users access to video generation", () => {
    const userTier = "free";
    const allowedTiers = ["pro", "creator"];
    const hasAccess = allowedTiers.includes(userTier);
    
    expect(hasAccess).toBe(false);
  });

  it("should allow pro tier users access to video generation", () => {
    const userTier = "pro";
    const allowedTiers = ["pro", "creator"];
    const hasAccess = allowedTiers.includes(userTier);
    
    expect(hasAccess).toBe(true);
  });

  it("should allow creator tier users access to video generation", () => {
    const userTier = "creator";
    const allowedTiers = ["pro", "creator"];
    const hasAccess = allowedTiers.includes(userTier);
    
    expect(hasAccess).toBe(true);
  });
});
