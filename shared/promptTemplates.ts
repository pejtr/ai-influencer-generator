/**
 * Professional Prompt Templates for AI Influencer Generation
 * Based on Alisha Lewis video: https://www.youtube.com/watch?v=ZekexseCSxA
 * 
 * These templates ensure consistent character generation across multiple images
 */

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  prompt: string;
  aspectRatio: AspectRatio;
  quality: Quality;
  tags: string[];
}

export type PromptCategory = 
  | "portrait" 
  | "angles" 
  | "full_body" 
  | "emotions" 
  | "outfits" 
  | "scenes" 
  | "character_sheet";

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "2:3" | "3:2";

export type Quality = "standard" | "hd" | "4k";

// Character placeholder tokens that will be replaced with actual character details
export const PLACEHOLDER_TOKENS = {
  CHARACTER: "{{CHARACTER}}", // Full character description
  GENDER: "{{GENDER}}",
  ETHNICITY: "{{ETHNICITY}}",
  AGE: "{{AGE}}",
  HAIR_STYLE: "{{HAIR_STYLE}}",
  HAIR_COLOR: "{{HAIR_COLOR}}",
  EYE_COLOR: "{{EYE_COLOR}}",
  SKIN_TONE: "{{SKIN_TONE}}",
  BODY_TYPE: "{{BODY_TYPE}}",
  OUTFIT: "{{OUTFIT}}",
  OUTFIT_COLOR: "{{OUTFIT_COLOR}}",
  ACCESSORIES: "{{ACCESSORIES}}",
} as const;

// ============================================
// PORTRAIT TEMPLATES
// ============================================

export const PORTRAIT_TEMPLATES: PromptTemplate[] = [
  {
    id: "portrait_base",
    name: "Base Portrait",
    category: "portrait",
    description: "Clean portrait on neutral background for character consistency",
    prompt: `Professional portrait photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin, {{BODY_TYPE}} body type. Clean neutral gray studio background, soft diffused lighting, no accessories, no jewelry, natural makeup, looking directly at camera, shoulders visible, sharp focus on face, professional headshot style, photorealistic, 8k quality`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["portrait", "headshot", "base", "consistency"],
  },
  {
    id: "portrait_glamour",
    name: "Glamour Portrait",
    category: "portrait",
    description: "High-end glamour portrait with professional lighting",
    prompt: `Glamorous portrait photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin. Professional beauty lighting, soft shadows, flawless skin, subtle makeup enhancing natural features, confident expression, looking at camera with slight smile, black studio background, fashion magazine quality, photorealistic, 8k`,
    aspectRatio: "3:4",
    quality: "4k",
    tags: ["portrait", "glamour", "beauty", "magazine"],
  },
  {
    id: "portrait_natural",
    name: "Natural Light Portrait",
    category: "portrait",
    description: "Soft natural lighting portrait",
    prompt: `Natural light portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Golden hour sunlight, soft bokeh background, warm tones, genuine smile, relaxed pose, outdoor setting, shallow depth of field, professional photography, photorealistic, 8k`,
    aspectRatio: "3:4",
    quality: "4k",
    tags: ["portrait", "natural", "outdoor", "golden hour"],
  },
];

// ============================================
// ANGLE VARIATION TEMPLATES
// ============================================

