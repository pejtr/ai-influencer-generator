import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  recordAffiliateClick,
  markClickConverted,
  getClickStats,
  getClicksBySource,
  getDailyStats,
  getAffiliateSummaryStats,
  requestPayout,
  getPayoutHistory,
  getCommissionHistory,
  getAllPendingPayouts,
  processPayoutRequest,
  getAllAffiliatesPerformance,
  upsertDailyStat,
} from "./affiliateTrackingDb";
import { getAffiliateByUserId, getAffiliateByCode } from "./db";

export const affiliateTrackingRouter = router({
  // ── Public: Record Click ──────────────────────────────────────────────
  recordClick: publicProcedure
    .input(
      z.object({
        affiliateCode: z.string().min(1),
        referrerUrl: z.string().optional(),
        landingPage: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const affiliate = await getAffiliateByCode(input.affiliateCode);
      if (!affiliate) return { recorded: false };

      const ip = (ctx.req as any)?.ip || (ctx.req as any)?.connection?.remoteAddress;
      const userAgent = (ctx.req as any)?.headers?.["user-agent"];

      await recordAffiliateClick({
        affiliateCode: input.affiliateCode,
        affiliateId: affiliate.id,
        referrerUrl: input.referrerUrl,
        landingPage: input.landingPage,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        ip,
        userAgent,
      });

      // Update daily stats
      const today = new Date().toISOString().slice(0, 10);
      await upsertDailyStat({
        affiliateId: affiliate.id,
        affiliateCode: input.affiliateCode,
        date: today,
        clicks: 1,
      });

      return { recorded: true };
    }),

  // ── Dashboard: Summary Stats ──────────────────────────────────────────
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const affiliate = await getAffiliateByUserId(ctx.user.id);
    if (!affiliate) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
    }
    return getAffiliateSummaryStats(affiliate.id);
  }),

  // ── Dashboard: Daily Chart Data ───────────────────────────────────────
  getDailyStats: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
      }
      return getDailyStats(affiliate.id, input.days);
    }),

  // ── Dashboard: Click Sources ──────────────────────────────────────────
  getClickSources: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
      }
      return getClicksBySource(affiliate.id, input.days);
    }),

  // ── Dashboard: Commission History ─────────────────────────────────────
  getCommissions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
      }
      return getCommissionHistory(affiliate.id, input.limit);
    }),

  // ── Payouts: Request ──────────────────────────────────────────────────
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(50),
        method: z.enum(["stripe", "paypal", "bank"]),
        paypalEmail: z.string().email().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
      }
      try {
        await requestPayout({
          affiliateId: affiliate.id,
          amount: input.amount,
          method: input.method,
          paypalEmail: input.paypalEmail,
          notes: input.notes,
        });
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),

  // ── Payouts: History ──────────────────────────────────────────────────
  getPayouts: protectedProcedure.query(async ({ ctx }) => {
    const affiliate = await getAffiliateByUserId(ctx.user.id);
    if (!affiliate) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
    }
    return getPayoutHistory(affiliate.id);
  }),

  // ── UTM Link Builder ──────────────────────────────────────────────────
  buildTrackingLink: protectedProcedure
    .input(
      z.object({
        baseUrl: z.string().url().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const affiliate = await getAffiliateByUserId(ctx.user.id);
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not an affiliate" });
      }

      const base = input.baseUrl || `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://ai-influencer.manus.space"}`;
      const params = new URLSearchParams();
      params.set("ref", affiliate.affiliateCode);
      if (input.utmSource) params.set("utm_source", input.utmSource);
      if (input.utmMedium) params.set("utm_medium", input.utmMedium);
      if (input.utmCampaign) params.set("utm_campaign", input.utmCampaign);

      return {
        trackingUrl: `${base}?${params.toString()}`,
        affiliateCode: affiliate.affiliateCode,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${base}?${params.toString()}`)}`,
      };
    }),

  // ── Admin: All Pending Payouts ────────────────────────────────────────
  adminGetPendingPayouts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getAllPendingPayouts();
  }),

  // ── Admin: Process Payout ─────────────────────────────────────────────
  adminProcessPayout: protectedProcedure
    .input(
      z.object({
        payoutId: z.number(),
        action: z.enum(["approve", "reject"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return processPayoutRequest(input.payoutId, input.action, input.adminNotes);
    }),

  // ── Admin: All Affiliates Performance ────────────────────────────────
  adminGetPerformance: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getAllAffiliatesPerformance();
  }),
});
