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
  updateUserStripeCustomerId,
  getAffiliateLeaderboard, getAffiliateNetworkStats,
  // Fanvue integration
  updateUserFanvueTokens, disconnectUserFanvue, getUserFanvueTokens,
  markGenerationPublished, getUnpublishedGenerations,
  // Scheduler
  createScheduledPost, getScheduledPostsByUserId, getScheduledPostById,
  updateScheduledPost, deleteScheduledPost,
  // Batch jobs
  createBatchJob, getBatchJobById, getBatchJobsByUserId, updateBatchJob, incrementBatchJobProgress,
  // Hybrid credit system
  getUserCreditBalance, deductCreditsHybrid, addPaidCredits
} from "./db";
import { 
  getOrCreateCustomer, 
  createSubscriptionCheckout, 
  createCreditPackCheckout,
  createBillingPortalSession,
  cancelSubscription,
  resumeSubscription
} from "./stripe/stripe";
import { TierName, SUBSCRIPTION_TIERS, CREDIT_PACKS } from "./stripe/products";
import { generateInfluencerImage, buildPromptFromSettings } from "./imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  generatePKCE, generateState, buildAuthorizationUrl,
  exchangeCodeForTokens, refreshAccessToken, getFanvueUser,
  publishToFanvue, isFanvueConfigured
} from "./fanvue/fanvue";
import { generateVideo, queryVideoStatus, CAMERA_MOVEMENTS, buildVideoPrompt } from "./videoGeneration";

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