export const ANGLE_TEMPLATES: PromptTemplate[] = [
  {
    id: "angle_front",
    name: "Front View",
    category: "angles",
    description: "Direct front-facing portrait",
    prompt: `Front view portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin. Direct front angle, looking straight at camera, symmetrical composition, neutral expression, clean gray background, studio lighting, professional headshot, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["angle", "front", "symmetrical"],
  },
  {
    id: "angle_profile",
    name: "Profile View (Side)",
    category: "angles",
    description: "Side profile portrait",
    prompt: `Side profile portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin. Perfect 90-degree side view, clean silhouette, neutral expression, looking straight ahead, clean gray background, studio lighting, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["angle", "profile", "side"],
  },
  {
    id: "angle_three_quarter",
    name: "3/4 View",
    category: "angles",
    description: "Three-quarter angle portrait",
    prompt: `Three-quarter view portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin. 45-degree angle, slight turn of head, one ear visible, natural pose, clean gray background, Rembrandt lighting, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["angle", "three-quarter", "45-degree"],
  },
  {
    id: "angle_looking_up",
    name: "Looking Up",
    category: "angles",
    description: "Low angle portrait looking up",
    prompt: `Low angle portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Camera below eye level, subject looking slightly upward, powerful confident pose, dramatic lighting from above, clean background, professional photography, photorealistic, 8k`,
    aspectRatio: "3:4",
    quality: "4k",
    tags: ["angle", "low", "powerful"],
  },
  {
    id: "angle_looking_down",
    name: "Looking Down",
    category: "angles",
    description: "High angle portrait looking down",
    prompt: `High angle portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Camera above eye level, subject looking slightly downward, soft vulnerable expression, gentle lighting, clean background, professional photography, photorealistic, 8k`,
    aspectRatio: "3:4",
    quality: "4k",
    tags: ["angle", "high", "soft"],
  },
];

// ============================================
// FULL BODY TEMPLATES
// ============================================

export const FULL_BODY_TEMPLATES: PromptTemplate[] = [
  {
    id: "full_body_standing",
    name: "Standing Full Body",
    category: "full_body",
    description: "Full body standing pose",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin, {{BODY_TYPE}} body type. Standing pose, wearing {{OUTFIT}} in {{OUTFIT_COLOR}}, {{ACCESSORIES}}. Full length from head to feet, clean studio background, professional fashion photography lighting, confident pose, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["full body", "standing", "fashion"],
  },
  {
    id: "full_body_sitting",
    name: "Sitting Pose",
    category: "full_body",
    description: "Elegant sitting pose",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{BODY_TYPE}} body type. Elegant sitting pose on modern chair, wearing {{OUTFIT}} in {{OUTFIT_COLOR}}, {{ACCESSORIES}}. Relaxed confident posture, clean studio background, professional lighting, photorealistic, 8k`,
    aspectRatio: "3:4",
    quality: "4k",
    tags: ["full body", "sitting", "elegant"],
  },
  {
    id: "full_body_walking",
    name: "Walking Pose",
    category: "full_body",
    description: "Dynamic walking pose",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{BODY_TYPE}} body type. Dynamic walking pose, mid-stride, wearing {{OUTFIT}} in {{OUTFIT_COLOR}}, {{ACCESSORIES}}. Motion blur background, street fashion style, confident stride, professional photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["full body", "walking", "dynamic"],
  },
  {
    id: "full_body_leaning",
    name: "Leaning Pose",
    category: "full_body",
    description: "Casual leaning pose",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{BODY_TYPE}} body type. Casual leaning pose against wall, wearing {{OUTFIT}} in {{OUTFIT_COLOR}}, {{ACCESSORIES}}. Relaxed attitude, urban backdrop, street style photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["full body", "leaning", "casual"],
  },
];

// ============================================
// EMOTION TEMPLATES
// ============================================

