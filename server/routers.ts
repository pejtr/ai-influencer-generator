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
  getUserCreditBalance, deductCreditsHybrid, addPaidCredits,
  // Chat Companion
  createInfluencerPersonality, getInfluencerPersonalityById, getInfluencerPersonalitiesByUserId,
  updateInfluencerPersonality, deleteInfluencerPersonality, getActivePersonalities,
  createChatConversation, getChatConversationById, getConversationByFanAndPersonality,
  getConversationsByFanId, getConversationsByCreatorId, updateChatConversation, incrementConversationStats,
  createChatMessage, getChatMessagesByConversationId, getRecentChatMessages,
  createExclusiveContent, getExclusiveContentById, getExclusiveContentByCreatorId,
  getActiveExclusiveContent, updateExclusiveContent, incrementContentSales,
  createContentPurchase, getContentPurchasesByFanId, hasUserPurchasedContent,
  createFanTip, getTipsByCreatorId,
  getOrCreateCreatorEarnings, updateCreatorEarnings, incrementCreatorFans,
  incrementPersonalityStats, incrementPersonalityConversations,
  // PWA Analytics
  trackPwaEvent, getPwaAnalyticsSummary, getPwaAnalyticsTrend, getPwaAnalyticsByPlatform,
  getPwaABTestByVariant, getPwaTouchHeatmapData, getWeeklyReportData,
  getScrollDepthData, getABTestVariantStats
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
import { processImageFromUrl, getImageMetadata, convertToWebP, convertToAvif } from "./imageProcessing";
import { storagePut } from "./storage";
import { imageCache, ImageTransformCache } from "./imageCache";
import { notifyGenerationComplete, trackGenerationStart } from "./generationNotifier";
import { nanoid } from "nanoid";
import {
  generatePKCE, generateState, buildAuthorizationUrl,
  exchangeCodeForTokens, refreshAccessToken, getFanvueUser,
  publishToFanvue, isFanvueConfigured
} from "./fanvue/fanvue";
import { generateVideo, queryVideoStatus, CAMERA_MOVEMENTS, buildVideoPrompt } from "./videoGeneration";
import { generateJSONPrompt, generateCharacterVariation, analyzeReferenceImage, buildConsistentPrompt } from "./aiPromptGenerator";
import { JSONPromptSchema, JSON_PROMPT_PRESETS, jsonToTextPrompt, validateJSONPrompt } from "@shared/jsonPrompt";
import { 
  generateChatResponse, generateWelcomeMessage, generateContentOfferMessage,
  calculatePlatformFee, MESSAGE_COST 
} from "./chatCompanion";
import {
  getPublicCharacters, getCharacterById, incrementCharacterView, toggleCharacterLike,
  getPublicPresets, togglePresetLike, incrementPresetUse,
  toggleCreatorFollow, getCreatorFollowers, isFollowingCreator,
  getTrendingCharacters, getCategories, getStyles
} from "./explore";
import {
  getUserModels, getModelById, createModel, updateModel, deleteModel,
  duplicateModel, incrementModelUsage, incrementModelImages,
  getPublicModels, searchPublicModels
} from "./aiModels";
import {
  generateTalkingAudio, generateTalkingVideo, listVoices,
  VOICE_PRESETS, SUPPORTED_LANGUAGES
} from "./talkingAvatar";
import {
  EARN_TIERS, getEarnTier, getNextTierViews, calculateEarnings,
  MONETIZATION_STRATEGIES, CONTENT_STRATEGY_TIPS, PINTEREST_STRATEGY
} from "./earnProgram";

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

        // Track generation start
        const genStartTime = Date.now();
        trackGenerationStart(ctx.user.id, "image").catch(() => {});

        try {
          // Generate image using MiniMax via MCP
          const result = await generateInfluencerImage({
            prompt: input.prompt,
            aspectRatio: "3:4",
            addWatermark: user.tier === "free",
          });

          let permanentUrl = result.imageUrl;

          // Auto-convert to WebP for optimized delivery
          try {
            const webpResult = await processImageFromUrl(permanentUrl, `generations/${generationId}-${nanoid(6)}`, {
              format: "webp",
              quality: 85,
            });
            permanentUrl = webpResult.url;
          } catch (convErr) {
            // If conversion fails, use original URL
            console.warn("WebP conversion failed, using original:", convErr);
          }

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

          // Notify generation complete
          notifyGenerationComplete({
            userId: ctx.user.id,
            type: "image",
            status: "completed",
            generationId,
            imageUrl: permanentUrl,
            duration: Date.now() - genStartTime,
          }).catch(() => {});

          return {
            id: generationId,
            imageUrl: permanentUrl,
            hasWatermark: user.tier === "free",
          };
        } catch (error: any) {
          // Mark as failed
          await updateGeneration(generationId, { status: "failed" });
          console.error("Generation failed:", error);

          // Notify generation failed
          notifyGenerationComplete({
            userId: ctx.user.id,
            type: "image",
            status: "failed",
            generationId,
            error: error.message || "Unknown error",
            duration: Date.now() - genStartTime,
          }).catch(() => {});

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

    // Image CDN - Dynamic resize and format conversion
    transformImage: publicProcedure.input(z.object({
      imageUrl: z.string().url(),
      width: z.number().min(16).max(4096).optional(),
      height: z.number().min(16).max(4096).optional(),
      format: z.enum(["webp", "avif", "jpeg", "png"]).default("webp"),
      quality: z.number().min(1).max(100).default(80),
    })).mutation(async ({ input }) => {
      try {
        // Check cache first
        const cacheKey = ImageTransformCache.makeKey(input);
        const cached = imageCache.get(cacheKey);
        if (cached) {
          console.log(`[ImageCache] HIT: ${cacheKey.slice(0, 60)}...`);
          return {
            url: cached.url,
            width: cached.width,
            height: cached.height,
            format: cached.format,
            size: cached.size,
            originalSize: cached.originalSize,
            savings: cached.savings,
            fromCache: true,
          };
        }

        console.log(`[ImageCache] MISS: ${cacheKey.slice(0, 60)}...`);
        const response = await fetch(input.imageUrl);
        if (!response.ok) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to fetch source image" });
        }
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        let convertedBuffer: Buffer;
        let width: number;
        let height: number;
        let mimeType: string;

        const resizeOpts = {
          quality: input.quality,
          maxWidth: input.width,
          maxHeight: input.height,
        };

        if (input.format === "avif") {
          const result = await convertToAvif(imageBuffer, resizeOpts);
          convertedBuffer = result.buffer;
          width = result.width;
          height = result.height;
          mimeType = "image/avif";
        } else {
          const result = await convertToWebP(imageBuffer, resizeOpts);
          convertedBuffer = result.buffer;
          width = result.width;
          height = result.height;
          mimeType = "image/webp";
        }

        // Upload to S3 with cache-friendly key
        const hash = nanoid(8);
        const key = `cdn/${input.format}/${width}x${height}-q${input.quality}-${hash}.${input.format}`;
        const { url } = await storagePut(key, convertedBuffer, mimeType);

        const result = {
          url,
          width,
          height,
          format: input.format,
          size: convertedBuffer.length,
          originalSize: imageBuffer.length,
          savings: Math.round((1 - convertedBuffer.length / imageBuffer.length) * 100),
        };

        // Store in cache
        imageCache.set(cacheKey, result);

        return { ...result, fromCache: false };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Image transformation failed: ${error.message}`,
        });
      }
    }),

    // Get image cache statistics
    getCacheStats: protectedProcedure.query(async () => {
      return imageCache.getStats();
    }),

    // Clear image cache (admin only)
    clearCache: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      imageCache.clear();
      return { success: true, message: "Image cache cleared" };
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

  // ============ AI CHAT COMPANION ============
  chatCompanion: router({
    // Get all active AI personalities (for fans to browse)
    getActivePersonalities: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
      .query(async ({ input }) => {
        const personalities = await getActivePersonalities(input?.limit ?? 20);
        return personalities.map(p => ({
          id: p.id,
          name: p.name,
          bio: p.bio,
          avatarUrl: p.avatarUrl,
          personalityType: p.personalityType,
          totalConversations: p.totalConversations,
        }));
      }),

    // Get personality details
    getPersonality: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const personality = await getInfluencerPersonalityById(input.id);
        if (!personality || !personality.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Personality not found" });
        }
        return {
          id: personality.id,
          name: personality.name,
          bio: personality.bio,
          avatarUrl: personality.avatarUrl,
          personalityType: personality.personalityType,
          interests: personality.interests,
        };
      }),

    // Start or get existing conversation
    startConversation: protectedProcedure
      .input(z.object({ personalityId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const personality = await getInfluencerPersonalityById(input.personalityId);
        if (!personality || !personality.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Personality not found" });
        }

        // Check if conversation already exists
        let conversation = await getConversationByFanAndPersonality(ctx.user.id, input.personalityId);
        
        if (!conversation) {
          // Create new conversation
          const conversationId = await createChatConversation({
            fanUserId: ctx.user.id,
            personalityId: input.personalityId,
            creatorUserId: personality.userId,
          });
          
          if (!conversationId) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create conversation" });
          }

          conversation = await getChatConversationById(conversationId);
          
          // Increment stats
          await incrementPersonalityConversations(input.personalityId);
          await incrementCreatorFans(personality.userId);

          // Send welcome message
          const welcomeMessage = await generateWelcomeMessage(personality);
          await createChatMessage({
            conversationId: conversationId,
            role: "ai",
            content: welcomeMessage,
          });
        }

        return {
          conversationId: conversation!.id,
          personality: {
            id: personality.id,
            name: personality.name,
            avatarUrl: personality.avatarUrl,
          },
        };
      }),

    // Send message to AI
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getChatConversationById(input.conversationId);
        if (!conversation || conversation.fanUserId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        if (conversation.status === "blocked") {
          throw new TRPCError({ code: "FORBIDDEN", message: "This conversation has been blocked" });
        }

        const personality = await getInfluencerPersonalityById(conversation.personalityId);
        if (!personality) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Personality not found" });
        }

        // Save fan's message
        await createChatMessage({
          conversationId: input.conversationId,
          role: "fan",
          content: input.message,
        });

        // Get conversation history for context
        const recentMessages = await getRecentChatMessages(input.conversationId, 10);
        const messagesForContext = recentMessages.reverse().map(m => ({
          role: m.role as "fan" | "ai" | "system",
          content: m.content,
        }));

        // Check if we should offer content
        const availableContent = await getActiveExclusiveContent(personality.userId);
        const shouldOfferContent = availableContent.length > 0 && Math.random() < 0.2; // 20% chance
        const contentToOffer = shouldOfferContent ? availableContent[Math.floor(Math.random() * availableContent.length)] : undefined;

        // Generate AI response
        const { response: aiResponse, shouldOfferContent: offerContent } = await generateChatResponse(
          personality,
          messagesForContext,
          input.message,
          contentToOffer ? {
            shouldOfferContent: true,
            contentToOffer: {
              id: contentToOffer.id,
              title: contentToOffer.title,
              price: contentToOffer.price.toString(),
            },
          } : undefined
        );

        // Save AI response
        await createChatMessage({
          conversationId: input.conversationId,
          role: "ai",
          content: aiResponse,
          hasContentOffer: offerContent && contentToOffer ? true : false,
          offeredContentId: contentToOffer?.id,
        });

        // Update stats
        await incrementConversationStats(input.conversationId);
        await incrementPersonalityStats(conversation.personalityId);

        return {
          response: aiResponse,
          contentOffer: offerContent && contentToOffer ? {
            id: contentToOffer.id,
            title: contentToOffer.title,
            price: contentToOffer.price.toString(),
            previewUrl: contentToOffer.previewUrl,
          } : null,
        };
      }),

    // Get conversation messages
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ ctx, input }) => {
        const conversation = await getChatConversationById(input.conversationId);
        if (!conversation || conversation.fanUserId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const messages = await getChatMessagesByConversationId(input.conversationId, input.limit);
        return messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          hasContentOffer: m.hasContentOffer,
          offeredContentId: m.offeredContentId,
          createdAt: m.createdAt,
        }));
      }),

    // Get fan's conversations
    getMyConversations: protectedProcedure.query(async ({ ctx }) => {
      const conversations = await getConversationsByFanId(ctx.user.id);
      const result = [];
      
      for (const conv of conversations) {
        const personality = await getInfluencerPersonalityById(conv.personalityId);
        if (personality) {
          result.push({
            id: conv.id,
            personality: {
              id: personality.id,
              name: personality.name,
              avatarUrl: personality.avatarUrl,
            },
            messageCount: conv.messageCount,
            lastMessageAt: conv.lastMessageAt,
            status: conv.status,
          });
        }
      }
      
      return result;
    }),

    // Unlock exclusive content
    unlockContent: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const content = await getExclusiveContentById(input.contentId);
        if (!content || !content.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
        }

        // Check if already purchased
        const alreadyPurchased = await hasUserPurchasedContent(ctx.user.id, input.contentId);
        if (alreadyPurchased) {
          return { fullUrl: content.fullUrl, alreadyOwned: true };
        }

        // For now, we'll mark as pending and return - actual payment would go through Stripe
        const { platformFee, creatorEarnings } = calculatePlatformFee(Number(content.price));
        
        await createContentPurchase({
          fanUserId: ctx.user.id,
          contentId: input.contentId,
          creatorUserId: content.creatorUserId,
          conversationId: input.conversationId,
          amount: content.price,
          platformFee: platformFee.toString(),
          creatorEarnings: creatorEarnings.toString(),
          status: "completed", // In real app, this would be pending until Stripe confirms
        });

        // Update stats
        await incrementContentSales(input.contentId, Number(content.price));
        await updateCreatorEarnings(content.creatorUserId, creatorEarnings, "content");

        return { fullUrl: content.fullUrl, alreadyOwned: false };
      }),

    // Send tip to creator
    sendTip: protectedProcedure
      .input(z.object({
        creatorUserId: z.number(),
        personalityId: z.number().optional(),
        conversationId: z.number().optional(),
        amount: z.number().min(1).max(1000),
        message: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { platformFee, creatorEarnings } = calculatePlatformFee(input.amount);
        
        await createFanTip({
          fanUserId: ctx.user.id,
          creatorUserId: input.creatorUserId,
          personalityId: input.personalityId,
          conversationId: input.conversationId,
          amount: input.amount.toString(),
          platformFee: platformFee.toString(),
          creatorEarnings: creatorEarnings.toString(),
          message: input.message,
          status: "completed", // In real app, this would be pending until Stripe confirms
        });

        await updateCreatorEarnings(input.creatorUserId, creatorEarnings, "tips");

        return { success: true, creatorEarnings };
      }),

    // ============ MEMORY & RAG SYSTEM ============
    
    // Get conversation insights (memory count, mood, topics)
    getConversationInsights: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        personalityId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const conversation = await getChatConversationById(input.conversationId);
        if (!conversation || conversation.fanUserId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const { getConversationInsights } = await import("./chatCompanionEnhanced");
        return getConversationInsights(
          input.conversationId,
          ctx.user.id,
          input.personalityId,
          conversation.messageCount
        );
      }),

    // Get user's memories for a personality
    getMemories: protectedProcedure
      .input(z.object({
        personalityId: z.number(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ ctx, input }) => {
        const { getRelevantMemories } = await import("./chatCompanionEnhanced");
        return getRelevantMemories(ctx.user.id, input.personalityId, undefined, input.limit);
      }),

    // Delete user's memories (privacy feature)
    deleteMemories: protectedProcedure
      .input(z.object({
        personalityId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { deleteUserMemories } = await import("./chatCompanionEnhanced");
        const deleted = await deleteUserMemories(ctx.user.id, input.personalityId);
        return { deleted };
      }),

    // Get memory stats
    getMemoryStats: protectedProcedure
      .input(z.object({
        personalityId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const { getMemoryStats } = await import("./chatCompanionEnhanced");
        return getMemoryStats(ctx.user.id, input.personalityId);
      }),

    // Search knowledge base
    searchKnowledge: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(200),
        limit: z.number().min(1).max(10).default(5),
      }))
      .query(async ({ input }) => {
        const { searchKnowledge } = await import("./chatCompanionEnhanced");
        return searchKnowledge(input.query, input.limit);
      }),
  }),

  // ============ CREATOR DASHBOARD ============
  creator: router({
    // Create new AI personality
    createPersonality: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        bio: z.string().max(1000).optional(),
        avatarUrl: z.string().url().optional(),
        personalityType: z.enum(["flirty", "friendly", "mysterious", "playful", "sophisticated", "bold"]).default("friendly"),
        chatStyle: z.enum(["casual", "formal", "romantic", "witty", "seductive"]).default("casual"),
        responseLength: z.enum(["short", "medium", "long"]).default("medium"),
        customTraits: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        welcomeMessage: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check tier - only Pro and Creator can create personalities
        if (ctx.user.tier === "free") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro or Creator to create AI personalities" });
        }

        const personalityId = await createInfluencerPersonality({
          userId: ctx.user.id,
          name: input.name,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          personalityType: input.personalityType,
          chatStyle: input.chatStyle,
          responseLength: input.responseLength,
          customTraits: input.customTraits,
          interests: input.interests,
          welcomeMessage: input.welcomeMessage,
        });

        if (!personalityId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create personality" });
        }

        // Initialize creator earnings
        await getOrCreateCreatorEarnings(ctx.user.id);

        return { id: personalityId };
      }),

    // Get my personalities
    getMyPersonalities: protectedProcedure.query(async ({ ctx }) => {
      return getInfluencerPersonalitiesByUserId(ctx.user.id);
    }),

    // Update personality
    updatePersonality: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(1000).optional(),
        avatarUrl: z.string().url().optional(),
        personalityType: z.enum(["flirty", "friendly", "mysterious", "playful", "sophisticated", "bold"]).optional(),
        chatStyle: z.enum(["casual", "formal", "romantic", "witty", "seductive"]).optional(),
        responseLength: z.enum(["short", "medium", "long"]).optional(),
        customTraits: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        welcomeMessage: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateInfluencerPersonality(id, ctx.user.id, data);
        return { success: true };
      }),

    // Delete personality
    deletePersonality: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteInfluencerPersonality(input.id, ctx.user.id);
        return { success: true };
      }),

    // Create exclusive content
    createContent: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        contentType: z.enum(["image", "video", "gallery", "message"]).default("image"),
        previewUrl: z.string().url().optional(),
        fullUrl: z.string().url(),
        price: z.number().min(1).max(1000),
        personalityId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contentId = await createExclusiveContent({
          creatorUserId: ctx.user.id,
          personalityId: input.personalityId,
          title: input.title,
          description: input.description,
          contentType: input.contentType,
          previewUrl: input.previewUrl,
          fullUrl: input.fullUrl,
          price: input.price.toString(),
        });

        if (!contentId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create content" });
        }

        return { id: contentId };
      }),

    // Get my exclusive content
    getMyContent: protectedProcedure.query(async ({ ctx }) => {
      return getExclusiveContentByCreatorId(ctx.user.id);
    }),

    // Update content
    updateContent: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        price: z.number().min(1).max(1000).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, price, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (price !== undefined) data.price = price.toString();
        await updateExclusiveContent(id, ctx.user.id, data);
        return { success: true };
      }),

    // Get earnings dashboard
    getEarnings: protectedProcedure.query(async ({ ctx }) => {
      const earnings = await getOrCreateCreatorEarnings(ctx.user.id);
      const tips = await getTipsByCreatorId(ctx.user.id, 10);
      const conversations = await getConversationsByCreatorId(ctx.user.id, 10);
      
      return {
        earnings,
        recentTips: tips,
        recentConversations: conversations.length,
      };
    }),

    // Get conversation analytics
    getConversationStats: protectedProcedure.query(async ({ ctx }) => {
      const conversations = await getConversationsByCreatorId(ctx.user.id);
      const personalities = await getInfluencerPersonalitiesByUserId(ctx.user.id);
      
      return {
        totalConversations: conversations.length,
        activeConversations: conversations.filter(c => c.status === "active").length,
        totalPersonalities: personalities.length,
        personalityStats: personalities.map(p => ({
          id: p.id,
          name: p.name,
          conversations: p.totalConversations,
          messages: p.messageCount,
          revenue: p.totalRevenue,
        })),
      };
    }),
  }),

  // AI Prompt Generator for character consistency
  promptGenerator: router({
    // Generate JSON prompt from simple text description
    generate: protectedProcedure
      .input(z.object({
        description: z.string().min(5).max(1000),
        baseCharacter: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await generateJSONPrompt(
          input.description,
          input.baseCharacter as Partial<JSONPromptSchema> | undefined
        );
        return result;
      }),

    // Generate character variation (same character, new scene)
    generateVariation: protectedProcedure
      .input(z.object({
        baseCharacter: z.any(),
        newSceneDescription: z.string().min(5).max(500),
      }))
      .mutation(async ({ input }) => {
        const result = await generateCharacterVariation(
          input.baseCharacter as JSONPromptSchema,
          input.newSceneDescription
        );
        return result;
      }),

    // Analyze reference image to extract character features
    analyzeImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const features = await analyzeReferenceImage(input.imageUrl);
        return { features };
      }),

    // Get available presets
    getPresets: publicProcedure.query(() => {
      return {
        presets: Object.entries(JSON_PROMPT_PRESETS).map(([key, value]) => ({
          id: key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          preview: jsonToTextPrompt(value).substring(0, 100) + '...',
          jsonPrompt: value,
        })),
      };
    }),

    // Validate JSON prompt
    validate: publicProcedure
      .input(z.object({
        jsonPrompt: z.any(),
      }))
      .query(({ input }) => {
        const validation = validateJSONPrompt(input.jsonPrompt as Partial<JSONPromptSchema>);
        return validation;
      }),

    // Convert JSON to text prompt
    toText: publicProcedure
      .input(z.object({
        jsonPrompt: z.any(),
      }))
      .query(({ input }) => {
        const textPrompt = jsonToTextPrompt(input.jsonPrompt as JSONPromptSchema);
        return { textPrompt };
      }),

    // Build consistent prompt with reference image
    buildConsistent: protectedProcedure
      .input(z.object({
        jsonPrompt: z.any(),
        referenceImageUrl: z.string().url().optional(),
      }))
      .query(({ input }) => {
        const result = buildConsistentPrompt(
          input.jsonPrompt as JSONPromptSchema,
          input.referenceImageUrl
        );
        return result;
      }),
  }),

  // AI Models (APOB-style Model Library)
  aiModels: router({    // Get user's models
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserModels(ctx.user.id);
    }),

    // Get single model
    get: protectedProcedure
      .input(z.object({ modelId: z.number() }))
      .query(async ({ ctx, input }) => {
        const model = await getModelById(input.modelId, ctx.user.id);
        if (!model) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Model not found" });
        }
        return model;
      }),

    // Create new model
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        previewImageUrl: z.string().optional(),
        characterSettings: z.any(), // JSON object
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createModel({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // Update model
    update: protectedProcedure
      .input(z.object({
        modelId: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        previewImageUrl: z.string().optional(),
        characterSettings: z.any().optional(),
        isPublic: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { modelId, ...updateData } = input;
        const model = await updateModel(modelId, ctx.user.id, updateData);
        if (!model) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Model not found" });
        }
        return model;
      }),

    // Delete model
    delete: protectedProcedure
      .input(z.object({ modelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteModel(input.modelId, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Model not found" });
        }
        return { success };
      }),

    // Duplicate model
    duplicate: protectedProcedure
      .input(z.object({ modelId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const newModel = await duplicateModel(input.modelId, ctx.user.id);
        if (!newModel) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Model not found" });
        }
        return newModel;
      }),

    // Get public models (for explore/marketplace)
    public: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        return getPublicModels(limit, offset);
      }),

    // Search public models
    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        return searchPublicModels(input.query, input.limit);
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

    // ============ KNOWLEDGE BASE MANAGEMENT ============
    
    // Get all knowledge items
    getKnowledgeItems: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        contentType: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { searchKnowledgeItems, getAllKnowledgeItems } = await import("./knowledgeBase");
        
        if (input?.search || input?.contentType || input?.category || input?.isActive !== undefined) {
          return searchKnowledgeItems(input.search || "", {
            contentType: input.contentType,
            category: input.category,
            isActive: input.isActive,
          });
        }
        return getAllKnowledgeItems();
      }),

    // Get single knowledge item
    getKnowledgeItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getKnowledgeItemById } = await import("./knowledgeBase");
        const item = await getKnowledgeItemById(input.id);
        if (!item) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Knowledge item not found" });
        }
        return item;
      }),

    // Create knowledge item
    createKnowledgeItem: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        contentType: z.enum(["platform_feature", "how_to", "best_practice", "faq", "industry", "tip"]),
        category: z.string().min(1).max(100),
        tags: z.array(z.string()).default([]),
        priority: z.number().min(1).max(10).default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { createKnowledgeItem } = await import("./knowledgeBase");
        const id = await createKnowledgeItem(input, ctx.user.id);
        if (!id) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create knowledge item" });
        }
        return { id };
      }),

    // Update knowledge item
    updateKnowledgeItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        contentType: z.enum(["platform_feature", "how_to", "best_practice", "faq", "industry", "tip"]).optional(),
        category: z.string().min(1).max(100).optional(),
        tags: z.array(z.string()).optional(),
        priority: z.number().min(1).max(10).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { updateKnowledgeItem } = await import("./knowledgeBase");
        const { id, ...updates } = input;
        const success = await updateKnowledgeItem(id, updates, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update knowledge item" });
        }
        return { success: true };
      }),

    // Delete knowledge item
    deleteKnowledgeItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { deleteKnowledgeItem } = await import("./knowledgeBase");
        const success = await deleteKnowledgeItem(input.id, ctx.user.id);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete knowledge item" });
        }
        return { success: true };
      }),

    // Get knowledge base stats
    getKnowledgeStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { getKnowledgeStats } = await import("./knowledgeBase");
      return getKnowledgeStats();
    }),

    // Get knowledge categories
    getKnowledgeCategories: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { getKnowledgeCategories } = await import("./knowledgeBase");
      return getKnowledgeCategories();
    }),

    // ============ KNOWLEDGE BASE IMPORT/EXPORT ============

    // Export as JSON
    exportKnowledgeJSON: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { exportAsJSON } = await import("./knowledgeBaseImportExport");
      const data = await exportAsJSON();
      if (!data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to export knowledge base" });
      }
      return data;
    }),

    // Export as CSV
    exportKnowledgeCSV: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { exportAsCSV } = await import("./knowledgeBaseImportExport");
      const csv = await exportAsCSV();
      if (!csv) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to export knowledge base" });
      }
      return csv;
    }),

    // Preview import from JSON
    previewImportJSON: protectedProcedure
      .input(z.object({
        data: z.any(), // ExportFormat type
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { previewImportJSON } = await import("./knowledgeBaseImportExport");
        return previewImportJSON(input.data);
      }),

    // Import from JSON
    importKnowledgeJSON: protectedProcedure
      .input(z.object({
        data: z.any(), // ExportFormat type
        skipDuplicates: z.boolean().default(true),
        overwriteDuplicates: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { importFromJSON } = await import("./knowledgeBaseImportExport");
        return importFromJSON(input.data, {
          skipDuplicates: input.skipDuplicates,
          overwriteDuplicates: input.overwriteDuplicates,
        });
      }),

    // Import from CSV
    importKnowledgeCSV: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
        skipDuplicates: z.boolean().default(true),
        overwriteDuplicates: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { importFromCSV } = await import("./knowledgeBaseImportExport");
        return importFromCSV(input.csvContent, {
          skipDuplicates: input.skipDuplicates,
          overwriteDuplicates: input.overwriteDuplicates,
        });
      }),

    // ============ KNOWLEDGE BASE HISTORY ============

    // Get history for a knowledge item
    getKnowledgeHistory: protectedProcedure
      .input(z.object({ knowledgeId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getKnowledgeHistory } = await import("./knowledgeBaseHistory");
        return getKnowledgeHistory(input.knowledgeId);
      }),

    // Get recent history (all items)
    getRecentKnowledgeHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getRecentHistory } = await import("./knowledgeBaseHistory");
        return getRecentHistory(input.limit);
      }),

    // Restore a previous version
    restoreKnowledgeVersion: protectedProcedure
      .input(z.object({
        knowledgeId: z.number(),
        historyId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { restoreVersion } = await import("./knowledgeBaseHistory");
        const success = await restoreVersion({
          knowledgeId: input.knowledgeId,
          historyId: input.historyId,
          userId: ctx.user.id,
        });
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to restore version" });
        }
        return { success: true };
      }),

    // ============ CHAT ANALYTICS ============
    
    getChatAnalyticsOverview: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getAnalyticsOverview } = await import("./chatAnalytics");
        return getAnalyticsOverview(input?.startDate, input?.endDate);
      }),

    getChatTopTopics: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getTopTopics } = await import("./chatAnalytics");
        return getTopTopics(input?.limit ?? 10, input?.startDate, input?.endDate);
      }),

    getChatSentimentDistribution: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getSentimentDistribution } = await import("./chatAnalytics");
        return getSentimentDistribution(input?.startDate, input?.endDate);
      }),

    getChatTimeSeriesData: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(30),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getTimeSeriesData } = await import("./chatAnalytics");
        return getTimeSeriesData(input?.days ?? 30);
      }),

    getChatRecentConversations: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        const { getRecentConversations } = await import("./chatAnalytics");
        return getRecentConversations(input?.limit ?? 10);
      }),

    getChatMemoryInsights: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { getMemoryInsights } = await import("./chatAnalytics");
      return getMemoryInsights();
    }),
  }),

  // ============ BLOG SYSTEM ============
  blog: router({
    // Get all published articles
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const { getBlogArticles } = await import("./blog");
        return getBlogArticles(input?.category, input?.limit ?? 10, input?.offset ?? 0);
      }),

    // Get single article by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getBlogArticleBySlug, incrementArticleView } = await import("./blog");
        const article = await getBlogArticleBySlug(input.slug);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        // Increment view count
        await incrementArticleView(article.id);
        return article;
      }),

    // Get categories
    getCategories: publicProcedure.query(async () => {
      const { getBlogCategories } = await import("./blog");
      return getBlogCategories();
    }),

    // Get recent articles for sidebar
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).default(5) }).optional())
      .query(async ({ input }) => {
        const { getRecentBlogArticles } = await import("./blog");
        return getRecentBlogArticles(input?.limit ?? 5);
      }),

    // Search articles
    search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(100) }))
      .query(async ({ input }) => {
        const { searchBlogArticles } = await import("./blog");
        return searchBlogArticles(input.query);
      }),

    // Get comments for an article
    getComments: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const { getArticleComments } = await import("./blog");
        return getArticleComments(input.articleId);
      }),

    // Add a comment
    addComment: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { addComment } = await import("./blog");
        return addComment(input.articleId, ctx.user.id, ctx.user.name || "Anonymous", input.content, input.parentId);
      }),

    // Get rating stats
    getRatingStats: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const { getArticleRatingStats } = await import("./blog");
        return getArticleRatingStats(input.articleId);
      }),

    // Get user's rating
    getUserRating: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getUserRating } = await import("./blog");
        return getUserRating(input.articleId, ctx.user.id);
      }),

    // Submit rating
    submitRating: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { submitRating } = await import("./blog");
        return submitRating(input.articleId, ctx.user.id, input.rating);
      }),
  }),

  // ============ TALKING AVATAR ============
  talkingAvatar: router({
    // Get available voices
    getVoices: publicProcedure.query(async () => {
      return {
        presets: VOICE_PRESETS,
        languages: SUPPORTED_LANGUAGES,
      };
    }),

    // Generate audio from script
    generateAudio: protectedProcedure
      .input(z.object({
        script: z.string().min(1).max(500),
        voiceId: z.string().default("Charming_Lady"),
        emotion: z.enum(["happy", "sad", "angry", "fearful", "disgusted", "surprised", "neutral"]).default("happy"),
        speed: z.number().min(0.5).max(2.0).default(1.0),
        language: z.string().default("English"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check credits - audio costs 2 credits
        const creditBalance = await getUserCreditBalance(ctx.user.id);
        const audioCost = 2;
        if (!creditBalance || creditBalance.totalAvailable < audioCost) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Not enough credits. Audio generation costs ${audioCost} credits.`
          });
        }

        try {
          const result = await generateTalkingAudio({
            script: input.script,
            voiceId: input.voiceId,
            emotion: input.emotion,
            speed: input.speed,
            language: input.language,
          });

          // Deduct credits
          const deductResult = await deductCreditsHybrid(ctx.user.id, audioCost);
          if (!deductResult.success) {
            throw new TRPCError({ code: "FORBIDDEN", message: deductResult.error || "Failed to deduct credits" });
          }

          await createCreditTransaction({
            userId: ctx.user.id,
            amount: -audioCost,
            type: "audio_generation",
            creditSource: deductResult.source as "free" | "paid" | "subscription",
            description: "Talking avatar audio generation",
            balanceBefore: creditBalance.totalAvailable,
            balanceAfter: creditBalance.totalAvailable - audioCost,
          });

          return {
            audioUrl: result.audioUrl,
          };
        } catch (error: any) {
          console.error("Talking avatar audio failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate audio. Please try again."
          });
        }
      }),

    // Generate talking video from image + script
    generateVideo: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        script: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Video costs 5 credits
        const creditBalance = await getUserCreditBalance(ctx.user.id);
        const videoCost = 5;
        if (!creditBalance || creditBalance.totalAvailable < videoCost) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Not enough credits. Talking video costs ${videoCost} credits.`
          });
        }

        try {
          const result = await generateTalkingVideo(input.imageUrl, "", input.script);

          const deductResult = await deductCreditsHybrid(ctx.user.id, videoCost);
          if (!deductResult.success) {
            throw new TRPCError({ code: "FORBIDDEN", message: deductResult.error || "Failed to deduct credits" });
          }

          await createCreditTransaction({
            userId: ctx.user.id,
            amount: -videoCost,
            type: "video_generation",
            creditSource: deductResult.source as "free" | "paid" | "subscription",
            description: "Talking avatar video generation",
            balanceBefore: creditBalance.totalAvailable,
            balanceAfter: creditBalance.totalAvailable - videoCost,
          });

          return {
            taskId: result.taskId,
            status: result.status,
          };
        } catch (error: any) {
          console.error("Talking avatar video failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate talking video. Please try again."
          });
        }
      }),
  }),

  // ============ EARN PROGRAM ============
  earnProgram: router({
    // Get earn program info
    getTiers: publicProcedure.query(() => {
      return {
        tiers: EARN_TIERS,
        strategies: MONETIZATION_STRATEGIES,
        contentTips: CONTENT_STRATEGY_TIPS,
        pinterestStrategy: PINTEREST_STRATEGY,
      };
    }),

    // Get user's earn stats (mock for now)
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      // In production, this would pull from a real analytics table
      return {
        totalViews: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        lifetimeEarnings: 0,
        contentCount: 0,
        avgViewsPerContent: 0,
        tier: "starter" as const,
        nextTierViews: 10000,
      };
    }),
   }),

  // ============ PWA Analytics ============
  pwaAnalytics: router({
    // Track PWA event (public - works for anonymous users too)
    trackEvent: publicProcedure.input(z.object({
      eventType: z.enum([
        "install_prompt_shown", "install_prompt_accepted", "install_prompt_dismissed",
        "app_installed", "offline_session_start", "offline_session_end",
        "notification_permission_granted", "notification_permission_denied",
        "notification_shown", "notification_clicked", "notification_dismissed",
        "sw_registered", "sw_update_available", "sw_update_applied",
      ]),
      metadata: z.record(z.string(), z.unknown()).optional(),
      platform: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      await trackPwaEvent({
        userId: userId ?? undefined,
        eventType: input.eventType,
        metadata: input.metadata,
        userAgent: ctx.req?.headers["user-agent"] ?? undefined,
        platform: input.platform,
      });
      return { success: true };
    }),

    // Get analytics summary (admin only)
    getSummary: protectedProcedure.input(z.object({
      days: z.number().min(1).max(365).default(30),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const days = input?.days ?? 30;
      const summary = await getPwaAnalyticsSummary(days);
      return summary ?? [];
    }),

    // Get trend data for specific event type (admin only)
    getTrend: protectedProcedure.input(z.object({
      eventType: z.string(),
      days: z.number().min(1).max(365).default(30),
    })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const trend = await getPwaAnalyticsTrend(input.eventType, input.days);
      return trend ?? [];
    }),

    // Get platform breakdown (admin only)
    getByPlatform: protectedProcedure.input(z.object({
      days: z.number().min(1).max(365).default(30),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getPwaAnalyticsByPlatform(input?.days ?? 30);
      return data ?? [];
    }),

    // Get A/B test per-variant breakdown (admin only)
    getABTestVariants: protectedProcedure.input(z.object({
      days: z.number().min(1).max(365).default(30),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getPwaABTestByVariant(input?.days ?? 30);
      return data ?? [];
    }),

    // Get touch heatmap data (admin only)
    getHeatmapData: protectedProcedure.input(z.object({
      days: z.number().min(1).max(30).default(7),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getPwaTouchHeatmapData(input?.days ?? 7);
      return data ?? [];
    }),

    // Get weekly report data (admin only)
    getWeeklyReport: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getWeeklyReportData();
      return data;
    }),

    // Track touch coordinates for heatmap (public)
    trackTouch: publicProcedure.input(z.object({
      x: z.number().min(0).max(1), // Normalized 0-1
      y: z.number().min(0).max(1), // Normalized 0-1
      page: z.string().max(200),
      viewportWidth: z.number().int().positive(),
      viewportHeight: z.number().int().positive(),
      elementTag: z.string().max(50).optional(),
      elementId: z.string().max(100).optional(),
    })).mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      await trackPwaEvent({
        userId: userId ?? undefined,
        eventType: "touch_interaction" as any,
        metadata: {
          x: input.x,
          y: input.y,
          page: input.page,
          viewportWidth: input.viewportWidth,
          viewportHeight: input.viewportHeight,
          elementTag: input.elementTag,
          elementId: input.elementId,
          isHeatmapPoint: true,
        },
        userAgent: ctx.req?.headers["user-agent"] ?? undefined,
        platform: /iphone|ipad|ipod/i.test(ctx.req?.headers["user-agent"] || "") ? "ios" :
                  /android/i.test(ctx.req?.headers["user-agent"] || "") ? "android" : "desktop",
      });
      return { success: true };
    }),

    // Get scroll depth data (admin only)
    getScrollDepth: protectedProcedure.input(z.object({
      days: z.number().min(1).max(365).default(30),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getScrollDepthData(input?.days ?? 30);
      return data ?? [];
    }),

    // Get A/B test variant stats for auto-optimization (admin only)
    getAutoOptimizeStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const data = await getABTestVariantStats();
      return data ?? [];
    }),

    // Export weekly report as CSV (admin only)
    exportReportCSV: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { generateReportCSV } = await import("../shared/reportExport");
      const { generateAndBuildReport } = await import("./weeklyReportGenerator");
      const reportData = await generateAndBuildReport();
      if (!reportData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No report data available" });
      }
      return { csv: generateReportCSV(reportData), filename: `weekly-report-${reportData.period.start}-${reportData.period.end}.csv` };
    }),

    // Export weekly report as HTML (for PDF rendering client-side) (admin only)
    exportReportHTML: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const { generateReportHTML } = await import("../shared/reportExport");
      const { generateAndBuildReport } = await import("./weeklyReportGenerator");
      const reportData = await generateAndBuildReport();
      if (!reportData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No report data available" });
      }
      return { html: generateReportHTML(reportData), filename: `weekly-report-${reportData.period.start}-${reportData.period.end}.pdf` };
    }),
  }),
});
export type AppRouter = typeof appRouter;
