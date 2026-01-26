import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  getUserById, updateUserCredits, deductUserCredits, 
  createGeneration, updateGeneration, getUserGenerations, deleteGeneration,
  getGenerationById, createCreditTransaction, getUserCreditTransactions,
  createAffiliate, getAffiliateByUserId, getAffiliateByCode, getAffiliateCommissions,
  getAdminMetrics, getAllUsers, getUserCount, getGenerationCount,
  TIER_CREDITS, TIER_PRICES, CREDIT_PACKS
} from "./db";
import { generateInfluencerImage, buildPromptFromSettings } from "./imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Character settings schema
const characterSettingsSchema = z.object({
  type: z.string(),
  gender: z.string(),
  ethnicity: z.string(),
  eyeColor: z.string(),
  skinTone: z.string(),
  skinCondition: z.string(),
  age: z.number(),
  customPrompt: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Credits management
  credits: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return {
        credits: user?.credits ?? 0,
        tier: user?.tier ?? "free",
        monthlyCreditsUsed: user?.monthlyCreditsUsed ?? 0,
      };
    }),

    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      return getUserCreditTransactions(ctx.user.id, 50);
    }),

    getPricing: publicProcedure.query(() => {
      return {
        tiers: {
          free: { credits: TIER_CREDITS.free, price: 0, features: ["5 credits/month", "Watermark on images", "Basic support"] },
          starter: { credits: TIER_CREDITS.starter, price: TIER_PRICES.starter, features: ["50 credits/month", "No watermark", "HD downloads", "Email support"] },
          pro: { credits: TIER_CREDITS.pro, price: TIER_PRICES.pro, features: ["300 credits/month", "No watermark", "HD downloads", "Priority support", "Commercial license"] },
          business: { credits: TIER_CREDITS.business, price: TIER_PRICES.business, features: ["1000 credits/month", "No watermark", "HD downloads", "Dedicated support", "API access", "White-label option"] },
        },
        creditPacks: CREDIT_PACKS,
      };
    }),
  }),

  // Image generation
  generation: router({
    create: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10).max(2000),
        characterSettings: characterSettingsSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        if (user.credits < 1) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Not enough credits. Please upgrade your plan or purchase more credits." 
          });
        }

        // Create generation record
        const generationId = await createGeneration({
          userId: ctx.user.id,
          prompt: input.prompt,
          characterSettings: input.characterSettings,
          imageUrl: "",
          hasWatermark: user.tier === "free",
          status: "pending",
        });

        if (!generationId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create generation" });
        }

        try {
          // Generate image using MiniMax via MCP
          const result = await generateInfluencerImage({
            prompt: input.prompt,
            aspectRatio: "3:4",
            addWatermark: user.tier === "free",
          });

          const permanentUrl = result.imageUrl;

          // Deduct credit
          await deductUserCredits(ctx.user.id, 1);

          // Log transaction
          await createCreditTransaction({
            userId: ctx.user.id,
            amount: -1,
            type: "generation",
            description: "AI influencer generation",
            balanceAfter: user.credits - 1,
            relatedId: generationId,
          });

          // Update generation with image URL
          await updateGeneration(generationId, {
            imageUrl: permanentUrl,
            status: "completed",
          });

          return {
            id: generationId,
            imageUrl: permanentUrl,
            hasWatermark: user.tier === "free",
          };
        } catch (error) {
          // Mark as failed
          await updateGeneration(generationId, { status: "failed" });
          console.error("Generation failed:", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to generate image. Please try again." 
          });
        }
      }),

    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        return getUserGenerations(ctx.user.id, limit, offset);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const generation = await getGenerationById(input.id);
        if (!generation || generation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        return generation;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteGeneration(input.id, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }
        return { success: true };
      }),
  }),

  // Affiliate program
  affiliate: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        return { isAffiliate: false, affiliate: null };
      }
      return { isAffiliate: true, affiliate };
    }),

    register: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getAffiliateByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already registered as affiliate" });
      }

      const affiliateCode = await createAffiliate(ctx.user.id);
      return { success: true, affiliateCode };
    }),

    getCommissions: protectedProcedure.query(async ({ ctx }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        return [];
      }
      return getAffiliateCommissions(affiliate.id, 50);
    }),

    validateCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const affiliate = await getAffiliateByCode(input.code);
        return { valid: !!affiliate };
      }),
  }),

  // Admin routes
  admin: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return getAdminMetrics();
    }),

    getUsers: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        const users = await getAllUsers(limit, offset);
        const total = await getUserCount();
        return { users, total };
      }),

    updateUserCredits: protectedProcedure
      .input(z.object({
        userId: z.number(),
        credits: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await updateUserCredits(input.userId, input.credits);
        return { success: true };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      
      const metrics = await getAdminMetrics();
      const userCount = await getUserCount();
      const genCount = await getGenerationCount();
      
      return {
        ...metrics,
        totalUsers: userCount,
        totalGenerations: genCount,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