export const EMOTION_TEMPLATES: PromptTemplate[] = [
  {
    id: "emotion_happy",
    name: "Happy / Joyful",
    category: "emotions",
    description: "Genuine happy expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Genuine happy expression, bright smile showing teeth, eyes crinkled with joy, warm lighting, clean background, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "happy", "smile", "joy"],
  },
  {
    id: "emotion_sad",
    name: "Sad / Melancholic",
    category: "emotions",
    description: "Sad melancholic expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Sad melancholic expression, downcast eyes, slight frown, soft moody lighting, clean background, emotional portrait, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "sad", "melancholic"],
  },
  {
    id: "emotion_angry",
    name: "Angry / Fierce",
    category: "emotions",
    description: "Intense angry expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Intense angry expression, furrowed brows, piercing gaze, clenched jaw, dramatic lighting with strong shadows, clean background, powerful portrait, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "angry", "fierce", "intense"],
  },
  {
    id: "emotion_surprised",
    name: "Surprised / Shocked",
    category: "emotions",
    description: "Surprised shocked expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Surprised shocked expression, wide eyes, raised eyebrows, open mouth, bright even lighting, clean background, expressive portrait, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "surprised", "shocked"],
  },
  {
    id: "emotion_confident",
    name: "Confident / Powerful",
    category: "emotions",
    description: "Confident powerful expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Confident powerful expression, direct eye contact, slight smirk, raised chin, dramatic lighting, clean background, empowering portrait, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "confident", "powerful", "boss"],
  },
  {
    id: "emotion_seductive",
    name: "Seductive / Alluring",
    category: "emotions",
    description: "Seductive alluring expression",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Seductive alluring expression, half-lidded eyes, slight parted lips, sultry gaze, soft dramatic lighting, clean background, sensual portrait, professional photography, photorealistic, 8k`,
    aspectRatio: "1:1",
    quality: "4k",
    tags: ["emotion", "seductive", "alluring", "sensual"],
  },
];

// ============================================
// OUTFIT TEMPLATES
// ============================================

export const OUTFIT_TEMPLATES: PromptTemplate[] = [
  {
    id: "outfit_casual",
    name: "Casual Streetwear",
    category: "outfits",
    description: "Casual everyday streetwear look",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing casual streetwear: oversized hoodie, fitted jeans, white sneakers. Urban street background, natural daylight, street style photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "casual", "streetwear", "urban"],
  },
  {
    id: "outfit_formal",
    name: "Formal Business",
    category: "outfits",
    description: "Professional business attire",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing formal business attire: tailored blazer, dress pants, heels, minimal jewelry. Modern office background, professional lighting, corporate photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "formal", "business", "professional"],
  },
  {
    id: "outfit_evening",
    name: "Evening Gown",
    category: "outfits",
    description: "Elegant evening gown",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing elegant evening gown: floor-length dress in {{OUTFIT_COLOR}}, statement jewelry, elegant updo hairstyle. Luxury venue background, dramatic lighting, red carpet style photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "evening", "gown", "elegant", "red carpet"],
  },
  {
    id: "outfit_swimwear",
    name: "Swimwear / Beach",
    category: "outfits",
    description: "Beach swimwear look",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing stylish swimwear: designer bikini in {{OUTFIT_COLOR}}, beach accessories. Tropical beach background, golden hour sunlight, lifestyle photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "swimwear", "beach", "tropical"],
  },
  {
    id: "outfit_fitness",
    name: "Fitness / Athletic",
    category: "outfits",
    description: "Athletic fitness wear",
    prompt: `Full body photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing athletic fitness wear: sports bra, leggings, running shoes. Modern gym background, energetic pose, fitness photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "fitness", "athletic", "gym"],
  },
  {
    id: "outfit_lingerie",
    name: "Lingerie / Boudoir",
    category: "outfits",
    description: "Elegant lingerie boudoir style",
    prompt: `Boudoir photograph of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Wearing elegant lingerie set in {{OUTFIT_COLOR}}, lace details. Luxurious bedroom setting, soft romantic lighting, artistic boudoir photography, photorealistic, 8k`,
    aspectRatio: "2:3",
    quality: "4k",
    tags: ["outfit", "lingerie", "boudoir", "elegant"],
  },
];

// ============================================
// SCENE TEMPLATES
// ============================================

