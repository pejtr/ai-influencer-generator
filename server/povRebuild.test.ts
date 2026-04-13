/**
 * POV Rebuild Router Tests
 */
import { describe, it, expect } from "vitest";
import { POV_CHARACTERS, EMOTIONS, VIDEO_MODELS } from "./povRebuildRouter";

describe("POV Rebuild — static data", () => {
  it("should have at least 6 characters", () => {
    expect(POV_CHARACTERS.length).toBeGreaterThanOrEqual(6);
  });

  it("should include protagonist, antagonist, bystander, and custom", () => {
    const ids = POV_CHARACTERS.map((c) => c.id);
    expect(ids).toContain("protagonist");
    expect(ids).toContain("antagonist");
    expect(ids).toContain("bystander");
    expect(ids).toContain("custom");
  });

  it("each character should have id, label, description, cameraStyle, and icon", () => {
    for (const char of POV_CHARACTERS) {
      expect(char.id).toBeTruthy();
      expect(char.label).toBeTruthy();
      expect(char.description).toBeTruthy();
      expect(char.cameraStyle).toBeTruthy();
      expect(char.icon).toBeTruthy();
    }
  });

  it("should have at least 6 emotions", () => {
    expect(EMOTIONS.length).toBeGreaterThanOrEqual(6);
  });

  it("should include key emotions: fear, excitement, determination, awe", () => {
    const ids = EMOTIONS.map((e) => e.id);
    expect(ids).toContain("fear");
    expect(ids).toContain("excitement");
    expect(ids).toContain("determination");
    expect(ids).toContain("awe");
  });

  it("each emotion should have id, label, color, and description", () => {
    for (const em of EMOTIONS) {
      expect(em.id).toBeTruthy();
      expect(em.label).toBeTruthy();
      expect(em.color).toBeTruthy();
      expect(em.description).toBeTruthy();
    }
  });

  it("should have at least 4 video models", () => {
    expect(VIDEO_MODELS.length).toBeGreaterThanOrEqual(4);
  });

  it("should include higgsfield, kling, veo3, and seedance", () => {
    const ids = VIDEO_MODELS.map((m) => m.id);
    expect(ids).toContain("higgsfield");
    expect(ids).toContain("kling");
    expect(ids).toContain("veo3");
    expect(ids).toContain("seedance");
  });

  it("each video model should have id, label, and promptStyle", () => {
    for (const model of VIDEO_MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.label).toBeTruthy();
      expect(model.promptStyle).toBeTruthy();
    }
  });
});

describe("POV Rebuild — character data integrity", () => {
  it("custom character should have adaptive camera style", () => {
    const custom = POV_CHARACTERS.find((c) => c.id === "custom");
    expect(custom).toBeDefined();
    expect(custom?.cameraStyle).toContain("adaptive");
  });

  it("protagonist should have forward-focused camera style", () => {
    const protagonist = POV_CHARACTERS.find((c) => c.id === "protagonist");
    expect(protagonist).toBeDefined();
    expect(protagonist?.cameraStyle.toLowerCase()).toMatch(/track|forward|eye/);
  });

  it("all character IDs should be unique", () => {
    const ids = POV_CHARACTERS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all emotion IDs should be unique", () => {
    const ids = EMOTIONS.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all video model IDs should be unique", () => {
    const ids = VIDEO_MODELS.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("POV Rebuild — emotion color mapping", () => {
  it("fear should be blue", () => {
    const fear = EMOTIONS.find((e) => e.id === "fear");
    expect(fear?.color).toBe("blue");
  });

  it("excitement should be yellow", () => {
    const excitement = EMOTIONS.find((e) => e.id === "excitement");
    expect(excitement?.color).toBe("yellow");
  });

  it("determination should be red", () => {
    const determination = EMOTIONS.find((e) => e.id === "determination");
    expect(determination?.color).toBe("red");
  });

  it("calm should be green", () => {
    const calm = EMOTIONS.find((e) => e.id === "calm");
    expect(calm?.color).toBe("green");
  });
});
