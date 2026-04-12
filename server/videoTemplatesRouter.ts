import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createVideoTemplate,
  getVideoTemplateById,
  getVideoTemplateBySlug,
  listVideoTemplates,
  updateVideoTemplate,
  deleteVideoTemplate,
  incrementTemplateUsage,
  getFeaturedTemplates,
  getTemplateCategories,
  saveUserTemplate,
  getUserTemplates,
  deleteUserTemplate,
  getUserTemplateById,
  SEED_VIDEO_TEMPLATES,
} from "./videoTemplatesDb";
import { generateImage } from "./_core/imageGeneration";

export const videoTemplatesRouter = router({
  // Public: list templates with filtering
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        difficulty: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listVideoTemplates(input || {});
    }),

  // Public: get single template by id
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await getVideoTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      return template;
    }),

  // Public: get single template by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const template = await getVideoTemplateBySlug(input.slug);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      return template;
    }),

  // Public: get featured templates
  featured: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getFeaturedTemplates(input?.limit || 6);
    }),

  // Public: get categories with counts
  categories: publicProcedure.query(async () => {
    return getTemplateCategories();
  }),

  // Protected: use a template (increment usage count)
  use: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const template = await getVideoTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      await incrementTemplateUsage(input.id);
      return template;
    }),

  // Protected: save customized template
  saveCustom: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        customImagePrompt: z.string().optional(),
        customVideoPrompt: z.string().optional(),
        customSettings: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await saveUserTemplate({
        userId: ctx.user.id,
        templateId: input.templateId,
        name: input.name,
        customImagePrompt: input.customImagePrompt,
        customVideoPrompt: input.customVideoPrompt,
        customSettings: input.customSettings,
      });
      return { id };
    }),

  // Protected: get user's saved templates (with original template data)
  mySaved: protectedProcedure.query(async ({ ctx }) => {
    return getUserTemplates(ctx.user.id);
  }),

  // Protected: get single saved template by id
  getSaved: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const saved = await getUserTemplateById(input.id, ctx.user.id);
      if (!saved) throw new TRPCError({ code: "NOT_FOUND", message: "Saved template not found" });
      // Also fetch original template
      const original = await getVideoTemplateById(saved.templateId);
      return { ...saved, originalTemplate: original };
    }),

  // Protected: update user's saved template
  updateSaved: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      customImagePrompt: z.string().optional(),
      customVideoPrompt: z.string().optional(),
      customSettings: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const saved = await getUserTemplateById(id, ctx.user.id);
      if (!saved) throw new TRPCError({ code: "NOT_FOUND", message: "Saved template not found" });
      const { updateUserTemplate } = await import("./videoTemplatesDb");
      await updateUserTemplate(id, ctx.user.id, data);
      return { success: true };
    }),

  // Protected: delete user's saved template
  deleteSaved: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteUserTemplate(input.id, ctx.user.id);
      return { success: true };
    }),

  // Admin: create template
  adminCreate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        category: z.enum([
          "cinematic_ads", "emotional_atmospheric", "action_adventure",
          "dark_moody", "timelapse", "vfx_integration",
          "character_animation", "scene_transformation",
        ]),
        imagePrompt: z.string(),
        videoPrompt: z.string(),
        negativePrompt: z.string().optional(),
        style: z.string().optional(),
        cameraMovement: z.string().optional(),
        lighting: z.string().optional(),
        aspectRatio: z.string().optional(),
        duration: z.number().optional(),
        imageModel: z.string().optional(),
        videoModel: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        tags: z.array(z.string()).optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const id = await createVideoTemplate({ ...input, createdBy: ctx.user.id });
      return { id };
    }),

  // Admin: update template
  adminUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          imagePrompt: z.string().optional(),
          videoPrompt: z.string().optional(),
          negativePrompt: z.string().optional(),
          style: z.string().optional(),
          cameraMovement: z.string().optional(),
          lighting: z.string().optional(),
          isFeatured: z.boolean().optional(),
          isActive: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      await updateVideoTemplate(input.id, input.data);
      return { success: true };
    }),

  // Admin: delete template
  adminDelete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      await deleteVideoTemplate(input.id);
      return { success: true };
    }),

  // Admin: generate thumbnail for a template
  adminGenerateThumbnail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const template = await getVideoTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      
      try {
        const { url } = await generateImage({ prompt: template.imagePrompt });
        if (url) {
          await updateVideoTemplate(input.id, { thumbnailUrl: url });
        }
        return { success: true, thumbnailUrl: url };
      } catch (e: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Failed to generate thumbnail" });
      }
    }),

  // Admin: bulk generate thumbnails for all templates without thumbnails
  adminBulkGenerateThumbnails: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const allTemplates = await listVideoTemplates({ limit: 100 });
    const noThumbnail = allTemplates.filter(t => !t.thumbnailUrl);
    let generated = 0;
    let failed = 0;
    
    for (const tpl of noThumbnail) {
      try {
        const { url } = await generateImage({ prompt: tpl.imagePrompt });
        if (url) {
          await updateVideoTemplate(tpl.id, { thumbnailUrl: url });
          generated++;
        }
      } catch {
        failed++;
      }
    }
    return { generated, failed, total: noThumbnail.length };
  }),

  // Admin: seed default templates
  adminSeed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    let count = 0;
    for (const tpl of SEED_VIDEO_TEMPLATES) {
      try {
        await createVideoTemplate({ ...tpl, createdBy: ctx.user.id });
        count++;
      } catch (e: any) {
        // Skip duplicates (unique slug constraint)
        if (e?.message?.includes("Duplicate")) continue;
        throw e;
      }
    }
    return { seeded: count, total: SEED_VIDEO_TEMPLATES.length };
  }),
});