export const SCENE_TEMPLATES: PromptTemplate[] = [
  {
    id: "scene_cafe",
    name: "Coffee Shop",
    category: "scenes",
    description: "Cozy coffee shop scene",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Sitting in cozy coffee shop, holding coffee cup, wearing {{OUTFIT}}, warm ambient lighting, bokeh background with cafe interior, lifestyle photography, photorealistic, 8k`,
    aspectRatio: "4:3",
    quality: "4k",
    tags: ["scene", "cafe", "coffee", "lifestyle"],
  },
  {
    id: "scene_beach_sunset",
    name: "Beach Sunset",
    category: "scenes",
    description: "Romantic beach sunset scene",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Standing on beach at sunset, wearing {{OUTFIT}}, golden hour lighting, ocean waves in background, wind in hair, romantic atmosphere, travel photography, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["scene", "beach", "sunset", "travel"],
  },
  {
    id: "scene_city_night",
    name: "City Night",
    category: "scenes",
    description: "Urban city night scene",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Standing in city at night, wearing {{OUTFIT}}, neon lights reflecting, urban backdrop with skyscrapers, cinematic lighting, street photography, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["scene", "city", "night", "urban", "neon"],
  },
  {
    id: "scene_luxury_car",
    name: "Luxury Car",
    category: "scenes",
    description: "Luxury lifestyle with car",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Posing next to luxury sports car, wearing {{OUTFIT}}, confident pose, urban parking garage or scenic road, lifestyle photography, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["scene", "luxury", "car", "lifestyle"],
  },
  {
    id: "scene_yacht",
    name: "Yacht / Boat",
    category: "scenes",
    description: "Luxury yacht scene",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. On luxury yacht deck, wearing {{OUTFIT}}, ocean in background, sunny day, relaxed pose, luxury lifestyle photography, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["scene", "yacht", "luxury", "ocean"],
  },
  {
    id: "scene_penthouse",
    name: "Penthouse View",
    category: "scenes",
    description: "Luxury penthouse with city view",
    prompt: `Portrait of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. In luxury penthouse, wearing {{OUTFIT}}, floor-to-ceiling windows with city skyline view, modern interior, evening lighting, lifestyle photography, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["scene", "penthouse", "luxury", "city"],
  },
];

// ============================================
// CHARACTER SHEET TEMPLATES
// ============================================

