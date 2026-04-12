import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getCourseModules, getCourseModuleById, createCourseModule, updateCourseModule, deleteCourseModule,
  getLessonsByModule, getLessonById, createLesson, updateLesson,
  isUserEnrolled, getEnrollment, createEnrollment, getEnrollmentCount,
  getUserProgress, markLessonComplete, unmarkLessonComplete, getUserProgressPercent,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getCourseBonuses, createCourseBonus,
  SEED_COURSE_MODULES, SEED_TESTIMONIALS, SEED_BONUSES,
} from "./courseDb";

export const courseRouter = router({
  // ─── Public: Sales page data ─────────────────────────────────────────────

  /** Get all active modules (for sales page & course) */
  getModules: publicProcedure.query(async () => {
    return getCourseModules();
  }),

  /** Get lessons for a module (preview lessons visible to all) */
  getLessons: publicProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const lessons = await getLessonsByModule(input.moduleId);
      const enrolled = ctx.user ? await isUserEnrolled(ctx.user.id) : false;
      // If not enrolled, only return preview lessons (hide content)
      return lessons.map((l) => ({
        ...l,
        content: enrolled || l.isPreview ? l.content : null,
        videoUrl: enrolled || l.isPreview ? l.videoUrl : null,
        isLocked: !enrolled && !l.isPreview,
      }));
    }),

  /** Get testimonials */
  getTestimonials: publicProcedure
    .input(z.object({ featuredOnly: z.boolean().optional() }))
    .query(async ({ input }) => {
      return getTestimonials(input.featuredOnly ?? false);
    }),

  /** Get bonuses */
  getBonuses: publicProcedure.query(async () => {
    return getCourseBonuses();
  }),

  /** Get enrollment count (social proof) */
  getEnrollmentCount: publicProcedure.query(async () => {
    return getEnrollmentCount();
  }),

  // ─── Protected: Enrollment & Progress ────────────────────────────────────

  /** Check if current user is enrolled */
  checkEnrollment: protectedProcedure.query(async ({ ctx }) => {
    const enrolled = await isUserEnrolled(ctx.user.id);
    const enrollment = enrolled ? await getEnrollment(ctx.user.id) : null;
    const progressPct = enrolled ? await getUserProgressPercent(ctx.user.id) : 0;
    return { enrolled, enrollment, progressPct };
  }),

  /** Get user's lesson progress */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const enrolled = await isUserEnrolled(ctx.user.id);
    if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "Not enrolled" });
    return getUserProgress(ctx.user.id);
  }),

  /** Mark a lesson as complete */
  completeLesson: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const enrolled = await isUserEnrolled(ctx.user.id);
      if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "Not enrolled" });
      await markLessonComplete(ctx.user.id, input.lessonId);
      const pct = await getUserProgressPercent(ctx.user.id);
      return { success: true, progressPct: pct };
    }),

  /** Unmark a lesson as complete */
  uncompleteLesson: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await unmarkLessonComplete(ctx.user.id, input.lessonId);
      return { success: true };
    }),

  /** Create Stripe checkout for course enrollment */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["full", "installment"]) }))
    .mutation(async ({ input, ctx }) => {
      const alreadyEnrolled = await isUserEnrolled(ctx.user.id);
      if (alreadyEnrolled) throw new TRPCError({ code: "BAD_REQUEST", message: "Already enrolled" });

      // Lazy-load Stripe to avoid import issues
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-12-15.clover" });

      const origin = ctx.req.headers.origin || "https://ai-influencer.manus.space";
      const priceAmount = input.plan === "full" ? 9700 : 4900; // cents
      const description = input.plan === "full"
        ? "AIFluencer Studio — Full Access ($97)"
        : "AIFluencer Studio — Installment 1 of 2 ($49)";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email ?? undefined,
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: priceAmount,
            product_data: {
              name: "AIFluencer Studio Course",
              description,
              images: [],
            },
          },
          quantity: 1,
        }],
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          product: "aifluencer_studio_course",
          plan: input.plan,
        },
        success_url: `${origin}/course?enrolled=1`,
        cancel_url: `${origin}/aifluencer-studio?cancelled=1`,
      });

      return { checkoutUrl: session.url };
    }),

  /** Admin: enroll user for free (testing / gifting) */
  adminEnrollFree: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const targetUserId = input.userId ?? ctx.user.id;
      const already = await isUserEnrolled(targetUserId);
      if (already) return { success: true, message: "Already enrolled" };
      await createEnrollment({ userId: targetUserId, paymentPlan: "full", amountPaid: "0" });
      return { success: true, message: "Enrolled successfully" };
    }),

  // ─── Admin: Manage content ────────────────────────────────────────────────

  adminCreateModule: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      order: z.number().optional(),
      duration: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createCourseModule(input);
    }),

  adminUpdateModule: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      order: z.number().optional(),
      duration: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateCourseModule(id, data);
      return { success: true };
    }),

  adminDeleteModule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await deleteCourseModule(input.id);
      return { success: true };
    }),

  adminCreateLesson: protectedProcedure
    .input(z.object({
      moduleId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      content: z.string().optional(),
      order: z.number().optional(),
      duration: z.string().optional(),
      isPreview: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createLesson(input);
    }),

  adminUpdateLesson: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      content: z.string().optional(),
      order: z.number().optional(),
      duration: z.string().optional(),
      isPreview: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateLesson(id, data);
      return { success: true };
    }),

  adminCreateTestimonial: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      role: z.string().optional(),
      content: z.string().min(1),
      avatarUrl: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createTestimonial(input);
    }),

  adminUpdateTestimonial: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      content: z.string().optional(),
      avatarUrl: z.string().optional(),
      rating: z.number().optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateTestimonial(id, data);
      return { success: true };
    }),

  adminDeleteTestimonial: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await deleteTestimonial(input.id);
      return { success: true };
    }),

  adminCreateBonus: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      value: z.string().optional(),
      icon: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createCourseBonus(input);
    }),

  /** Admin: seed default modules, testimonials, and bonuses */
  adminSeed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    let seeded = 0;

    // Seed modules
    const existing = await getCourseModules();
    if (existing.length === 0) {
      for (const m of SEED_COURSE_MODULES) {
        await createCourseModule(m);
        seeded++;
      }
    }

    // Seed testimonials
    const existingT = await getTestimonials();
    if (existingT.length === 0) {
      for (const t of SEED_TESTIMONIALS) {
        await createTestimonial(t);
        seeded++;
      }
    }

    // Seed bonuses
    const existingB = await getCourseBonuses();
    if (existingB.length === 0) {
      for (const b of SEED_BONUSES) {
        await createCourseBonus(b);
        seeded++;
      }
    }

    return { seeded, total: SEED_COURSE_MODULES.length + SEED_TESTIMONIALS.length + SEED_BONUSES.length };
  }),
});
