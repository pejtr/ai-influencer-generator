import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { brandVoiceDocs, generatedScripts, hookSwipeFile, contentCalendar } from "../drizzle/schema";
import { eq, and, desc, like, gte } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Brand Voice Docs ────────────────────────────────────────────────────────

const brandVoiceRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    return db.select().from(brandVoiceDocs)
      .where(eq(brandVoiceDocs.userId, ctx.user.id))
      .orderBy(desc(brandVoiceDocs.updatedAt));
  }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(brandVoiceDocs)
      .where(and(eq(brandVoiceDocs.userId, ctx.user.id), eq(brandVoiceDocs.isActive, true)))
      .limit(1);
    return rows[0] ?? null;
  }),

  upsert: protectedProcedure.input(z.object({
    id: z.number().optional(),
    name: z.string().min(1).max(100),
    tone: z.string(),
    vocabulary: z.string(),
    doNotSay: z.string(),
    sampleScripts: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    if (input.id) {
      await db.update(brandVoiceDocs)
        .set({ name: input.name, tone: input.tone, vocabulary: input.vocabulary, doNotSay: input.doNotSay, sampleScripts: input.sampleScripts, updatedAt: new Date() })
        .where(and(eq(brandVoiceDocs.id, input.id), eq(brandVoiceDocs.userId, ctx.user.id)));
      return { id: input.id };
    } else {
      const [result] = await db.insert(brandVoiceDocs).values({
        userId: ctx.user.id,
        name: input.name,
        tone: input.tone,
        vocabulary: input.vocabulary,
        doNotSay: input.doNotSay,
        sampleScripts: input.sampleScripts,
      });
      return { id: (result as any).insertId };
    }
  }),

  setActive: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    // Deactivate all, then activate selected
    await db.update(brandVoiceDocs).set({ isActive: false }).where(eq(brandVoiceDocs.userId, ctx.user.id));
    await db.update(brandVoiceDocs).set({ isActive: true }).where(and(eq(brandVoiceDocs.id, input.id), eq(brandVoiceDocs.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(brandVoiceDocs).where(and(eq(brandVoiceDocs.id, input.id), eq(brandVoiceDocs.userId, ctx.user.id)));
    return { success: true };
  }),
});

// ─── Script Generation ───────────────────────────────────────────────────────