export const CHARACTER_SHEET_TEMPLATES: PromptTemplate[] = [
  {
    id: "sheet_angles",
    name: "Angle Reference Sheet",
    category: "character_sheet",
    description: "Multiple angles in one image (front, side, 3/4)",
    prompt: `Character reference sheet of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes, {{SKIN_TONE}} skin. Three views in one image: front view, side profile, three-quarter view. Clean white background, consistent lighting across all views, professional character design sheet, no accessories, neutral expression, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["sheet", "reference", "angles", "consistency"],
  },
  {
    id: "sheet_emotions",
    name: "Emotion Reference Sheet",
    category: "character_sheet",
    description: "Six basic emotions in grid layout",
    prompt: `Emotion reference sheet of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{EYE_COLOR}} eyes. Six expressions in 2x3 grid: happy, sad, angry, surprised, confident, seductive. Clean white background, consistent lighting, professional expression sheet, photorealistic, 8k`,
    aspectRatio: "3:2",
    quality: "4k",
    tags: ["sheet", "emotions", "expressions", "grid"],
  },
  {
    id: "sheet_outfits",
    name: "Outfit Reference Sheet",
    category: "character_sheet",
    description: "Multiple outfit variations",
    prompt: `Outfit reference sheet of {{CHARACTER}}, {{GENDER}}, {{ETHNICITY}} origin, {{AGE}} years old, {{HAIR_STYLE}} {{HAIR_COLOR}} hair, {{BODY_TYPE}} body type. Four full body poses in different outfits: casual, formal, athletic, evening wear. Clean white background, consistent lighting, fashion lookbook style, photorealistic, 8k`,
    aspectRatio: "16:9",
    quality: "4k",
    tags: ["sheet", "outfits", "fashion", "lookbook"],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const ALL_TEMPLATES: PromptTemplate[] = [
  ...PORTRAIT_TEMPLATES,
  ...ANGLE_TEMPLATES,
  ...FULL_BODY_TEMPLATES,
  ...EMOTION_TEMPLATES,
  ...OUTFIT_TEMPLATES,
  ...SCENE_TEMPLATES,
  ...CHARACTER_SHEET_TEMPLATES,
];

export const TEMPLATE_CATEGORIES: { id: PromptCategory; name: string; icon: string }[] = [
  { id: "portrait", name: "Portraits", icon: "👤" },
  { id: "angles", name: "Angles", icon: "🔄" },
  { id: "full_body", name: "Full Body", icon: "🧍" },
  { id: "emotions", name: "Emotions", icon: "😊" },
  { id: "outfits", name: "Outfits", icon: "👗" },
  { id: "scenes", name: "Scenes", icon: "🌆" },
  { id: "character_sheet", name: "Character Sheets", icon: "📋" },
];

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; description: string }[] = [
  { value: "1:1", label: "Square (1:1)", description: "Instagram posts, profile pictures" },
  { value: "4:3", label: "Landscape (4:3)", description: "Standard photos" },
  { value: "3:4", label: "Portrait (3:4)", description: "Portrait orientation" },
  { value: "16:9", label: "Widescreen (16:9)", description: "YouTube thumbnails, banners" },
  { value: "9:16", label: "Vertical (9:16)", description: "TikTok, Instagram Stories, Reels" },
  { value: "2:3", label: "Full Body (2:3)", description: "Full body portraits" },
  { value: "3:2", label: "Classic (3:2)", description: "Classic photo format" },
];

export const QUALITY_OPTIONS: { value: Quality; label: string; credits: number }[] = [
  { value: "standard", label: "Standard", credits: 1 },
  { value: "hd", label: "HD", credits: 2 },
  { value: "4k", label: "4K Ultra HD", credits: 3 },
];

/**
 * Replace placeholder tokens in a prompt template with actual character values
 */
export function buildPromptFromTemplate(
  template: PromptTemplate,
  character: {
    gender?: string;
    ethnicity?: string;
    age?: number;
    hairStyle?: string;
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    bodyType?: string;
    outfit?: string;
    outfitColor?: string;
    accessories?: string;
    customDescription?: string;
  }
): string {
  let prompt = template.prompt;

  // Build full character description
  const characterDesc = character.customDescription || 
    `beautiful ${character.gender || "female"} ${character.ethnicity || "European"} person`;

  // Replace all placeholders
  prompt = prompt.replace(/\{\{CHARACTER\}\}/g, characterDesc);
  prompt = prompt.replace(/\{\{GENDER\}\}/g, character.gender || "female");
  prompt = prompt.replace(/\{\{ETHNICITY\}\}/g, character.ethnicity || "European");
  prompt = prompt.replace(/\{\{AGE\}\}/g, String(character.age || 25));
  prompt = prompt.replace(/\{\{HAIR_STYLE\}\}/g, character.hairStyle || "long straight");
  prompt = prompt.replace(/\{\{HAIR_COLOR\}\}/g, character.hairColor || "brown");
  prompt = prompt.replace(/\{\{EYE_COLOR\}\}/g, character.eyeColor || "brown");
  prompt = prompt.replace(/\{\{SKIN_TONE\}\}/g, character.skinTone || "fair");
  prompt = prompt.replace(/\{\{BODY_TYPE\}\}/g, character.bodyType || "slim");
  prompt = prompt.replace(/\{\{OUTFIT\}\}/g, character.outfit || "casual clothing");
  prompt = prompt.replace(/\{\{OUTFIT_COLOR\}\}/g, character.outfitColor || "black");
  prompt = prompt.replace(/\{\{ACCESSORIES\}\}/g, character.accessories || "no accessories");

  return prompt;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Search templates by tags or name
 */
export function searchTemplates(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return ALL_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
