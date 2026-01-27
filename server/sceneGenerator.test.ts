import { describe, it, expect } from "vitest";
import {
  SHOT_TYPES,
  ACTION_POSES,
  STORYBOARD_LAYOUTS,
  SCENE_SEQUENCES,
  generateScenePrompts,
  generateCustomStoryboard,
  buildStoryboardPrompt,
  CONSISTENCY_MODIFIERS,
} from "../shared/sceneGenerator";

describe("Scene Generator System", () => {
  describe("Shot Types", () => {
    it("should have valid shot types", () => {
      expect(SHOT_TYPES.length).toBeGreaterThan(0);
      
      SHOT_TYPES.forEach((shot) => {
        expect(shot.id).toBeTruthy();
        expect(shot.name).toBeTruthy();
        expect(shot.description).toBeTruthy();
        expect(shot.cameraAngle).toBeTruthy();
        expect(shot.framing).toBeTruthy();
        expect(shot.promptModifier).toBeTruthy();
      });
    });

    it("should include essential shot types", () => {
      const ids = SHOT_TYPES.map(s => s.id);
      expect(ids).toContain("wide_establishing");
      expect(ids).toContain("full_body");
      expect(ids).toContain("medium");
      expect(ids).toContain("close_up");
      expect(ids).toContain("profile_left");
      expect(ids).toContain("three_quarter_right");
    });
  });

  describe("Action Poses", () => {
    it("should have valid action poses", () => {
      expect(ACTION_POSES.length).toBeGreaterThan(0);
      
      ACTION_POSES.forEach((action) => {
        expect(action.id).toBeTruthy();
        expect(action.name).toBeTruthy();
        expect(action.description).toBeTruthy();
        expect(action.bodyPosition).toBeTruthy();
        expect(action.hands).toBeTruthy();
        expect(action.expression).toBeTruthy();
        expect(action.promptModifier).toBeTruthy();
      });
    });

    it("should include common poses", () => {
      const ids = ACTION_POSES.map(a => a.id);
      expect(ids).toContain("standing_neutral");
      expect(ids).toContain("standing_confident");
      expect(ids).toContain("walking_forward");
      expect(ids).toContain("sitting_relaxed");
    });
  });

  describe("Storyboard Layouts", () => {
    it("should have valid layouts", () => {
      expect(STORYBOARD_LAYOUTS.length).toBeGreaterThan(0);
      
      STORYBOARD_LAYOUTS.forEach((layout) => {
        expect(layout.id).toBeTruthy();
        expect(layout.name).toBeTruthy();
        expect(layout.rows).toBeGreaterThan(0);
        expect(layout.cols).toBeGreaterThan(0);
        expect(layout.totalShots).toBe(layout.rows * layout.cols);
      });
    });

    it("should include common grid sizes", () => {
      const ids = STORYBOARD_LAYOUTS.map(l => l.id);
      expect(ids).toContain("2x2");
      expect(ids).toContain("3x3");
    });
  });

  describe("Scene Sequences", () => {
    it("should have valid sequences", () => {
      expect(SCENE_SEQUENCES.length).toBeGreaterThan(0);
      
      SCENE_SEQUENCES.forEach((sequence) => {
        expect(sequence.id).toBeTruthy();
        expect(sequence.name).toBeTruthy();
        expect(sequence.description).toBeTruthy();
        expect(sequence.shots.length).toBeGreaterThan(0);
        
        // All shot IDs should be valid
        sequence.shots.forEach((shotId) => {
          const shot = SHOT_TYPES.find(s => s.id === shotId);
          expect(shot).toBeDefined();
        });
      });
    });

    it("should include common sequences", () => {
      const ids = SCENE_SEQUENCES.map(s => s.id);
      expect(ids).toContain("intro_sequence");
      expect(ids).toContain("portrait_series");
      expect(ids).toContain("emotional_arc");
    });
  });

  describe("generateScenePrompts", () => {
    it("should generate prompts for a sequence", () => {
      const basePrompt = "beautiful woman, 25 years old";
      const sequence = SCENE_SEQUENCES.find(s => s.id === "intro_sequence")!;
      
      const result = generateScenePrompts(basePrompt, sequence);
      
      expect(result.length).toBe(sequence.shots.length);
      result.forEach((item) => {
        expect(item.shotId).toBeTruthy();
        expect(item.prompt).toContain(basePrompt);
      });
    });

    it("should include action pose in prompts", () => {
      const basePrompt = "handsome man";
      const sequence = SCENE_SEQUENCES[0];
      
      const result = generateScenePrompts(basePrompt, sequence, "standing_confident");
      
      result.forEach((item) => {
        expect(item.prompt).toContain("confident");
      });
    });
  });

  describe("generateCustomStoryboard", () => {
    it("should generate prompts for custom shots", () => {
      const basePrompt = "elegant woman in red dress";
      const selectedShots = ["close_up", "medium", "full_body"];
      const selectedActions = ["standing_neutral", "standing_confident", "walking_forward"];
      
      const result = generateCustomStoryboard(basePrompt, selectedShots, selectedActions);
      
      expect(result.length).toBe(selectedShots.length);
      
      result.forEach((item, index) => {
        expect(item.shotId).toBe(selectedShots[index]);
        expect(item.actionId).toBe(selectedActions[index]);
        expect(item.prompt).toContain(basePrompt);
      });
    });

    it("should use default action when not specified", () => {
      const basePrompt = "test character";
      const selectedShots = ["close_up", "medium"];
      const selectedActions: string[] = [];
      
      const result = generateCustomStoryboard(basePrompt, selectedShots, selectedActions);
      
      expect(result.length).toBe(2);
      result.forEach((item) => {
        expect(item.actionId).toBe("standing_neutral");
      });
    });
  });

  describe("buildStoryboardPrompt", () => {
    it("should build complete prompt with shot and action", () => {
      const basePrompt = "young woman with blonde hair";
      const shot = SHOT_TYPES.find(s => s.id === "close_up")!;
      const action = ACTION_POSES.find(a => a.id === "standing_neutral")!;
      
      const result = buildStoryboardPrompt(basePrompt, shot, action, true);
      
      expect(result).toContain(basePrompt);
      expect(result).toContain(shot.promptModifier);
      expect(result).toContain(action.promptModifier);
      expect(result).toContain(CONSISTENCY_MODIFIERS.sameCharacter);
    });

    it("should exclude consistency modifier when disabled", () => {
      const basePrompt = "test";
      const shot = SHOT_TYPES[0];
      const action = ACTION_POSES[0];
      
      const result = buildStoryboardPrompt(basePrompt, shot, action, false);
      
      expect(result).not.toContain(CONSISTENCY_MODIFIERS.sameCharacter);
    });
  });

  describe("Consistency Modifiers", () => {
    it("should have all required consistency modifiers", () => {
      expect(CONSISTENCY_MODIFIERS.sameCharacter).toBeTruthy();
      expect(CONSISTENCY_MODIFIERS.sameLighting).toBeTruthy();
      expect(CONSISTENCY_MODIFIERS.sameStyle).toBeTruthy();
      expect(CONSISTENCY_MODIFIERS.sameQuality).toBeTruthy();
    });
  });
});
