// Creator Tools tRPC Router
// Fan CRM, Mass Messaging, Content Vault, PPV Optimizer, Team Management, Social Traffic, Daily Snapshots
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createFanProfile, getFanProfile, getOrCreateFanProfile, updateFanProfile,
  getFansByCreator, getFanCrmStats, calculateFanScore,
  createMessageTemplate, getMessageTemplatesByCreator, getMessageTemplateById,
  updateMessageTemplate, deleteMessageTemplate,
  createMessageAutomation, getAutomationsByCreator, getAutomationById,
  updateAutomation, deleteAutomation,
  createCampaign, getCampaignsByCreator, getCampaignById, updateCampaign, deleteCampaign,
  createVaultItem, getVaultItemsByCreator, getVaultItemById, updateVaultItem,
  deleteVaultItem, getVaultStats, incrementVaultItemStats,
  recordPpvPrice, getPpvPriceHistoryForContent, getPpvAcceptanceRate, suggestPpvPrice,
  addTeamMember, getTeamByCreator, getTeamMemberById, updateTeamMember,
  removeTeamMember, getTeamPerformance,
  trackSocialTraffic, getSocialTrafficStats,
  saveDailySnapshot, getDailySnapshots, getLatestSnapshot, collectDailyMetrics,
} from "./creatorToolsDb";

