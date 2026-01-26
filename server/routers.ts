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
  TIER_CREDITS, TIER_PRICES, CREDIT_PACKS,
  updateUserStripeCustomerId,
  getAffiliateLeaderboard, getAffiliateNetworkStats
} from "./db";
import { 
  getOrCreateCustomer, 
  createSubscriptionCheckout, 
  createCreditPackCheckout,
  createBillingPortalSession,
  cancelSubscription,
  resumeSubscription
} from "./stripe/stripe";
import { TierName } from "./stripe/products";
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
          free: { id: "free", name: "Free", credits: 5, price: 0 },
          basic: { id: "basic", name: "BASIC", credits: 50, price: 9 },
          premium: { id: "premium", name: "PREMIUM", credits: 300, price: 29 },
          vip: { id: "vip", name: "VIP", credits: 1000, price: 99 },
        },
        creditPacks: [
          { id: "credits_100", credits: 100, price: 15 },
          { id: "credits_500", credits: 500, price: 60 },
          { id: "credits_1000", credits: 1000, price: 100 },
        ],
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

    getLeaderboard: publicProcedure.query(async () => {
      return getAffiliateLeaderboard(10);
    }),

    getNetworkStats: protectedProcedure.query(async ({ ctx }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        return {
          level1Count: 0,
          level2Count: 0,
          level3Count: 0,
          level1Earnings: 0,
          level2Earnings: 0,
          level3Earnings: 0,
        };
      }
      return getAffiliateNetworkStats(affiliate.id);
    }),
  }),

  // Stripe payments
  stripe: router({
    createSubscriptionCheckout: protectedProcedure
      .input(z.object({
        tier: z.enum(["basic", "premium", "vip"]),
        affiliateCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
          ctx.user.id,
          user.email || "",
          user.name,
          user.stripeCustomerId
        );

        // Save customer ID if new
        if (!user.stripeCustomerId) {
          await updateUserStripeCustomerId(ctx.user.id, customerId);
        }

        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const { url, sessionId } = await createSubscriptionCheckout(
          ctx.user.id,
          user.email || "",
          user.name,
          input.tier as TierName,
          customerId,
          origin,
          input.affiliateCode
        );

        return { url, sessionId };
      }),

    createCreditPackCheckout: protectedProcedure
      .input(z.object({
        packId: z.enum(["credits_100", "credits_500", "credits_1000"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
          ctx.user.id,
          user.email || "",
          user.name,
          user.stripeCustomerId
        );

        // Save customer ID if new
        if (!user.stripeCustomerId) {
          await updateUserStripeCustomerId(ctx.user.id, customerId);
        }

        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const { url, sessionId } = await createCreditPackCheckout(
          ctx.user.id,
          user.email || "",
          user.name,
          input.packId,
          customerId,
          origin
        );

        return { url, sessionId };
      }),

    getBillingPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.stripeCustomerId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No billing account found" });
      }

      const origin = ctx.req.headers.origin || "http://localhost:3000";
      const url = await createBillingPortalSession(user.stripeCustomerId, `${origin}/pricing`);
      return { url };
    }),

    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.stripeSubscriptionId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription" });
      }

      await cancelSubscription(user.stripeSubscriptionId, true);
      return { success: true };
    }),

    resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.stripeSubscriptionId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No subscription to resume" });
      }

      await resumeSubscription(user.stripeSubscriptionId);
      return { success: true };
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
