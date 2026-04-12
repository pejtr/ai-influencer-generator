import { eq, and, desc, asc, sql, like, inArray } from "drizzle-orm";
import {
  videoTemplates, InsertVideoTemplate,
  userVideoTemplates, InsertUserVideoTemplate,
} from "../drizzle/schema";
import { getDb } from "./db";

async function getDbOrThrow() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ============================================================
// VIDEO TEMPLATES CRUD
// ============================================================

export async function createVideoTemplate(data: InsertVideoTemplate) {
  const d = await getDbOrThrow();
  const result = await d.insert(videoTemplates).values(data);
  return result[0].insertId;
}

export async function getVideoTemplateById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(videoTemplates).where(eq(videoTemplates.id, id)).limit(1);
  return rows[0] || null;
}

export async function getVideoTemplateBySlug(slug: string) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(videoTemplates).where(eq(videoTemplates.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function listVideoTemplates(opts: {
  category?: string;
  search?: string;
  featured?: boolean;
  difficulty?: string;
  limit?: number;
  offset?: number;
}) {
  const d = await getDbOrThrow();
  const conditions = [eq(videoTemplates.isActive, true)];
  if (opts.category) {
    conditions.push(eq(videoTemplates.category, opts.category as any));
  }
  if (opts.featured) {
    conditions.push(eq(videoTemplates.isFeatured, true));
  }
  if (opts.difficulty) {
    conditions.push(eq(videoTemplates.difficulty, opts.difficulty as any));
  }
  if (opts.search) {
    conditions.push(like(videoTemplates.name, `%${opts.search}%`));
  }
  const rows = await d
    .select()
    .from(videoTemplates)
    .where(and(...conditions))
    .orderBy(desc(videoTemplates.usageCount))
    .limit(opts.limit || 50)
    .offset(opts.offset || 0);
  return rows;
}

export async function updateVideoTemplate(id: number, data: Partial<InsertVideoTemplate>) {
  const d = await getDbOrThrow();
  await d.update(videoTemplates).set(data).where(eq(videoTemplates.id, id));
}

export async function deleteVideoTemplate(id: number) {
  const d = await getDbOrThrow();
  await d.update(videoTemplates).set({ isActive: false }).where(eq(videoTemplates.id, id));
}

export async function incrementTemplateUsage(id: number) {
  const d = await getDbOrThrow();
  await d.update(videoTemplates)
    .set({ usageCount: sql`${videoTemplates.usageCount} + 1` })
    .where(eq(videoTemplates.id, id));
}

export async function getFeaturedTemplates(limit = 6) {
  const d = await getDbOrThrow();
  return d
    .select()
    .from(videoTemplates)
    .where(and(eq(videoTemplates.isActive, true), eq(videoTemplates.isFeatured, true)))
    .orderBy(desc(videoTemplates.usageCount))
    .limit(limit);
}

export async function getTemplateCategories() {
  const d = await getDbOrThrow();
  const rows = await d
    .select({
      category: videoTemplates.category,
      count: sql<number>`count(*)`,
    })
    .from(videoTemplates)
    .where(eq(videoTemplates.isActive, true))
    .groupBy(videoTemplates.category);
  return rows;
}

// ============================================================
// USER SAVED TEMPLATES
// ============================================================

export async function saveUserTemplate(data: InsertUserVideoTemplate) {
  const d = await getDbOrThrow();
  const result = await d.insert(userVideoTemplates).values(data);
  return result[0].insertId;
}

export async function getUserTemplates(userId: number) {
  const d = await getDbOrThrow();
  return d
    .select()
    .from(userVideoTemplates)
    .where(eq(userVideoTemplates.userId, userId))
    .orderBy(desc(userVideoTemplates.createdAt));
}

export async function deleteUserTemplate(id: number, userId: number) {
  const d = await getDbOrThrow();
  await d.delete(userVideoTemplates).where(
    and(eq(userVideoTemplates.id, id), eq(userVideoTemplates.userId, userId))
  );
}

// ============================================================
// SEED DATA - @chalkleyvisuals inspired templates
// ============================================================

export const SEED_VIDEO_TEMPLATES: InsertVideoTemplate[] = [
  // === CINEMATIC ADS ===
  {
    name: "Luxury Product Reveal",
    slug: "luxury-product-reveal",
    description: "Cinematic product reveal with dramatic lighting and slow camera push. Perfect for high-end product ads inspired by professional AI ad workflows.",
    category: "cinematic_ads",
    imagePrompt: "Ultra-realistic close-up photograph of a luxury product on a dark marble surface, dramatic volumetric lighting from the side, golden rim light, shallow depth of field, studio quality, 8K resolution, photorealistic",
    videoPrompt: "THE CAMERA PERFORMS A SLOW, SMOOTH CINEMATIC PUSH-IN toward the product. Volumetric light rays sweep across the scene. Atmospheric dust particles float in the air. PHOTOREALISTIC, CINEMATIC STILLNESS, ONLY ATMOSPHERIC PARTICLES MOVE. Professional commercial quality.",
    negativePrompt: "cartoon, anime, blurry, low quality, text, watermark",
    style: "cinematic",
    cameraMovement: "slow_push",
    lighting: "volumetric, golden rim light, dramatic side light",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["product", "luxury", "commercial", "ad", "reveal"],
    isFeatured: true,
  },
  {
    name: "Brand Story Opener",
    slug: "brand-story-opener",
    description: "Wide establishing shot that transitions into a personal brand story. Ideal for social media brand introductions and YouTube intros.",
    category: "cinematic_ads",
    imagePrompt: "Cinematic wide shot of a modern creative workspace, warm golden hour light streaming through floor-to-ceiling windows, minimalist design, plants, laptop on desk, photorealistic, 8K, rembrandt lighting",
    videoPrompt: "SLOW CINEMATIC DOLLY FORWARD through the workspace. Natural light shifts subtly. Dust particles visible in light beams. Camera glides smoothly past objects. PHOTOREALISTIC, WARM ATMOSPHERE, NATURAL MOTION ONLY.",
    negativePrompt: "cartoon, unrealistic, blurry, dark, cluttered",
    style: "cinematic",
    cameraMovement: "dolly_forward",
    lighting: "golden hour, rembrandt, warm natural",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["brand", "workspace", "intro", "story", "opener"],
    isFeatured: true,
  },
  {
    name: "Fashion Lookbook Shot",
    slug: "fashion-lookbook-shot",
    description: "High-fashion editorial shot with model walking toward camera. Perfect for fashion brand content and influencer lookbooks.",
    category: "cinematic_ads",
    imagePrompt: "Full body photograph of a fashion model in designer streetwear, standing on an empty urban street, soft overcast lighting, editorial fashion photography style, shallow depth of field, 8K photorealistic",
    videoPrompt: "Model walks confidently toward the camera with natural stride. CAMERA SLOWLY PULLS BACK while maintaining focus on the model. Wind slightly moves hair and clothing. PHOTOREALISTIC MOTION, EDITORIAL FASHION FILM QUALITY.",
    negativePrompt: "stiff, robotic, unnatural movement, cartoon",
    style: "editorial",
    cameraMovement: "pull_back",
    lighting: "soft overcast, fashion editorial",
    aspectRatio: "9:16",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "intermediate",
    tags: ["fashion", "model", "lookbook", "editorial", "streetwear"],
    isFeatured: true,
  },

  // === EMOTIONAL / ATMOSPHERIC ===
  {
    name: "Piano Solitude",
    slug: "piano-solitude",
    description: "Atmospheric scene of a figure at a grand piano in a dimly lit room. Inspired by @chalkleyvisuals emotional piano sequences using Nano Banana + Seedance Pro.",
    category: "emotional_atmospheric",
    imagePrompt: "A solitary figure sitting at a grand piano in a vast, dimly lit cathedral-like room, single beam of light from above illuminating the piano, dust particles floating in the light, moody atmosphere, photorealistic, cinematic, 8K",
    videoPrompt: "THE CAMERA PERFORMS SLOW, SMOOTH CINEMATIC PUSH-OUT ONLY. LIGHTING IS COLD. PHOTOREALISTIC, CINEMATIC STILLNESS. ONLY ATMOSPHERIC PARTICLES AND SUBTLE HAND MOVEMENT ON PIANO KEYS. Deep emotional atmosphere.",
    negativePrompt: "bright, cheerful, cartoon, blurry",
    style: "moody_cinematic",
    cameraMovement: "slow_push_out",
    lighting: "single beam, cold, atmospheric",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "seedance_pro",
    difficulty: "intermediate",
    tags: ["piano", "emotional", "atmospheric", "solitude", "moody"],
    isFeatured: true,
  },
  {
    name: "Rain Window Reflection",
    slug: "rain-window-reflection",
    description: "Contemplative scene of a person looking through a rain-streaked window. Perfect for emotional storytelling and music video content.",
    category: "emotional_atmospheric",
    imagePrompt: "Close-up portrait of a person looking through a rain-streaked window, city lights blurred in background creating bokeh, reflection visible in glass, moody blue-orange color palette, photorealistic, cinematic, 8K",
    videoPrompt: "Rain drops slowly streak down the window glass. City lights in background gently pulse and shift. Person breathes subtly, slight movement. CAMERA HOLDS STEADY with minimal drift. PHOTOREALISTIC, MELANCHOLIC ATMOSPHERE.",
    negativePrompt: "sunny, bright, cartoon, happy",
    style: "moody_cinematic",
    cameraMovement: "static_subtle_drift",
    lighting: "blue-orange, city neon, rain diffused",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["rain", "window", "reflection", "emotional", "contemplative"],
  },

  // === ACTION / ADVENTURE ===
  {
    name: "Arctic Explorer",
    slug: "arctic-explorer",
    description: "Cinematic scene of a figure walking through a frozen arctic landscape. Directly inspired by @chalkleyvisuals Arctic tutorial using Kling 3.0 Motion Control.",
    category: "action_adventure",
    imagePrompt: "A lone explorer in heavy winter gear walking through a vast arctic ice landscape, dramatic aurora borealis in the sky, blue and green light reflecting off ice formations, photorealistic, cinematic wide shot, 8K resolution",
    videoPrompt: "Explorer walks forward through deep snow with heavy footsteps. Snow particles blow across the scene. Aurora borealis shifts and dances in the sky above. CAMERA TRACKS alongside the explorer with smooth motion. PHOTOREALISTIC, EPIC SCALE, COLD ATMOSPHERE.",
    negativePrompt: "warm, tropical, cartoon, blurry",
    style: "epic_cinematic",
    cameraMovement: "tracking_side",
    lighting: "aurora borealis, cold blue, ice reflections",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "intermediate",
    tags: ["arctic", "explorer", "adventure", "aurora", "ice", "winter"],
    isFeatured: true,
  },
  {
    name: "Urban Rooftop Parkour",
    slug: "urban-rooftop-parkour",
    description: "Dynamic action shot of a figure on a city rooftop at sunset. Great for action content and fitness brand videos.",
    category: "action_adventure",
    imagePrompt: "Athletic figure standing on the edge of a city rooftop at golden hour, dramatic skyline in background, wind blowing through hair and clothes, photorealistic, action movie cinematography, 8K",
    videoPrompt: "Figure takes a confident step forward and leaps across rooftop gap. CAMERA FOLLOWS with dynamic tracking shot. Wind effects on clothing. City lights begin to glow as sun sets. PHOTOREALISTIC, ACTION MOVIE QUALITY, DYNAMIC MOTION.",
    negativePrompt: "static, boring, cartoon, indoor",
    style: "action_cinematic",
    cameraMovement: "dynamic_tracking",
    lighting: "golden hour, city backlight",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "advanced",
    tags: ["action", "parkour", "rooftop", "urban", "dynamic", "sunset"],
  },

  // === DARK / MOODY ===
  {
    name: "Isolation Chains",
    slug: "isolation-chains",
    description: "Dark, moody scene with dramatic shadows and chains. Inspired by @chalkleyvisuals 'Isolation' workflow using Higgsfield + Kling 3.0.",
    category: "dark_moody",
    imagePrompt: "Dark atmospheric scene of a figure standing in an abandoned industrial space, heavy chains hanging from ceiling, single harsh spotlight from above, deep shadows, gritty texture, photorealistic, cinematic noir, 8K",
    videoPrompt: "Chains sway slowly with metallic creaking motion. Light flickers subtly. Figure turns head slowly. Dust particles visible in spotlight beam. CAMERA PERFORMS SLOW ORBIT around the figure. PHOTOREALISTIC, DARK ATMOSPHERE, MINIMAL MOVEMENT.",
    negativePrompt: "bright, colorful, happy, cartoon",
    style: "noir_cinematic",
    cameraMovement: "slow_orbit",
    lighting: "single harsh spotlight, deep shadows, noir",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "intermediate",
    tags: ["dark", "moody", "isolation", "chains", "noir", "industrial"],
  },
  {
    name: "Neon Alley Encounter",
    slug: "neon-alley-encounter",
    description: "Cyberpunk-inspired scene in a neon-lit back alley. Perfect for music videos, gaming content, and dark aesthetic brands.",
    category: "dark_moody",
    imagePrompt: "A mysterious figure in a long coat standing in a narrow alley lit by neon signs in red and blue, wet pavement reflecting lights, steam rising from grates, cyberpunk atmosphere, photorealistic, 8K",
    videoPrompt: "Neon lights flicker and pulse. Steam rises slowly from the ground. Figure walks forward through the alley with deliberate steps. Reflections shimmer on wet pavement. CAMERA SLOWLY PUSHES IN. PHOTOREALISTIC, CYBERPUNK ATMOSPHERE.",
    negativePrompt: "daylight, bright, clean, cartoon",
    style: "cyberpunk_noir",
    cameraMovement: "slow_push",
    lighting: "neon red/blue, wet reflections, steam",
    aspectRatio: "9:16",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["neon", "cyberpunk", "alley", "dark", "moody", "night"],
  },

  // === TIMELAPSE ===
  {
    name: "City Sunrise Timelapse",
    slug: "city-sunrise-timelapse",
    description: "Viral-style AI timelapse of a city transitioning from night to sunrise. Inspired by @chalkleyvisuals timelapse videos that pull 100M+ views.",
    category: "timelapse",
    imagePrompt: "Panoramic cityscape at the moment of sunrise, city lights still glowing, first rays of golden sun breaking over the horizon, dramatic clouds, photorealistic aerial photography, 8K ultra-wide",
    videoPrompt: "TIMELAPSE: Sky transitions from deep blue night to golden sunrise. City lights gradually fade as sunlight grows. Clouds move rapidly across sky. Shadows shift dramatically across buildings. SMOOTH CONTINUOUS MOTION, PHOTOREALISTIC TIMELAPSE QUALITY.",
    negativePrompt: "static, cartoon, blurry, indoor",
    style: "timelapse_cinematic",
    cameraMovement: "static_wide",
    lighting: "night-to-sunrise transition, golden hour",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["timelapse", "city", "sunrise", "viral", "skyline", "transition"],
    isFeatured: true,
  },
  {
    name: "Flower Bloom Timelapse",
    slug: "flower-bloom-timelapse",
    description: "Mesmerizing close-up timelapse of a flower blooming. Great for nature content, wellness brands, and satisfying video content.",
    category: "timelapse",
    imagePrompt: "Extreme close-up macro photograph of a rose bud just beginning to open, dewdrops on petals, soft natural lighting, dark background, photorealistic macro photography, 8K",
    videoPrompt: "TIMELAPSE: Rose petals slowly unfurl and open in accelerated motion. Dewdrops slide down petals. Subtle color shift as flower opens fully. CAMERA HOLDS STEADY macro position. PHOTOREALISTIC, SMOOTH ORGANIC MOTION.",
    negativePrompt: "wilted, dead, cartoon, blurry",
    style: "macro_timelapse",
    cameraMovement: "static_macro",
    lighting: "soft natural, dark background",
    aspectRatio: "1:1",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["timelapse", "flower", "bloom", "nature", "macro", "satisfying"],
  },

  // === VFX INTEGRATION ===
  {
    name: "Portal Reality Warp",
    slug: "portal-reality-warp",
    description: "VFX-style scene where reality warps through a portal effect. Inspired by @chalkleyvisuals VFX integration techniques using 2D animation guides for AI.",
    category: "vfx_integration",
    imagePrompt: "A person reaching toward a glowing circular portal in the middle of a room, reality distorting around the portal edges, particles being pulled toward it, dramatic lighting, photorealistic VFX quality, 8K",
    videoPrompt: "Portal energy pulses and swirls with increasing intensity. Reality around the edges warps and distorts. Particles stream toward the portal center. Person's hair and clothes are pulled by the force. CAMERA PUSHES IN toward the portal. PHOTOREALISTIC VFX, DRAMATIC ENERGY EFFECTS.",
    negativePrompt: "static, boring, cartoon, low quality effects",
    style: "vfx_cinematic",
    cameraMovement: "push_in",
    lighting: "portal glow, dramatic, energy effects",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "advanced",
    tags: ["vfx", "portal", "effects", "reality", "warp", "dramatic"],
  },
  {
    name: "Fire & Ice Duality",
    slug: "fire-ice-duality",
    description: "Split-screen style VFX showing fire and ice elements merging. Great for dramatic reveals and concept videos.",
    category: "vfx_integration",
    imagePrompt: "Dramatic split composition: left side engulfed in realistic flames and embers, right side covered in ice crystals and frost, a figure standing at the center where both elements meet, photorealistic VFX, 8K",
    videoPrompt: "Flames dance and flicker on the left side. Ice crystals grow and spread on the right. Where they meet, steam and energy particles collide. Figure stands still as elements rage around them. CAMERA SLOWLY ORBITS. PHOTOREALISTIC VFX, ELEMENTAL CONTRAST.",
    negativePrompt: "cartoon, flat, low quality, blurry",
    style: "vfx_dramatic",
    cameraMovement: "slow_orbit",
    lighting: "fire warm / ice cold split, dramatic contrast",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "advanced",
    tags: ["vfx", "fire", "ice", "duality", "elements", "dramatic"],
  },

  // === CHARACTER ANIMATION ===
  {
    name: "Confident Walk Forward",
    slug: "confident-walk-forward",
    description: "Character walking confidently toward camera. The core @chalkleyvisuals workflow: static Nano Banana image animated with Kling 3.0 Motion Control.",
    category: "character_animation",
    imagePrompt: "Full body photograph of a confident person in stylish modern clothing, standing in a clean studio environment, perfect posture, looking directly at camera, professional lighting, photorealistic, 8K",
    videoPrompt: "Person walks confidently forward toward the camera with natural stride and arm swing. Clothing moves naturally with each step. Expression remains confident and engaging. CAMERA HOLDS STEADY as subject approaches. PHOTOREALISTIC, NATURAL HUMAN MOTION.",
    negativePrompt: "stiff, robotic, unnatural, cartoon",
    style: "studio_clean",
    cameraMovement: "static",
    lighting: "professional studio, even",
    aspectRatio: "9:16",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "beginner",
    tags: ["character", "walk", "confident", "animation", "studio", "social"],
  },
  {
    name: "Dance Performance",
    slug: "dance-performance",
    description: "Character performing a dance routine. Uses Kling Motion Control with a reference dance video to copy skeletal movement onto AI character.",
    category: "character_animation",
    imagePrompt: "Full body photograph of a dancer in athletic wear, standing in a dance studio with mirrors, perfect form, dramatic side lighting, photorealistic, 8K",
    videoPrompt: "Dancer performs fluid contemporary dance movements with precise body control. Arms extend gracefully, body rotates with natural momentum. CAMERA TRACKS with slight movement to follow the dance. PHOTOREALISTIC, FLUID NATURAL DANCE MOTION.",
    negativePrompt: "stiff, robotic, awkward, cartoon",
    style: "dance_studio",
    cameraMovement: "subtle_tracking",
    lighting: "dramatic side light, dance studio",
    aspectRatio: "9:16",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "intermediate",
    tags: ["dance", "performance", "character", "animation", "motion", "trending"],
  },

  // === SCENE TRANSFORMATION ===
  {
    name: "Day to Night Transformation",
    slug: "day-to-night-transformation",
    description: "Scene that transforms from daylight to nighttime. Inspired by @chalkleyvisuals scene transformation techniques.",
    category: "scene_transformation",
    imagePrompt: "Beautiful landscape scene at golden hour, rolling hills, single tree on hilltop, warm sunlight, photorealistic landscape photography, 8K ultra-wide",
    videoPrompt: "TRANSFORMATION: Scene transitions from golden hour to deep night. Sun sets rapidly below horizon. Stars appear in the sky. Moon rises. Colors shift from warm gold to cool blue. Fireflies appear near the tree. SMOOTH CONTINUOUS TRANSITION, PHOTOREALISTIC.",
    negativePrompt: "static, abrupt, cartoon, blurry",
    style: "transformation_cinematic",
    cameraMovement: "static_wide",
    lighting: "golden hour to moonlight transition",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "intermediate",
    tags: ["transformation", "day", "night", "landscape", "transition", "scenic"],
  },
  {
    name: "Season Change Morph",
    slug: "season-change-morph",
    description: "A single scene morphing through all four seasons. Viral content format for nature and lifestyle brands.",
    category: "scene_transformation",
    imagePrompt: "A beautiful park path lined with trees in full spring bloom, cherry blossoms falling, warm sunlight filtering through branches, photorealistic, 8K",
    videoPrompt: "TRANSFORMATION: Scene morphs through seasons - spring blossoms fall, leaves turn green for summer, then golden for autumn, then bare branches with snow for winter. Colors shift naturally. CAMERA HOLDS STEADY. SMOOTH ORGANIC SEASONAL TRANSITION, PHOTOREALISTIC.",
    negativePrompt: "abrupt changes, cartoon, blurry, indoor",
    style: "transformation_nature",
    cameraMovement: "static",
    lighting: "natural seasonal light changes",
    aspectRatio: "16:9",
    duration: 5,
    imageModel: "nano_banana_pro",
    videoModel: "kling_3",
    difficulty: "advanced",
    tags: ["transformation", "seasons", "nature", "morph", "viral", "park"],
  },
];
