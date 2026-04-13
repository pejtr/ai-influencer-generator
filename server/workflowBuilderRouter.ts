import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createWorkflowProject,
  getWorkflowProjects,
  updateWorkflowProject,
  deleteWorkflowProject,
  saveWorkflowPrompt,
  getWorkflowPrompts,
  deleteWorkflowPrompt,
} from "./workflowBuilderDb";

// ============ CAMERA MOVEMENTS LIBRARY ============
export const CAMERA_MOVEMENTS_CINEMATIC = [
  { id: "slow_aerial_push", label: "Slow Aerial Push", description: "Slow aerial push over landscape", example: "Slow aerial push over neon skyline" },
  { id: "dolly_in", label: "Dolly In", description: "Tight dolly in toward subject", example: "Tight dolly in as fingers hack terminal" },
  { id: "static_medium", label: "Static Medium Shot", description: "Locked medium shot, no movement", example: "Static medium shot, subject centered" },
  { id: "handheld_push", label: "Handheld Push Forward", description: "Shaky handheld push toward subject", example: "Handheld push forward through crowd" },
  { id: "tracking_close", label: "Tracking Close-Up", description: "Camera tracks alongside subject", example: "Tracking close-up along platform edge" },
  { id: "wide_reveal", label: "Wide Reveal", description: "Camera pulls back to reveal wide shot", example: "Wide reveal of epic landscape" },
  { id: "creeping_close", label: "Slow Creeping Close-Up", description: "Very slow creep toward face/subject", example: "Slow creeping close-up on eyes" },
  { id: "epic_crane", label: "Epic Crane Up", description: "Camera cranes upward dramatically", example: "Epic crane up revealing city skyline" },
  { id: "shaking_medium", label: "Shaking Medium Shot", description: "Intense shaking medium shot", example: "Shaking medium shot, explosion nearby" },
  { id: "locked_close", label: "Locked Close-Up", description: "Perfectly still close-up shot", example: "Locked close-up on face, no movement" },
  { id: "wide_static_down", label: "Wide Static Down Shot", description: "Overhead static wide shot", example: "Wide static down shot of crowd" },
  { id: "gentle_push_in", label: "Gentle Push-In", description: "Subtle slow push toward subject", example: "Gentle push-in on product detail" },
  { id: "truck_left", label: "Truck Left", description: "Camera moves laterally left", example: "Truck left revealing hidden room" },
  { id: "truck_right", label: "Truck Right", description: "Camera moves laterally right", example: "Truck right following running subject" },
  { id: "tilt_up", label: "Tilt Up", description: "Camera tilts upward", example: "Tilt up from feet to face" },
  { id: "tilt_down", label: "Tilt Down", description: "Camera tilts downward", example: "Tilt down from sky to subject" },
  { id: "zoom_in", label: "Zoom In", description: "Optical zoom toward subject", example: "Zoom in on product detail" },
  { id: "zoom_out", label: "Zoom Out", description: "Optical zoom away from subject", example: "Zoom out revealing full scene" },
  { id: "orbit_360", label: "360° Orbit", description: "Camera orbits around subject", example: "360 orbit around character" },
  { id: "dutch_angle", label: "Dutch Angle Push", description: "Tilted camera push for tension", example: "Dutch angle push in thriller scene" },
];