// ============================================================
// FAN CRM ROUTER
// ============================================================
export const fanCrmRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return getFanCrmStats(ctx.user.id);
  }),

  list: protectedProcedure.input(z.object({
    spendingTier: z.string().optional(),
    minScore: z.number().optional(),
    isAtRisk: z.boolean().optional(),
    sortBy: z.enum(['engagementScore', 'lifetimeSpend', 'lastActiveAt', 'createdAt']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return getFansByCreator(ctx.user.id, input || undefined);
  }),

  getProfile: protectedProcedure.input(z.object({ fanUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getFanProfile(input.fanUserId, ctx.user.id);
    }),

  updateProfile: protectedProcedure.input(z.object({
    fanUserId: z.number(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    preferredLanguage: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const profile = await getOrCreateFanProfile(input.fanUserId, ctx.user.id);
    await updateFanProfile(profile.id, {
      notes: input.notes,
      tags: input.tags,
      timezone: input.timezone,
      preferredLanguage: input.preferredLanguage,
    });
    return { success: true };
  }),

  recalculateScore: protectedProcedure.input(z.object({ fanUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getOrCreateFanProfile(input.fanUserId, ctx.user.id);
      const daysSinceLastActive = profile.lastActiveAt
        ? Math.floor((Date.now() - new Date(profile.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const { score, tier } = calculateFanScore({
        totalMessages: profile.totalMessages,
        totalTips: profile.totalTips,
        totalPurchases: profile.totalPurchases,
        lifetimeSpend: Number(profile.lifetimeSpend),
        daysSinceLastActive,
        avgResponseTime: profile.avgResponseTime,
      });
      await updateFanProfile(profile.id, {
        engagementScore: score,
        spendingTier: tier,
        isAtRisk: tier === 'dormant' || daysSinceLastActive > 14,
      });
      return { score, tier };
    }),
});

// ============================================================
// MESSAGE TEMPLATES ROUTER
// ============================================================
export const messageTemplateRouter = router({
  list: protectedProcedure.input(z.object({
    category: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return getMessageTemplatesByCreator(ctx.user.id, input?.category);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getMessageTemplateById(input.id);
    }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1).max(200),
    content: z.string().min(1),
    category: z.enum(["welcome", "followup", "promotion", "winback", "ppv", "custom"]),
    variables: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await createMessageTemplate({
      creatorUserId: ctx.user.id,
      ...input,
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    content: z.string().optional(),
    category: z.enum(["welcome", "followup", "promotion", "winback", "ppv", "custom"]).optional(),
    variables: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateMessageTemplate(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMessageTemplate(input.id);
      return { success: true };
    }),
});

// ============================================================
// AUTOMATIONS ROUTER
// ============================================================
export const automationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAutomationsByCreator(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getAutomationById(input.id);
    }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1).max(200),
    trigger: z.enum(["new_subscriber", "inactive_days", "purchase", "tip", "birthday", "custom"]),
    triggerValue: z.string().optional(),
    templateId: z.number().optional(),
    messageContent: z.string().optional(),
    audienceFilter: z.object({
      spendingTier: z.array(z.string()).optional(),
      minEngagementScore: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
    delayMinutes: z.number().default(0),
    sendAtOptimalTime: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const id = await createMessageAutomation({
      creatorUserId: ctx.user.id,
      ...input,
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    isActive: z.boolean().optional(),
    messageContent: z.string().optional(),
    delayMinutes: z.number().optional(),
    sendAtOptimalTime: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateAutomation(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAutomation(input.id);
      return { success: true };
    }),
});

// ============================================================
// CAMPAIGNS ROUTER
// ============================================================
export const campaignRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCampaignsByCreator(ctx.user.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCampaignById(input.id);
    }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1).max(200),
    messageContent: z.string().min(1),
    templateId: z.number().optional(),
    audienceFilter: z.object({
      spendingTier: z.array(z.string()).optional(),
      minEngagementScore: z.number().optional(),
      tags: z.array(z.string()).optional(),
      lastActiveWithinDays: z.number().optional(),
    }).optional(),
    attachedContentId: z.number().optional(),
    ppvPrice: z.string().optional(),
    scheduledAt: z.date().optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await createCampaign({
      creatorUserId: ctx.user.id,
      ...input,
      ppvPrice: input.ppvPrice || undefined,
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    messageContent: z.string().optional(),
    status: z.enum(["draft", "scheduled", "sending", "sent", "cancelled"]).optional(),
    scheduledAt: z.date().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateCampaign(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCampaign(input.id);
      return { success: true };
    }),
});

// ============================================================
// CONTENT VAULT ROUTER
// ============================================================
export const vaultRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getVaultStats(ctx.user.id);
  }),

  list: protectedProcedure.input(z.object({
    folder: z.string().optional(),
    category: z.string().optional(),
    contentType: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'salesCount', 'totalRevenue', 'viewCount']).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return getVaultItemsByCreator(ctx.user.id, input || undefined);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getVaultItemById(input.id);
    }),

  create: protectedProcedure.input(z.object({
    title: z.string().min(1).max(200),
    contentType: z.enum(["image", "video", "gallery", "audio"]),
    url: z.string().url(),
    thumbnailUrl: z.string().optional(),
    folder: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    defaultPpvPrice: z.string().optional(),
    isExclusive: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const id = await createVaultItem({
      creatorUserId: ctx.user.id,
      ...input,
      defaultPpvPrice: input.defaultPpvPrice || undefined,
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    folder: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    defaultPpvPrice: z.string().optional(),
    isExclusive: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateVaultItem(id, data);
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVaultItem(input.id);
      return { success: true };
    }),

  incrementStat: protectedProcedure.input(z.object({
    id: z.number(),
    field: z.enum(['viewCount', 'salesCount', 'timesSent']),
  })).mutation(async ({ input }) => {
    await incrementVaultItemStats(input.id, input.field);
    return { success: true };
  }),
});

// ============================================================
// PPV PRICE OPTIMIZER ROUTER
// ============================================================
export const ppvOptimizerRouter = router({
  suggest: protectedProcedure.input(z.object({
    fanUserId: z.number(),
    contentType: z.string(),
    basePrice: z.number(),
  })).query(async ({ ctx, input }) => {
    const profile = await getOrCreateFanProfile(input.fanUserId, ctx.user.id);
    return suggestPpvPrice({
      engagementScore: profile.engagementScore,
      lifetimeSpend: Number(profile.lifetimeSpend),
      totalPurchases: profile.totalPurchases,
      spendingTier: profile.spendingTier,
    }, input.contentType, input.basePrice);
  }),

  recordPrice: protectedProcedure.input(z.object({
    contentId: z.number(),
    fanUserId: z.number().optional(),
    price: z.string(),
    wasAccepted: z.boolean(),
    suggestedByAi: z.boolean().default(false),
  })).mutation(async ({ input }) => {
    await recordPpvPrice(input);
    return { success: true };
  }),

  getHistory: protectedProcedure.input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return getPpvPriceHistoryForContent(input.contentId);
    }),

  getAcceptanceRate: protectedProcedure.input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return getPpvAcceptanceRate(input.contentId);
    }),
});

// ============================================================
// TEAM MANAGEMENT ROUTER
// ============================================================
export const teamRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTeamByCreator(ctx.user.id);
  }),

  performance: protectedProcedure.query(async ({ ctx }) => {
    return getTeamPerformance(ctx.user.id);
  }),

  add: protectedProcedure.input(z.object({
    memberUserId: z.number(),
    role: z.enum(["manager", "chatter", "moderator", "viewer"]),
    permissions: z.object({
      canChat: z.boolean(),
      canSendPpv: z.boolean(),
      canViewAnalytics: z.boolean(),
      canManageContent: z.boolean(),
      canManageTeam: z.boolean(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await addTeamMember({
      creatorUserId: ctx.user.id,
      ...input,
    });
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    role: z.enum(["manager", "chatter", "moderator", "viewer"]).optional(),
    isActive: z.boolean().optional(),
    permissions: z.object({
      canChat: z.boolean(),
      canSendPpv: z.boolean(),
      canViewAnalytics: z.boolean(),
      canManageContent: z.boolean(),
      canManageTeam: z.boolean(),
    }).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateTeamMember(id, data);
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await removeTeamMember(input.id);
      return { success: true };
    }),
});

// ============================================================
// SOCIAL TRAFFIC ROUTER
// ============================================================
export const socialTrafficRouter = router({
  track: publicProcedure.input(z.object({
    platform: z.enum(["tiktok", "instagram", "twitter", "youtube", "reddit", "pinterest", "other"]),
    referrerUrl: z.string().optional(),
    landingPage: z.string().optional(),
    userId: z.number().optional(),
  })).mutation(async ({ input }) => {
    await trackSocialTraffic(input);
    return { success: true };
  }),

  stats: protectedProcedure.input(z.object({
    days: z.number().default(30),
  }).optional()).query(async ({ input }) => {
    return getSocialTrafficStats(input?.days || 30);
  }),
});

// ============================================================
// DAILY SNAPSHOTS ROUTER
// ============================================================
export const snapshotRouter = router({
  latest: protectedProcedure.query(async () => {
    return getLatestSnapshot();
  }),

  history: protectedProcedure.input(z.object({
    days: z.number().default(30),
  }).optional()).query(async ({ input }) => {
    return getDailySnapshots(input?.days || 30);
  }),

  takeSnapshot: protectedProcedure.mutation(async () => {
    const metrics = await collectDailyMetrics();
    await saveDailySnapshot(metrics);
    return metrics;
  }),
});
