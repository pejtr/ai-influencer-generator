/**
 * POV Scene Rebuild Router
 *
 * AI-powered scene reconstruction from a chosen character's point of view.
 * Uses LLM to rewrite any scene description as a Higgsfield/Kling-ready prompt
 * from the perspective of a specific character with emotional context.
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { povRebuildHistory } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ── Constants ─────────────────────────────────────────────────────────────────

export const POV_CHARACTERS = [
  {
    id: "protagonist",
    label: "Protagonist",
    description: "The hero — driven, determined, sees obstacles as challenges",
    cameraStyle: "eye-level tracking shot, slight forward lean",
    icon: "🦸",
  },
  {
    id: "antagonist",
    label: "Antagonist",
    description: "The villain — calculating, powerful, views others as pawns",
    cameraStyle: "slightly elevated angle, slow deliberate movement",
    icon: "🦹",
  },
  {
    id: "bystander",
    label: "Bystander",
    description: "Witness — neutral, observational, capturing raw reality",
    cameraStyle: "handheld documentary style, natural framing",
    icon: "👁️",
  },
  {
    id: "camera_operator",
    label: "Camera Operator",
    description: "The filmmaker — technical, artistic, sees in cinematic frames",
    cameraStyle: "professional cinematography, intentional composition",
    icon: "🎬",
  },
  {
    id: "child",
    label: "Child",
    description: "Innocent wonder — everything is magical and oversized",
    cameraStyle: "low angle, wide-eyed perspective, slightly tilted",
    icon: "👶",
  },
  {
    id: "predator",
    label: "Predator / Hunter",
    description: "Focused, patient, everything is a target or threat",
    cameraStyle: "slow zoom, narrow focus, tension-building",
    icon: "🐺",
  },
  {
    id: "custom",
    label: "Custom Character",
    description: "Define your own character with custom traits",
    cameraStyle: "adaptive to character description",
    icon: "✏️",
  },
] as const;

export const EMOTIONS = [
  { id: "fear", label: "Fear", color: "blue", description: "Heart racing, hyperaware of danger" },
  { id: "excitement", label: "Excitement", color: "yellow", description: "Electric energy, everything feels possible" },
  { id: "curiosity", label: "Curiosity", color: "purple", description: "Drawn in, questioning, exploring" },
  { id: "determination", label: "Determination", color: "red", description: "Unstoppable focus, tunnel vision" },
  { id: "grief", label: "Grief", color: "gray", description: "Heavy, slow, world feels muted" },
  { id: "awe", label: "Awe", color: "cyan", description: "Overwhelmed by beauty or scale" },
  { id: "rage", label: "Rage", color: "orange", description: "Explosive, primal, uncontrolled energy" },
  { id: "calm", label: "Calm", color: "green", description: "Still, present, meditative clarity" },
] as const;

export const VIDEO_MODELS = [
  { id: "higgsfield", label: "Higgsfield Cinema Studio 3.0", promptStyle: "cinematic, photorealistic" },
  { id: "kling", label: "Kling 3.0", promptStyle: "dynamic motion, character-focused" },
  { id: "veo3", label: "Veo 3.1", promptStyle: "JSON-structured, audio-aware" },
  { id: "seedance", label: "Seedance 2.0", promptStyle: "fluid motion, artistic" },
] as const;

// ── LLM Prompt Builder ────────────────────────────────────────────────────────

function buildSystemPrompt(targetModel: string): string {
  const modelStyle = VIDEO_MODELS.find((m) => m.id === targetModel)?.promptStyle ?? "cinematic";
  return `You are an expert AI video prompt engineer specializing in POV (point-of-view) cinematography for ${targetModel} video generation.

Your task: Take a scene description and rewrite it as a first-person POV video prompt from the perspective of a specific character, optimized for ${targetModel} (${modelStyle}).

Rules:
1. Write in present tense, immersive first-person perspective
2. Include specific camera movement (e.g., "handheld tracking", "slow push-in", "whip pan")
3. Include lighting description that matches the emotional state
4. Include sensory details: what the character sees, hears, feels
5. End with a technical camera note for the AI model
6. Keep the prompt between 80-150 words — concise but rich
7. Do NOT use "I" — describe what is SEEN, not felt internally
8. Output ONLY the prompt text, no labels or explanations`;
}

function buildUserPrompt(
  sceneDescription: string,
  characterId: string,
  customCharacter: string | undefined,
  emotion: string,
  targetModel: string
): string {
  const character = POV_CHARACTERS.find((c) => c.id === characterId);
  const emotionData = EMOTIONS.find((e) => e.id === emotion);
  const characterDesc =
    characterId === "custom" && customCharacter
      ? customCharacter
      : character?.description ?? "neutral observer";
  const cameraStyle = character?.cameraStyle ?? "natural framing";

  return `Scene to rebuild:
"${sceneDescription}"

Character perspective: ${character?.label ?? customCharacter ?? "Custom"} — ${characterDesc}
Emotional state: ${emotionData?.label ?? emotion} — ${emotionData?.description ?? ""}
Camera style base: ${cameraStyle}
Target model: ${targetModel}

Rewrite this scene as a ${targetModel}-optimized POV video prompt from this character's perspective with the specified emotional state.`;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const povRebuildRouter = router({
  /**
   * Get all available POV characters, emotions, and video models
   */
  getOptions: publicProcedure.query(() => {
    return {
      characters: POV_CHARACTERS,
      emotions: EMOTIONS,
      videoModels: VIDEO_MODELS,
    };
  }),

  /**
   * Generate a POV-rebuilt prompt from a scene description
   */
  generatePovPrompt: protectedProcedure
    .input(
      z.object({
        sceneDescription: z.string().min(10).max(2000),
        characterId: z.string(),
        customCharacter: z.string().max(500).optional(),
        emotion: z.string(),
        targetModel: z.string().default("higgsfield"),
        saveToHistory: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sceneDescription, characterId, customCharacter, emotion, targetModel, saveToHistory } = input;

      const systemPrompt = buildSystemPrompt(targetModel);
      const userPrompt = buildUserPrompt(sceneDescription, characterId, customCharacter, emotion, targetModel);

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const generatedPrompt =
        (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!generatedPrompt) {
        throw new Error("Failed to generate POV prompt — LLM returned empty response");
      }

      // Save to history if requested
      if (saveToHistory) {
        try {
          const db = await getDb();
          if (db) {
            await db.insert(povRebuildHistory).values({
              userId: ctx.user.id,
              sceneDescription,
              characterId,
              customCharacter: customCharacter ?? null,
              emotion,
              targetModel,
              generatedPrompt,
              createdAt: new Date(),
            });
          }
        } catch (err) {
          // Non-fatal — log but don't fail the mutation
          console.error("[POV Rebuild] Failed to save history:", err);
        }
      }

      const character = POV_CHARACTERS.find((c) => c.id === characterId);
      const emotionData = EMOTIONS.find((e) => e.id === emotion);
      const modelData = VIDEO_MODELS.find((m) => m.id === targetModel);

      return {
        prompt: generatedPrompt,
        metadata: {
          character: character?.label ?? customCharacter ?? "Custom",
          characterIcon: character?.icon ?? "✏️",
          emotion: emotionData?.label ?? emotion,
          targetModel: modelData?.label ?? targetModel,
          wordCount: generatedPrompt.split(/\s+/).length,
        },
      };
    }),

  /**
   * Get the user's POV rebuild history
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(povRebuildHistory)
        .where(eq(povRebuildHistory.userId, ctx.user.id))
        .orderBy(desc(povRebuildHistory.createdAt))
        .limit(input.limit);

      return rows;
    }),

  /**
   * Delete a history entry
   */
  deleteHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .delete(povRebuildHistory)
        .where(
          eq(povRebuildHistory.id, input.id)
        );

      return { success: true };
    }),

  /**
   * Generate multiple POV variants of the same scene (batch — 3 characters at once)
   */
  generateBatchPov: protectedProcedure
    .input(
      z.object({
        sceneDescription: z.string().min(10).max(2000),
        characterIds: z.array(z.string()).min(1).max(4),
        emotion: z.string(),
        targetModel: z.string().default("higgsfield"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sceneDescription, characterIds, emotion, targetModel } = input;

      const results = await Promise.all(
        characterIds.map(async (characterId) => {
          const systemPrompt = buildSystemPrompt(targetModel);
          const userPrompt = buildUserPrompt(sceneDescription, characterId, undefined, emotion, targetModel);

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          const generatedPrompt =
            (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content?.trim() ?? "";

          const character = POV_CHARACTERS.find((c) => c.id === characterId);

          return {
            characterId,
            characterLabel: character?.label ?? characterId,
            characterIcon: character?.icon ?? "✏️",
            prompt: generatedPrompt,
          };
        })
      );

      // Save all to history
      try {
        const db = await getDb();
        if (db) {
          await db.insert(povRebuildHistory).values(
            results.map((r) => ({
              userId: ctx.user.id,
              sceneDescription,
              characterId: r.characterId,
              customCharacter: null,
              emotion,
              targetModel,
              generatedPrompt: r.prompt,
              createdAt: new Date(),
            }))
          );
        }
      } catch (err) {
        console.error("[POV Rebuild Batch] Failed to save history:", err);
      }

      return { results };
    }),
});