// ============ MODEL SELECTOR DATA ============
export const AI_MODELS = [
  {
    id: "cinema_studio_3",
    name: "Cinema Studio 3.0",
    provider: "Higgsfield",
    bestFor: "Multi-shot, full production, native audio, genre presets",
    features: ["Genre presets (Action/Horror/Comedy/Noir/Drama/Epic)", "Speed Ramp (Linear/Slow-mo/Bullet Time/Impact)", "Up to 9 reference images", "Native audio generation"],
    creditCost: 10,
    outputLength: "5-30 seconds",
    resolution: "1080p",
    badge: "🎬 Best for Cinematic",
  },
  {
    id: "seedance_2",
    name: "Seedance 2.0",
    provider: "ByteDance",
    bestFor: "Character-driven, face swaps, 2K native quality",
    features: ["Up to 12 input images", "Character consistency", "2K native resolution", "Style transfer"],
    creditCost: 8,
    outputLength: "3-15 seconds",
    resolution: "2K",
    badge: "👤 Best for Characters",
  },
  {
    id: "veo_3",
    name: "Veo 3.1",
    provider: "Google DeepMind",
    bestFor: "Realistic footage, documentary, broadcast-ready",
    features: ["Photorealistic output", "Documentary style", "Broadcast quality", "Long sequences"],
    creditCost: 12,
    outputLength: "5-60 seconds",
    resolution: "4K",
    badge: "📹 Best for Realism",
  },
  {
    id: "kling_3",
    name: "Kling 3.0",
    provider: "Kuaishou",
    bestFor: "Quick clips, great value, fast generation",
    features: ["Fast generation", "Good value", "Motion consistency", "I2V + T2V"],
    creditCost: 5,
    outputLength: "3-10 seconds",
    resolution: "1080p",
    badge: "⚡ Best Value",
  },
  {
    id: "lipsync_studio",
    name: "Lipsync Studio",
    provider: "Higgsfield",
    bestFor: "Talking-head UGC, AI influencer videos",
    features: ["Lip sync to audio", "Face consistency", "UGC style", "Multiple languages"],
    creditCost: 6,
    outputLength: "3-30 seconds",
    resolution: "1080p",
    badge: "💬 Best for Talking Head",
  },
  {
    id: "sora_2",
    name: "Sora 2",
    provider: "OpenAI",
    bestFor: "Creative, stylized, experimental content",
    features: ["Creative freedom", "Stylized output", "Experimental", "Unique aesthetics"],
    creditCost: 15,
    outputLength: "5-20 seconds",
    resolution: "1080p",
    badge: "🎨 Best for Creative",
  },
];