const scriptRouter = router({
  generate: protectedProcedure.input(z.object({
    hook: z.string().min(5),
    topic: z.string().min(5),
    offerContext: z.string().optional().default(""),
    brandVoiceDocId: z.number().optional(),
    sampleScripts: z.string().optional().default(""),
    tone: z.string().optional().default(""),
    vocabulary: z.string().optional().default(""),
    doNotSay: z.string().optional().default(""),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // Build brand voice context
    let brandVoiceContext = "";
    if (input.brandVoiceDocId) {
      const rows = await db.select().from(brandVoiceDocs)
        .where(and(eq(brandVoiceDocs.id, input.brandVoiceDocId), eq(brandVoiceDocs.userId, ctx.user.id)))
        .limit(1);
      if (rows[0]) {
        const bv = rows[0];
        brandVoiceContext = `
BRAND VOICE DOCUMENT:
- Tone: ${bv.tone || "conversational, direct"}
- Vocabulary to use: ${bv.vocabulary || "simple, everyday language"}
- Do NOT say: ${bv.doNotSay || "nothing specific"}
- Sample scripts for voice matching:
${bv.sampleScripts || "(none provided)"}
`;
      }
    } else if (input.sampleScripts || input.tone) {
      brandVoiceContext = `
BRAND VOICE:
- Tone: ${input.tone || "conversational, direct"}
- Vocabulary: ${input.vocabulary || "simple, everyday language"}
- Do NOT say: ${input.doNotSay || "nothing specific"}
- Sample scripts: ${input.sampleScripts || "(none)"}
`;
    }

    const systemPrompt = `You are an expert short-form video script writer specializing in viral social media content.

SPOKEN-WORD RULES (MANDATORY):
- Short sentences only. Maximum 12 words per sentence.
- No em dashes (—). Use periods for stops, commas for pauses.
- No big words. Write at a 6th grade reading level.
- No filler phrases like "In today's video" or "Don't forget to like and subscribe".
- Each script must be 60-90 seconds when read aloud (150-225 words).
- Start with the hook immediately. No warm-up.
- End with a clear CTA (call to action).

${brandVoiceContext}

Generate exactly 3 script variations for the same hook and topic. Each variation must have a DIFFERENT narrative path:
- Variation A: Story/personal experience angle
- Variation B: Contrarian/surprising fact angle  
- Variation C: Step-by-step/how-to angle

Format your response as valid JSON:
{
  "variationA": "full script text...",
  "variationB": "full script text...",
  "variationC": "full script text..."
}`;

    const userPrompt = `HOOK: "${input.hook}"
TOPIC: ${input.topic}
${input.offerContext ? `OFFER/CTA CONTEXT: ${input.offerContext}` : ""}

Generate 3 script variations following all spoken-word rules.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "script_variations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              variationA: { type: "string", description: "Story/personal experience angle script" },
              variationB: { type: "string", description: "Contrarian/surprising fact angle script" },
              variationC: { type: "string", description: "Step-by-step/how-to angle script" },
            },
            required: ["variationA", "variationB", "variationC"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    const [result] = await db.insert(generatedScripts).values({
      userId: ctx.user.id,
      brandVoiceDocId: input.brandVoiceDocId ?? null,
      hook: input.hook,
      topic: input.topic,
      offerContext: input.offerContext ?? "",
      variationA: parsed.variationA ?? "",
      variationB: parsed.variationB ?? "",
      variationC: parsed.variationC ?? "",
      status: "draft",
    });

    return {
      id: (result as any).insertId,
      variationA: parsed.variationA ?? "",
      variationB: parsed.variationB ?? "",
      variationC: parsed.variationC ?? "",
    };
  }),

  selectVariation: protectedProcedure.input(z.object({
    id: z.number(),
    variation: z.enum(["A", "B", "C"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(generatedScripts)
      .set({ selectedVariation: input.variation, status: "selected" })
      .where(and(eq(generatedScripts.id, input.id), eq(generatedScripts.userId, ctx.user.id)));
    return { success: true };
  }),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(generatedScripts)
      .where(eq(generatedScripts.userId, ctx.user.id))
      .orderBy(desc(generatedScripts.createdAt))
      .limit(input.limit);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(generatedScripts).where(and(eq(generatedScripts.id, input.id), eq(generatedScripts.userId, ctx.user.id)));
    return { success: true };
  }),

  rewriteHook: protectedProcedure.input(z.object({
    originalHook: z.string(),
    targetNiche: z.string(),
    sourceNiche: z.string().optional().default(""),
  })).mutation(async ({ ctx: _ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at porting viral hooks across niches. The rule: steal the STRUCTURE, not the subject. Change only the niche-specific words (usually 3-7 words). Keep the emotional trigger and sentence rhythm identical.`,
        },
        {
          role: "user",
          content: `Original hook (from ${input.sourceNiche || "another niche"}): "${input.originalHook}"
Target niche: ${input.targetNiche}

Generate 3 hook variations for the target niche. Keep the exact same structure and emotional trigger. Only swap the niche-specific words.

Respond as JSON: { "v1": "...", "v2": "...", "v3": "..." }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hook_rewrites",
          strict: true,
          schema: {
            type: "object",
            properties: {
              v1: { type: "string" },
              v2: { type: "string" },
              v3: { type: "string" },
            },
            required: ["v1", "v2", "v3"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── Hook Swipe File ─────────────────────────────────────────────────────────

const hookSwipeRouter = router({
  getAll: protectedProcedure.input(z.object({
    search: z.string().optional(),
    niche: z.string().optional(),
    minOutlier: z.number().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    let query = db.select().from(hookSwipeFile)
      .where(eq(hookSwipeFile.userId, ctx.user.id))
      .orderBy(desc(hookSwipeFile.outlierScore));
    return query;
  }),

  add: protectedProcedure.input(z.object({
    hookText: z.string().min(5),
    sourceNiche: z.string().optional().default(""),
    sourceUrl: z.string().optional().default(""),
    engagementRate: z.number().min(0).max(100).optional().default(0),
    outlierScore: z.number().min(0).max(100).optional().default(0),
    tags: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(hookSwipeFile).values({
      userId: ctx.user.id,
      hookText: input.hookText,
      sourceNiche: input.sourceNiche,
      sourceUrl: input.sourceUrl ?? "",
      engagementRate: String(input.engagementRate),
      outlierScore: input.outlierScore,
      tags: input.tags,
      notes: input.notes ?? "",
    });
    return { id: (result as any).insertId };
  }),

  incrementUsed: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const rows = await db.select({ timesUsed: hookSwipeFile.timesUsed }).from(hookSwipeFile)
      .where(and(eq(hookSwipeFile.id, input.id), eq(hookSwipeFile.userId, ctx.user.id))).limit(1);
    if (rows[0]) {
      await db.update(hookSwipeFile).set({ timesUsed: rows[0].timesUsed + 1 })
        .where(eq(hookSwipeFile.id, input.id));
    }
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(hookSwipeFile).where(and(eq(hookSwipeFile.id, input.id), eq(hookSwipeFile.userId, ctx.user.id)));
    return { success: true };
  }),

  calculateEngagement: protectedProcedure.input(z.object({
    views: z.number(),
    comments: z.number(),
    likes: z.number().optional().default(0),
  })).mutation(async ({ ctx: _ctx, input }) => {
    // Loop detector: comments disproportionate to views = high engagement
    const engagementRate = ((input.comments + input.likes * 0.3) / Math.max(input.views, 1)) * 100;
    const commentRatio = (input.comments / Math.max(input.views, 1)) * 100;
    const outlierScore = Math.min(100, Math.round(
      (commentRatio > 2 ? 80 : commentRatio > 1 ? 60 : commentRatio > 0.5 ? 40 : 20) +
      (engagementRate > 5 ? 20 : engagementRate > 2 ? 10 : 0)
    ));
    return {
      engagementRate: Math.round(engagementRate * 100) / 100,
      outlierScore,
      loopDetected: commentRatio > 1,
      insight: commentRatio > 2
        ? "🔥 High loop score — this hook opened a strong conversation"
        : commentRatio > 1
        ? "✅ Good engagement — worth adding to swipe file"
        : commentRatio > 0.5
        ? "📊 Average — test with different niche"
        : "❌ Low comment ratio — hook may not be opening loops",
    };
  }),
});

// ─── Content Calendar ────────────────────────────────────────────────────────

const calendarRouter = router({
  getItems: protectedProcedure.input(z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    platform: z.string().optional(),
    status: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(contentCalendar)
      .where(eq(contentCalendar.userId, ctx.user.id))
      .orderBy(contentCalendar.scheduledDate);
  }),

  addItem: protectedProcedure.input(z.object({
    title: z.string().min(1).max(200),
    platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "twitter", "linkedin"]).default("instagram"),
    scheduledDate: z.date(),
    pipelineStatus: z.enum(["idea", "scripted", "recorded", "edited", "published"]).default("idea"),
    scriptId: z.number().optional(),
    hookId: z.number().optional(),
    notes: z.string().optional().default(""),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(contentCalendar).values({
      userId: ctx.user.id,
      title: input.title,
      platform: input.platform,
      scheduledDate: input.scheduledDate,
      pipelineStatus: input.pipelineStatus,
      scriptId: input.scriptId ?? null,
      hookId: input.hookId ?? null,
      notes: input.notes ?? "",
    });
    return { id: (result as any).insertId };
  }),

  updateStatus: protectedProcedure.input(z.object({
    id: z.number(),
    pipelineStatus: z.enum(["idea", "scripted", "recorded", "edited", "published"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(contentCalendar)
      .set({ pipelineStatus: input.pipelineStatus, updatedAt: new Date() })
      .where(and(eq(contentCalendar.id, input.id), eq(contentCalendar.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(contentCalendar).where(and(eq(contentCalendar.id, input.id), eq(contentCalendar.userId, ctx.user.id)));
    return { success: true };
  }),

  generateWeekPlan: protectedProcedure.input(z.object({
    niche: z.string(),
    offer: z.string().optional().default(""),
    platforms: z.array(z.string()).default(["instagram"]),
    postsPerDay: z.number().min(1).max(5).default(1),
  })).mutation(async ({ ctx: _ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content strategist specializing in viral short-form video. Generate a 7-day content plan with proven hook structures. Each day should have a different angle to maximize reach.`,
        },
        {
          role: "user",
          content: `Create a 7-day content calendar for:
- Niche: ${input.niche}
- Offer/CTA: ${input.offer || "book a call / DM for more info"}
- Platforms: ${input.platforms.join(", ")}
- Posts per day: ${input.postsPerDay}

For each post provide: title, hook, angle (story/contrarian/how-to), platform, and pipeline status "idea".

Respond as JSON: { "days": [{ "day": 1, "title": "...", "hook": "...", "angle": "...", "platform": "..." }] }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "week_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "integer" },
                    title: { type: "string" },
                    hook: { type: "string" },
                    angle: { type: "string" },
                    platform: { type: "string" },
                  },
                  required: ["day", "title", "hook", "angle", "platform"],
                  additionalProperties: false,
                },
              },
            },
            required: ["days"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── Main Export ─────────────────────────────────────────────────────────────

export const contentSystemRouter = router({
  brandVoice: brandVoiceRouter,
  scripts: scriptRouter,
  hooks: hookSwipeRouter,
  calendar: calendarRouter,
});
