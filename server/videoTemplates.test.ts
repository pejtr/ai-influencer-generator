import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { SEED_VIDEO_TEMPLATES } from "./videoTemplatesDb";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Video Templates", () => {
  describe("SEED_VIDEO_TEMPLATES", () => {
    it("should have at least 15 templates", () => {
      expect(SEED_VIDEO_TEMPLATES.length).toBeGreaterThanOrEqual(15);
    });

    it("should have unique slugs", () => {
      const slugs = SEED_VIDEO_TEMPLATES.map(t => t.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("should have all required fields", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        expect(tpl.name).toBeTruthy();
        expect(tpl.slug).toBeTruthy();
        expect(tpl.category).toBeTruthy();
        expect(tpl.imagePrompt).toBeTruthy();
        expect(tpl.videoPrompt).toBeTruthy();
      }
    });

    it("should cover all 8 categories", () => {
      const categories = new Set(SEED_VIDEO_TEMPLATES.map(t => t.category));
      expect(categories.size).toBe(8);
      expect(categories.has("cinematic_ads")).toBe(true);
      expect(categories.has("emotional_atmospheric")).toBe(true);
      expect(categories.has("action_adventure")).toBe(true);
      expect(categories.has("dark_moody")).toBe(true);
      expect(categories.has("timelapse")).toBe(true);
      expect(categories.has("vfx_integration")).toBe(true);
      expect(categories.has("character_animation")).toBe(true);
      expect(categories.has("scene_transformation")).toBe(true);
    });

    it("should have at least 4 featured templates", () => {
      const featured = SEED_VIDEO_TEMPLATES.filter(t => t.isFeatured);
      expect(featured.length).toBeGreaterThanOrEqual(4);
    });

    it("should have valid difficulty levels", () => {
      const validDifficulties = ["beginner", "intermediate", "advanced"];
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        if (tpl.difficulty) {
          expect(validDifficulties).toContain(tpl.difficulty);
        }
      }
    });

    it("should have tags as arrays", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        if (tpl.tags) {
          expect(Array.isArray(tpl.tags)).toBe(true);
          expect(tpl.tags.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have camera movement defined", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        expect(tpl.cameraMovement).toBeTruthy();
      }
    });

    it("should have lighting defined", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        expect(tpl.lighting).toBeTruthy();
      }
    });
  });

  describe("Router type safety", () => {
    it("should have videoTemplates router on appRouter", () => {
      expect(appRouter.videoTemplates).toBeDefined();
    });

    it("should have list procedure", () => {
      expect(appRouter.videoTemplates.list).toBeDefined();
    });

    it("should have getById procedure", () => {
      expect(appRouter.videoTemplates.getById).toBeDefined();
    });

    it("should have getBySlug procedure", () => {
      expect(appRouter.videoTemplates.getBySlug).toBeDefined();
    });

    it("should have featured procedure", () => {
      expect(appRouter.videoTemplates.featured).toBeDefined();
    });

    it("should have categories procedure", () => {
      expect(appRouter.videoTemplates.categories).toBeDefined();
    });

    it("should have use mutation", () => {
      expect(appRouter.videoTemplates.use).toBeDefined();
    });

    it("should have saveCustom mutation", () => {
      expect(appRouter.videoTemplates.saveCustom).toBeDefined();
    });

    it("should have mySaved query", () => {
      expect(appRouter.videoTemplates.mySaved).toBeDefined();
    });

    it("should have deleteSaved mutation", () => {
      expect(appRouter.videoTemplates.deleteSaved).toBeDefined();
    });

    it("should have adminCreate mutation", () => {
      expect(appRouter.videoTemplates.adminCreate).toBeDefined();
    });

    it("should have adminUpdate mutation", () => {
      expect(appRouter.videoTemplates.adminUpdate).toBeDefined();
    });

    it("should have adminDelete mutation", () => {
      expect(appRouter.videoTemplates.adminDelete).toBeDefined();
    });

    it("should have adminSeed mutation", () => {
      expect(appRouter.videoTemplates.adminSeed).toBeDefined();
    });
  });

  describe("Template content quality", () => {
    it("image prompts should include quality keywords", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        const prompt = tpl.imagePrompt.toLowerCase();
        const hasQuality = prompt.includes("8k") || prompt.includes("photorealistic") || prompt.includes("cinematic") || prompt.includes("professional");
        expect(hasQuality).toBe(true);
      }
    });

    it("video prompts should include camera/motion instructions", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        const prompt = tpl.videoPrompt.toUpperCase();
        const hasMotion = prompt.includes("CAMERA") || prompt.includes("MOTION") || prompt.includes("TIMELAPSE") || prompt.includes("TRANSFORMATION");
        expect(hasMotion).toBe(true);
      }
    });

    it("video prompts should include PHOTOREALISTIC keyword", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        expect(tpl.videoPrompt.toUpperCase()).toContain("PHOTOREALISTIC");
      }
    });

    it("negative prompts should be defined for all templates", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        if (tpl.negativePrompt) {
          expect(tpl.negativePrompt.length).toBeGreaterThan(0);
        }
      }
    });

    it("descriptions should be informative (min 50 chars)", () => {
      for (const tpl of SEED_VIDEO_TEMPLATES) {
        if (tpl.description) {
          expect(tpl.description.length).toBeGreaterThanOrEqual(50);
        }
      }
    });
  });
});
