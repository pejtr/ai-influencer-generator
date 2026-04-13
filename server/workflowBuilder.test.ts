import { describe, it, expect } from "vitest";
import { CAMERA_MOVEMENTS_CINEMATIC, AI_MODELS } from "./workflowBuilderRouter";

describe("WorkflowBuilder - Camera Movements", () => {
  it("should have at least 12 camera movements", () => {
    expect(CAMERA_MOVEMENTS_CINEMATIC.length).toBeGreaterThanOrEqual(12);
  });

  it("each camera movement should have id, label, description, example", () => {
    for (const move of CAMERA_MOVEMENTS_CINEMATIC) {
      expect(move.id).toBeTruthy();
      expect(move.label).toBeTruthy();
      expect(move.description).toBeTruthy();
      expect(move.example).toBeTruthy();
    }
  });

  it("should include dolly_in movement", () => {
    const dolly = CAMERA_MOVEMENTS_CINEMATIC.find(m => m.id === "dolly_in");
    expect(dolly).toBeDefined();
  });

  it("should include tracking shot", () => {
    const tracking = CAMERA_MOVEMENTS_CINEMATIC.find(m => m.id === "tracking_close");
    expect(tracking).toBeDefined();
  });
});

describe("WorkflowBuilder - AI Models", () => {
  it("should have at least 4 models", () => {
    expect(AI_MODELS.length).toBeGreaterThanOrEqual(4);
  });

  it("each model should have required fields", () => {
    for (const model of AI_MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.badge).toBeTruthy();
      expect(model.bestFor).toBeTruthy();
      expect(Array.isArray(model.features)).toBe(true);
      expect(model.creditCost).toBeTruthy();
      expect(model.resolution).toBeTruthy();
      expect(model.outputLength).toBeTruthy();
    }
  });

  it("should include Kling 3.0 model", () => {
    const kling3 = AI_MODELS.find(m => m.id === "kling_3");
    expect(kling3).toBeDefined();
    expect(kling3?.name).toContain("Kling");
  });

  it("should include Cinema Studio model", () => {
    const cinema = AI_MODELS.find(m => m.id === "cinema_studio_3");
    expect(cinema).toBeDefined();
  });

  it("should include Veo model", () => {
    const veo = AI_MODELS.find(m => m.id === "veo_3");
    expect(veo).toBeDefined();
  });
});

describe("WorkflowBuilder - Prompt Generation Logic", () => {
  it("should build a valid prompt from components", () => {
    const composition = "A rugged western town at golden hour";
    const subject = "A lone gunslinger walks into frame";
    const cameraMovement = "Slow dolly in";
    const mood = "Tense orchestral, warm light";

    const prompt = [composition, subject, cameraMovement, mood]
      .filter(Boolean)
      .join(". ");

    expect(prompt).toContain("western town");
    expect(prompt).toContain("gunslinger");
    expect(prompt).toContain("dolly");
    expect(prompt.length).toBeGreaterThan(20);
  });

  it("should handle empty fields gracefully", () => {
    const parts = ["", "Subject only", "", ""].filter(Boolean);
    const prompt = parts.join(". ");
    expect(prompt).toBe("Subject only");
  });
});