// ============ WORKFLOW BUILDER ROUTER ============
export const workflowBuilderRouter = router({
  // Get all AI models
  getModels: publicProcedure.query(() => {
    return AI_MODELS;
  }),

  // Get camera movements
  getCameraMovements: publicProcedure.query(() => {
    return CAMERA_MOVEMENTS_CINEMATIC;
  }),

  // Get user's workflow projects
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return getWorkflowProjects(ctx.user.id);
  }),

  // Create a new workflow project
  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      modelId: z.string(),
      genre: z.string().optional(),
      speedRamp: z.string().optional(),
      cinematicBible: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createWorkflowProject({
        userId: ctx.user.id,
        name: input.name,
        modelId: input.modelId,
        genre: input.genre || null,
        speedRamp: input.speedRamp || null,
        cinematicBible: input.cinematicBible || null,
      });
    }),

  // Update a workflow project
  updateProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().optional(),
      modelId: z.string().optional(),
      genre: z.string().nullable().optional(),
      speedRamp: z.string().nullable().optional(),
      cinematicBible: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...data } = input;
      return updateWorkflowProject(projectId, ctx.user.id, data as any);
    }),

  // Save a prompt to a project
  savePrompt: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      composition: z.string().optional(),
      subject: z.string().optional(),
      cameraMovement: z.string().optional(),
      mood: z.string().optional(),
      fullPrompt: z.string().optional(),
      sceneNumber: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return saveWorkflowPrompt({
        userId: ctx.user.id,
        projectId: input.projectId || null,
        composition: input.composition || null,
        subject: input.subject || null,
        cameraMovement: input.cameraMovement || null,
        mood: input.mood || null,
        fullPrompt: input.fullPrompt || null,
        sceneNumber: input.sceneNumber || 1,
      });
    }),

  // Get prompts for a project
  getPrompts: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getWorkflowPrompts(input.projectId, ctx.user.id);
    }),

  // Delete a prompt
  deletePrompt: protectedProcedure
    .input(z.object({ promptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return deleteWorkflowPrompt(input.promptId, ctx.user.id);
    }),

  // AI: Generate full prompt from 4 steps
  generateFullPrompt: protectedProcedure
    .input(z.object({
      composition: z.string(),
      subject: z.string(),
      cameraMovement: z.string(),
      mood: z.string(),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert AI video prompt engineer specializing in cinematic video generation.
Your task is to combine 4 prompt components into a single, optimized video generation prompt.
The prompt should be under 150 words, highly specific, and optimized for the selected AI model.
Format: Single paragraph, no bullet points. Start with the most visually important element.
Style: Cinematic, professional, specific camera language.`;

      const userPrompt = `Combine these 4 components into one optimized video prompt:

1. COMPOSITION: ${input.composition}
2. SUBJECT: ${input.subject}  
3. CAMERA MOVEMENT: ${input.cameraMovement}
4. MOOD/STYLE: ${input.mood}
${input.modelId ? `\nOptimize for: ${input.modelId}` : ""}

Output ONLY the final combined prompt, nothing else.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const fullPrompt = typeof rawContent === "string" ? rawContent : "";
      return { fullPrompt: fullPrompt.trim() };
    }),

  // AI: Generate cinematic bible for character consistency
  generateCinematicBible: protectedProcedure
    .input(z.object({
      characterName: z.string(),
      genre: z.string(),
      visualStyle: z.string(),
      colorPalette: z.string().optional(),
      characterDescription: z.string(),
      setting: z.string(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a Hollywood script supervisor creating a cinematic bible for AI video generation.
A cinematic bible ensures perfect visual and narrative consistency across all generated scenes.
Output a structured cinematic bible that locks in: genre, visual style, color palette, character rules, and scene format.`;

      const userPrompt = `Create a cinematic bible for:
- Character: ${input.characterName}
- Genre: ${input.genre}
- Visual Style: ${input.visualStyle}
- Color Palette: ${input.colorPalette || "to be determined"}
- Character Description: ${input.characterDescription}
- Setting: ${input.setting}

Include:
1. GENRE & TONE (2-3 sentences)
2. VISUAL STYLE (lighting, color grading, film grain)
3. CHARACTER RULES (exact appearance, costume, signature items — must be identical every scene)
4. SCENE FORMAT (Setting | Characters | Action | Emotion | Camera Shot | Visual Details)
5. ANIMATION PROMPT RULES (under 15 words, cinematic language)
6. VOICEOVER STYLE (10-14 words/scene, present tense, trailer style)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const rawBible = response.choices[0]?.message?.content || "";
      const bible = typeof rawBible === "string" ? rawBible : "";
      return { cinematicBible: bible.trim() };
    }),

  // AI: Generate voiceover script from scene descriptions
  generateVoiceoverScript: protectedProcedure
    .input(z.object({
      scenes: z.array(z.string()),
      style: z.enum(["thriller", "dramatic", "inspirational", "documentary", "commercial"]),
      voice: z.enum(["adam", "true_crime", "narrator", "energetic"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const styleGuides = {
        thriller: "Tense, suspenseful, short punchy sentences. Max 12 words per line.",
        dramatic: "Powerful, emotional, present tense. Max 14 words per line.",
        inspirational: "Uplifting, motivational, action-oriented. Max 12 words per line.",
        documentary: "Authoritative, informative, clear. Max 15 words per line.",
        commercial: "Energetic, benefit-focused, call-to-action. Max 10 words per line.",
      };

      const userPrompt = `Write a voiceover script for these ${input.scenes.length} scenes:
${input.scenes.map((s, i) => `Scene ${i + 1}: ${s}`).join("\n")}

Style: ${styleGuides[input.style]}
Format: One line per scene, numbered. Present tense. Film trailer style.
Voice recommendation: ${input.voice || "adam"} (ElevenLabs)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a Hollywood narration writer creating punchy, cinematic voiceover scripts." },
          { role: "user", content: userPrompt },
        ],
      });

      const rawScript = response.choices[0]?.message?.content || "";
      const script = typeof rawScript === "string" ? rawScript : "";
      return { script: script.trim() };
    }),

  // Delete a project
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return deleteWorkflowProject(input.projectId, ctx.user.id);
    }),
});