// Helper to check tier access
function requireTier(userTier: string, requiredTiers: string[]) {
  if (!requiredTiers.includes(userTier)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This feature requires ${requiredTiers.join(" or ")} tier. Please upgrade your plan.`
    });
  }
}

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
      const balance = await getUserCreditBalance(ctx.user.id);
      const user = await getUserById(ctx.user.id);
      return {
        credits: balance?.totalAvailable ?? 0,
        tier: user?.tier ?? "free",
        freeCreditsToday: balance?.freeCreditsToday ?? 0,
        subscriptionCredits: balance?.subscriptionCredits ?? 0,
        paidCredits: balance?.paidCredits ?? 0,
        totalAvailable: balance?.totalAvailable ?? 0,
      };
    }),

    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      return getUserCreditTransactions(ctx.user.id, 50);
    }),

    getPricing: publicProcedure.query(() => {
      return {
        tiers: SUBSCRIPTION_TIERS,
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

        // Check credits using hybrid system
        const creditBalance = await getUserCreditBalance(ctx.user.id);
        if (!creditBalance || creditBalance.totalAvailable < 1) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Not enough credits. Please upgrade your plan or purchase more credits." 
          });
        }

        // Determine credit source for tracking
        let creditSource: "free" | "paid" | "subscription" = "free";
        if (creditBalance.freeCreditsToday >= 1) {
          creditSource = "free";
        } else if (creditBalance.subscriptionCredits >= 1) {
          creditSource = "subscription";
        } else {
          creditSource = "paid";
        }

        // Create generation record
        const generationId = await createGeneration({
          userId: ctx.user.id,
          prompt: input.prompt,
          characterSettings: input.characterSettings,
          imageUrl: "",
          hasWatermark: user.tier === "free",
          creditSource,
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

          // Deduct credit using hybrid system
          const deductResult = await deductCreditsHybrid(ctx.user.id, 1);
          if (!deductResult.success) {
            throw new TRPCError({ code: "FORBIDDEN", message: deductResult.error || "Failed to deduct credits" });
          }

          // Log transaction
          await createCreditTransaction({
            userId: ctx.user.id,
            amount: -1,
            type: "generation",
            creditSource: deductResult.source as "free" | "paid" | "subscription",
            description: "AI influencer generation",
            balanceBefore: creditBalance.totalAvailable,
            balanceAfter: creditBalance.totalAvailable - 1,
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

    // Get unpublished generations for Fanvue publishing
    getUnpublished: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      requireTier(user.tier, ["premium", "vip"]);
      return getUnpublishedGenerations(ctx.user.id, 30);
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

  // Fanvue Integration (PREMIUM/VIP only)
  fanvue: router({
    // Check if Fanvue is configured and user connection status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const tokens = await getUserFanvueTokens(ctx.user.id);
      
      return {
        isConfigured: isFanvueConfigured(),
        isConnected: !!tokens,
        connectedAt: tokens?.connectedAt || null,
        fanvueUserId: tokens?.fanvueUserId || null,
        tierAllowed: ["premium", "vip"].includes(user.tier),
      };
    }),

    // Start OAuth flow - returns authorization URL
    startAuth: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      requireTier(user.tier, ["premium", "vip"]);

      if (!isFanvueConfigured()) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Fanvue integration is not configured. Please contact support." 
        });
      }

      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = generateState();
      
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      const redirectUri = `${origin}/api/fanvue/callback`;
      
      const authUrl = buildAuthorizationUrl(redirectUri, state, codeChallenge);

      // Store PKCE verifier and state in session/cookie
      // In production, use secure session storage
      ctx.res.cookie("fanvue_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: "lax",
      });
      ctx.res.cookie("fanvue_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000,
        sameSite: "lax",
      });

      return { authUrl };
    }),

    // Complete OAuth flow - exchange code for tokens
    completeAuth: protectedProcedure
      .input(z.object({
        code: z.string(),
        state: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["premium", "vip"]);

        // Verify state
        const storedState = ctx.req.cookies?.fanvue_state;
        if (!storedState || storedState !== input.state) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid state parameter" });
        }

        // Get code verifier
        const codeVerifier = ctx.req.cookies?.fanvue_code_verifier;
        if (!codeVerifier) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Missing code verifier" });
        }

        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const redirectUri = `${origin}/api/fanvue/callback`;

        try {
          // Exchange code for tokens
          const tokens = await exchangeCodeForTokens(input.code, redirectUri, codeVerifier);
          
          // Get Fanvue user info
          const fanvueUser = await getFanvueUser(tokens.accessToken);

          // Store tokens in database
          await updateUserFanvueTokens(
            ctx.user.id,
            tokens.accessToken,
            tokens.refreshToken,
            fanvueUser.uuid
          );

          // Clear cookies
          ctx.res.clearCookie("fanvue_code_verifier");
          ctx.res.clearCookie("fanvue_state");

          return {
            success: true,
            fanvueUser: {
              handle: fanvueUser.handle,
              displayName: fanvueUser.displayName,
              isCreator: fanvueUser.isCreator,
            },
          };
        } catch (error) {
          console.error("Fanvue OAuth error:", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to complete Fanvue authentication" 
          });
        }
      }),

    // Disconnect Fanvue account
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await disconnectUserFanvue(ctx.user.id);
      return { success: true };
    }),

    // Publish a generation to Fanvue
    publish: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        caption: z.string().max(5000).default(""),
        hashtags: z.string().optional(),
        audience: z.enum(["subscribers", "followers-and-subscribers"]).default("subscribers"),
        price: z.number().min(300).optional(), // cents
        publishAt: z.string().optional(), // ISO date for scheduled post
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["premium", "vip"]);

        // Get Fanvue tokens
        const tokens = await getUserFanvueTokens(ctx.user.id);
        if (!tokens) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Please connect your Fanvue account first" 
          });
        }

        // Get generation
        const generation = await getGenerationById(input.generationId);
        if (!generation || generation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }

        if (generation.publishedToFanvue) {
          throw new TRPCError({ code: "CONFLICT", message: "Already published to Fanvue" });
        }

        if (!tokens.accessToken) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Fanvue access token not found. Please reconnect your account." 
          });
        }

        try {
          // Publish to Fanvue
          const post = await publishToFanvue(
            tokens.accessToken,
            generation.imageUrl,
            input.caption,
            {
              audience: input.audience,
              price: input.price,
              publishAt: input.publishAt,
              hashtags: input.hashtags,
            }
          );

          // Mark as published
          await markGenerationPublished(generation.id, post.uuid);

          return {
            success: true,
            postId: post.uuid,
            publishedAt: post.publishedAt,
          };
        } catch (error) {
          console.error("Fanvue publish error:", error);
          
          // Check if token expired and try refresh
          if (tokens.refreshToken) {
            try {
              const newTokens = await refreshAccessToken(tokens.refreshToken);
              await updateUserFanvueTokens(
                ctx.user.id,
                newTokens.accessToken,
                newTokens.refreshToken,
                tokens.fanvueUserId!
              );
              
              // Retry publish with new token
              const post = await publishToFanvue(
                newTokens.accessToken,
                generation.imageUrl,
                input.caption,
                {
                  audience: input.audience,
                  price: input.price,
                  publishAt: input.publishAt,
                  hashtags: input.hashtags,
                }
              );

              await markGenerationPublished(generation.id, post.uuid);

              return {
                success: true,
                postId: post.uuid,
                publishedAt: post.publishedAt,
              };
            } catch (refreshError) {
              console.error("Token refresh failed:", refreshError);
              await disconnectUserFanvue(ctx.user.id);
              throw new TRPCError({ 
                code: "UNAUTHORIZED", 
                message: "Fanvue session expired. Please reconnect your account." 
              });
            }
          }
          
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to publish to Fanvue" 
          });
        }
      }),
  }),

  // Content Scheduler (VIP only)
  scheduler: router({
    // List scheduled posts
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      requireTier(user.tier, ["vip"]);
      
      return getScheduledPostsByUserId(ctx.user.id, 50);
    }),

    // Create scheduled post
    create: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        scheduledAt: z.string(), // ISO date
        caption: z.string().max(5000).default(""),
        hashtags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        // Verify generation exists
        const generation = await getGenerationById(input.generationId);
        if (!generation || generation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
        }

        const scheduledAt = new Date(input.scheduledAt);
        if (scheduledAt <= new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Scheduled time must be in the future" });
        }

        const postId = await createScheduledPost({
          userId: ctx.user.id,
          generationId: input.generationId,
          scheduledAt,
          caption: input.caption,
          hashtags: input.hashtags,
        });

        return { success: true, id: postId };
      }),

    // Update scheduled post
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        scheduledAt: z.string().optional(),
        caption: z.string().max(5000).optional(),
        hashtags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        const post = await getScheduledPostById(input.id);
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Scheduled post not found" });
        }

        if (post.status !== "scheduled") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot update non-scheduled post" });
        }

        const updateData: Record<string, unknown> = {};
        if (input.scheduledAt) {
          const scheduledAt = new Date(input.scheduledAt);
          if (scheduledAt <= new Date()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Scheduled time must be in the future" });
          }
          updateData.scheduledAt = scheduledAt;
        }
        if (input.caption !== undefined) updateData.caption = input.caption;
        if (input.hashtags !== undefined) updateData.hashtags = input.hashtags;

        await updateScheduledPost(input.id, updateData);
        return { success: true };
      }),

    // Cancel scheduled post
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        const post = await getScheduledPostById(input.id);
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Scheduled post not found" });
        }

        await updateScheduledPost(input.id, { status: "cancelled" });
        return { success: true };
      }),

    // Delete scheduled post
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        const success = await deleteScheduledPost(input.id, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Scheduled post not found" });
        }
        return { success: true };
      }),
  }),

  // Batch Generation (VIP only)
  batch: router({
    // Create batch generation job
    create: protectedProcedure
      .input(z.object({
        totalImages: z.number().min(1).max(30),
        basePrompt: z.string().min(10).max(2000),
        characterSettings: characterSettingsSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        // Check credits
        if (user.credits < input.totalImages) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Not enough credits. You need ${input.totalImages} credits but have ${user.credits}.` 
          });
        }

        const jobId = await createBatchJob({
          userId: ctx.user.id,
          totalImages: input.totalImages,
          basePrompt: input.basePrompt,
          characterSettings: input.characterSettings,
        });

        return { success: true, jobId };
      }),

    // Get batch job status
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        requireTier(user.tier, ["vip"]);

        const job = await getBatchJobById(input.id);
        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Batch job not found" });
        }
        return job;
      }),

    // List batch jobs
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      requireTier(user.tier, ["vip"]);
      
      return getBatchJobsByUserId(ctx.user.id, 20);
    }),
  }),

  // Stripe payments
  stripe: router({
    createSubscriptionCheckout: protectedProcedure
      .input(z.object({
        tier: z.enum(["pro", "creator"]),
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
        packId: z.string(),
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

  // Video generation
  video: router({
    // Create video from image (I2V) or text (T2V)
    create: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10).max(500),
        imageUrl: z.string().url().optional(), // For I2V
        model: z.enum(["T2V-01", "T2V-01-Director", "I2V-01", "I2V-01-Director", "I2V-01-live", "MiniMax-Hailuo-02"]).optional(),
        duration: z.enum(["6", "10"]).optional(),
        resolution: z.enum(["768P", "1080P"]).optional(),
        cameraMovement: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Video generation requires pro or creator tier
        requireTier(user.tier, ["pro", "creator"]);

        // Check credits - video costs 5 credits
        const creditBalance = await getUserCreditBalance(ctx.user.id);
        const videoCost = 5;
        if (!creditBalance || creditBalance.totalAvailable < videoCost) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Not enough credits. Video generation costs ${videoCost} credits.` 
          });
        }

        try {
          // Determine model based on input
          let model = input.model;
          if (!model) {
            model = input.imageUrl ? "I2V-01" : "T2V-01";
          }

          // Generate video
          const result = await generateVideo({
            prompt: input.prompt,
            firstFrameImage: input.imageUrl,
            model: model as any,
            duration: input.duration ? parseInt(input.duration) as 6 | 10 : 6,
            resolution: input.resolution || "768P",
            cameraMovement: input.cameraMovement,
          });

          // Deduct credits
          const deductResult = await deductCreditsHybrid(ctx.user.id, videoCost);
          if (!deductResult.success) {
            throw new TRPCError({ code: "FORBIDDEN", message: deductResult.error || "Failed to deduct credits" });
          }

          // Log transaction
          await createCreditTransaction({
            userId: ctx.user.id,
            amount: -videoCost,
            type: "video_generation",
            creditSource: deductResult.source as "free" | "paid" | "subscription",
            description: "AI video generation",
            balanceBefore: creditBalance.totalAvailable,
            balanceAfter: creditBalance.totalAvailable - videoCost,
          });

          return {
            taskId: result.taskId,
            videoUrl: result.videoUrl,
            status: result.status,
          };
        } catch (error) {
          console.error("Video generation failed:", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to generate video. Please try again." 
          });
        }
      }),

    // Query video generation status
    getStatus: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const result = await queryVideoStatus(input.taskId);
          return result;
        } catch (error) {
          console.error("Failed to query video status:", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to check video status." 
          });
        }
      }),

    // Get available camera movements
    getCameraMovements: publicProcedure.query(() => {
      return Object.entries(CAMERA_MOVEMENTS).map(([key, value]) => ({
        id: key,
        label: key.replace(/([A-Z])/g, " $1").trim(),
        instruction: value,
      }));
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
