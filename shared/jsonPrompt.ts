/**
 * JSON Structured Prompt System
 * Based on Nano Banana Pro workflow for 100% character consistency
 * 
 * Using structured JSON prompts instead of plain text allows AI to better
 * understand individual scene elements and maintain character identity.
 */

// JSON Prompt Schema for structured scene description
export interface JSONPromptSchema {
  // Subject/Character description
  subject: {
    type: "woman" | "man" | "person";
    age: string; // e.g., "25 years old", "young adult", "mature"
    ethnicity?: string; // e.g., "caucasian", "asian", "latina", "african"
    bodyType?: string; // e.g., "slim", "athletic", "curvy", "average"
  };
  
  // Face details (for identity lock)
  face: {
    shape?: string; // e.g., "oval", "heart", "round", "square"
    eyes: string; // e.g., "blue eyes", "brown almond-shaped eyes"
    eyebrows?: string; // e.g., "arched", "thick", "natural"
    nose?: string; // e.g., "small", "straight", "button"
    lips?: string; // e.g., "full", "thin", "pink"
    skin?: string; // e.g., "fair", "tan", "olive", "flawless"
    makeup?: string; // e.g., "natural", "glamorous", "smoky eyes"
    expression?: string; // e.g., "smiling", "serious", "seductive", "playful"
  };
  
  // Hair details
  hair: {
    color: string; // e.g., "blonde", "brunette", "red", "black"
    length: string; // e.g., "long", "medium", "short", "shoulder-length"
    style: string; // e.g., "straight", "wavy", "curly", "braided", "ponytail"
    texture?: string; // e.g., "silky", "voluminous", "sleek"
  };
  
  // Outfit/Clothing
  outfit: {
    type: string; // e.g., "dress", "bikini", "casual", "formal", "lingerie"
    color?: string; // e.g., "red", "black", "white", "floral pattern"
    style?: string; // e.g., "elegant", "sporty", "sexy", "professional"
    details?: string; // e.g., "low-cut", "backless", "lace trim"
    accessories?: string[]; // e.g., ["gold necklace", "sunglasses", "watch"]
  };
  
  // Pose and body position
  pose: {
    position: string; // e.g., "standing", "sitting", "lying down", "walking"
    angle?: string; // e.g., "front view", "side profile", "three-quarter"
    hands?: string; // e.g., "on hips", "in hair", "holding phone"
    legs?: string; // e.g., "crossed", "apart", "one knee bent"
    expression?: string; // e.g., "confident", "relaxed", "playful"
  };
  
  // Scene/Background
  scene: {
    location: string; // e.g., "beach", "city street", "luxury bedroom", "cafe"
    time?: string; // e.g., "golden hour", "night", "midday", "sunset"
    weather?: string; // e.g., "sunny", "cloudy", "rainy"
    props?: string[]; // e.g., ["palm trees", "coffee cup", "sports car"]
    mood?: string; // e.g., "romantic", "energetic", "mysterious", "luxurious"
  };
  
  // Lighting
  lighting: {
    type: string; // e.g., "natural", "studio", "dramatic", "soft"
    direction?: string; // e.g., "front", "side", "backlit", "rim light"
    color?: string; // e.g., "warm", "cool", "golden", "neon"
    intensity?: string; // e.g., "bright", "dim", "high contrast"
  };
  
  // Camera/Technical
  camera: {
    shot: string; // e.g., "close-up", "medium shot", "full body", "portrait"
    angle?: string; // e.g., "eye level", "low angle", "high angle", "dutch"
    lens?: string; // e.g., "85mm", "35mm", "wide angle", "telephoto"
    dof?: string; // e.g., "shallow", "deep", "bokeh background"
    style?: string; // e.g., "professional photography", "candid", "editorial"
  };
  
  // Quality modifiers
  quality?: {
    resolution?: string; // e.g., "4K", "8K", "ultra HD"
    style?: string; // e.g., "photorealistic", "hyperrealistic", "cinematic"
    details?: string[]; // e.g., ["sharp focus", "high detail", "professional"]
  };
}

// Default/empty JSON prompt
export const DEFAULT_JSON_PROMPT: JSONPromptSchema = {
  subject: {
    type: "woman",
    age: "25 years old",
    ethnicity: "caucasian",
    bodyType: "slim"
  },
  face: {
    eyes: "blue eyes",
    expression: "confident smile"
  },
  hair: {
    color: "blonde",
    length: "long",
    style: "wavy"
  },
  outfit: {
    type: "casual dress",
    color: "white"
  },
  pose: {
    position: "standing",
    angle: "three-quarter view"
  },
  scene: {
    location: "neutral studio background",
    mood: "professional"
  },
  lighting: {
    type: "soft studio lighting"
  },
  camera: {
    shot: "medium shot",
    style: "professional photography"
  },
  quality: {
    resolution: "4K",
    style: "photorealistic",
    details: ["sharp focus", "high detail"]
  }
};

// Convert JSON prompt to optimized text prompt
export function jsonToTextPrompt(json: JSONPromptSchema): string {
  const parts: string[] = [];
  
  // Subject
  const subject = json.subject;
  let subjectStr = `${subject.age} ${subject.ethnicity || ""} ${subject.type}`.trim();
  if (subject.bodyType) subjectStr += `, ${subject.bodyType} body`;
  parts.push(subjectStr);
  
  // Face
  const face = json.face;
  const faceParts: string[] = [];
  if (face.shape) faceParts.push(`${face.shape} face`);
  faceParts.push(face.eyes);
  if (face.eyebrows) faceParts.push(`${face.eyebrows} eyebrows`);
  if (face.nose) faceParts.push(`${face.nose} nose`);
  if (face.lips) faceParts.push(`${face.lips} lips`);
  if (face.skin) faceParts.push(`${face.skin} skin`);
  if (face.makeup) faceParts.push(`${face.makeup} makeup`);
  if (face.expression) faceParts.push(`${face.expression} expression`);
  parts.push(faceParts.join(", "));
  
  // Hair
  const hair = json.hair;
  let hairStr = `${hair.color} ${hair.length} ${hair.style} hair`;
  if (hair.texture) hairStr += `, ${hair.texture}`;
  parts.push(hairStr);
  
  // Outfit
  const outfit = json.outfit;
  let outfitStr = `wearing ${outfit.color || ""} ${outfit.type}`.trim();
  if (outfit.style) outfitStr += `, ${outfit.style} style`;
  if (outfit.details) outfitStr += `, ${outfit.details}`;
  if (outfit.accessories && outfit.accessories.length > 0) {
    outfitStr += `, with ${outfit.accessories.join(", ")}`;
  }
  parts.push(outfitStr);
  
  // Pose
  const pose = json.pose;
  let poseStr = pose.position;
  if (pose.angle) poseStr += `, ${pose.angle}`;
  if (pose.hands) poseStr += `, hands ${pose.hands}`;
  if (pose.legs) poseStr += `, legs ${pose.legs}`;
  if (pose.expression) poseStr += `, ${pose.expression} pose`;
  parts.push(poseStr);
  
  // Scene
  const scene = json.scene;
  let sceneStr = `in ${scene.location}`;
  if (scene.time) sceneStr += ` at ${scene.time}`;
  if (scene.weather) sceneStr += `, ${scene.weather} weather`;
  if (scene.props && scene.props.length > 0) {
    sceneStr += `, with ${scene.props.join(", ")}`;
  }
  if (scene.mood) sceneStr += `, ${scene.mood} mood`;
  parts.push(sceneStr);
  
  // Lighting
  const lighting = json.lighting;
  let lightStr = lighting.type;
  if (lighting.direction) lightStr += `, ${lighting.direction} lighting`;
  if (lighting.color) lightStr += `, ${lighting.color} tones`;
  if (lighting.intensity) lightStr += `, ${lighting.intensity}`;
  parts.push(lightStr);
  
  // Camera
  const camera = json.camera;
  let cameraStr = camera.shot;
  if (camera.angle) cameraStr += `, ${camera.angle}`;
  if (camera.lens) cameraStr += `, ${camera.lens} lens`;
  if (camera.dof) cameraStr += `, ${camera.dof} depth of field`;
  if (camera.style) cameraStr += `, ${camera.style}`;
  parts.push(cameraStr);
  
  // Quality
  if (json.quality) {
    const quality = json.quality;
    const qualityParts: string[] = [];
    if (quality.resolution) qualityParts.push(quality.resolution);
    if (quality.style) qualityParts.push(quality.style);
    if (quality.details) qualityParts.push(...quality.details);
    if (qualityParts.length > 0) {
      parts.push(qualityParts.join(", "));
    }
  }
  
  return parts.join(", ");
}

// Preset JSON prompts for common scenarios
export const JSON_PROMPT_PRESETS: Record<string, JSONPromptSchema> = {
  portrait_professional: {
    subject: { type: "woman", age: "25 years old", bodyType: "slim" },
    face: { eyes: "striking eyes", expression: "confident professional smile", makeup: "natural elegant" },
    hair: { color: "brunette", length: "shoulder-length", style: "sleek straight" },
    outfit: { type: "blazer and blouse", color: "navy blue", style: "professional" },
    pose: { position: "standing", angle: "three-quarter view", hands: "relaxed at sides" },
    scene: { location: "modern office", mood: "professional" },
    lighting: { type: "soft studio", direction: "front", color: "neutral" },
    camera: { shot: "medium close-up", style: "corporate headshot" },
    quality: { resolution: "4K", style: "photorealistic", details: ["sharp focus"] }
  },
  
  beach_lifestyle: {
    subject: { type: "woman", age: "23 years old", bodyType: "athletic" },
    face: { eyes: "bright eyes", expression: "joyful smile", skin: "sun-kissed tan" },
    hair: { color: "blonde", length: "long", style: "beachy waves", texture: "windswept" },
    outfit: { type: "bikini", color: "coral", accessories: ["sunglasses on head"] },
    pose: { position: "walking on beach", angle: "side view", expression: "carefree" },
    scene: { location: "tropical beach", time: "golden hour", weather: "sunny", props: ["palm trees", "ocean waves"] },
    lighting: { type: "natural sunlight", direction: "backlit", color: "golden warm" },
    camera: { shot: "full body", style: "lifestyle photography", dof: "shallow bokeh" },
    quality: { resolution: "4K", style: "photorealistic", details: ["vibrant colors"] }
  },
  
  evening_glamour: {
    subject: { type: "woman", age: "28 years old", bodyType: "curvy" },
    face: { eyes: "smoky dramatic eyes", expression: "seductive gaze", makeup: "glamorous evening", lips: "red lips" },
    hair: { color: "black", length: "long", style: "elegant updo", texture: "sleek" },
    outfit: { type: "evening gown", color: "black sequin", style: "elegant", details: "low back", accessories: ["diamond earrings", "clutch purse"] },
    pose: { position: "standing", angle: "three-quarter", hands: "one on hip", expression: "confident" },
    scene: { location: "luxury hotel lobby", time: "evening", mood: "glamorous", props: ["chandelier", "marble floors"] },
    lighting: { type: "dramatic", direction: "side", color: "warm golden", intensity: "high contrast" },
    camera: { shot: "full body", angle: "slightly low", style: "fashion editorial" },
    quality: { resolution: "8K", style: "hyperrealistic", details: ["sharp focus", "high detail", "magazine quality"] }
  },
  
  fitness_active: {
    subject: { type: "woman", age: "26 years old", bodyType: "athletic muscular" },
    face: { eyes: "determined eyes", expression: "focused", skin: "healthy glow" },
    hair: { color: "brunette", length: "medium", style: "high ponytail" },
    outfit: { type: "sports bra and leggings", color: "black and neon green", style: "athletic" },
    pose: { position: "mid-workout", angle: "dynamic", hands: "holding weights", expression: "powerful" },
    scene: { location: "modern gym", mood: "energetic", props: ["dumbbells", "gym equipment"] },
    lighting: { type: "dramatic", direction: "side", intensity: "high contrast" },
    camera: { shot: "medium shot", angle: "low angle", style: "sports photography" },
    quality: { resolution: "4K", style: "photorealistic", details: ["sharp action", "dynamic"] }
  },
  
  casual_street: {
    subject: { type: "woman", age: "24 years old", bodyType: "slim" },
    face: { eyes: "friendly eyes", expression: "natural smile", makeup: "minimal" },
    hair: { color: "auburn", length: "long", style: "loose natural" },
    outfit: { type: "jeans and crop top", color: "light blue denim", style: "casual trendy", accessories: ["crossbody bag", "sneakers"] },
    pose: { position: "walking", angle: "candid", expression: "relaxed happy" },
    scene: { location: "city street", time: "afternoon", weather: "sunny", props: ["cafe storefronts", "trees"] },
    lighting: { type: "natural daylight", direction: "soft diffused" },
    camera: { shot: "full body", style: "street style photography", dof: "shallow" },
    quality: { resolution: "4K", style: "photorealistic", details: ["candid feel", "authentic"] }
  },
  
  luxury_bedroom: {
    subject: { type: "woman", age: "27 years old", bodyType: "curvy" },
    face: { eyes: "sultry eyes", expression: "intimate gaze", makeup: "soft romantic" },
    hair: { color: "blonde", length: "long", style: "tousled waves" },
    outfit: { type: "silk robe", color: "champagne", style: "elegant sensual", details: "loosely tied" },
    pose: { position: "sitting on bed", angle: "three-quarter", hands: "in hair", expression: "relaxed seductive" },
    scene: { location: "luxury bedroom", time: "morning", mood: "intimate romantic", props: ["silk sheets", "soft pillows", "natural light through curtains"] },
    lighting: { type: "soft natural", direction: "window light", color: "warm golden" },
    camera: { shot: "medium shot", style: "boudoir photography", dof: "shallow dreamy" },
    quality: { resolution: "4K", style: "photorealistic", details: ["soft focus", "romantic atmosphere"] }
  }
};

// Validate JSON prompt schema
export function validateJSONPrompt(json: Partial<JSONPromptSchema>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!json.subject) {
    errors.push("Subject is required");
  } else {
    if (!json.subject.type) errors.push("Subject type is required");
    if (!json.subject.age) errors.push("Subject age is required");
  }
  
  if (!json.face) {
    errors.push("Face description is required");
  } else {
    if (!json.face.eyes) errors.push("Eye description is required");
  }
  
  if (!json.hair) {
    errors.push("Hair description is required");
  } else {
    if (!json.hair.color) errors.push("Hair color is required");
    if (!json.hair.length) errors.push("Hair length is required");
    if (!json.hair.style) errors.push("Hair style is required");
  }
  
  if (!json.outfit) {
    errors.push("Outfit description is required");
  } else {
    if (!json.outfit.type) errors.push("Outfit type is required");
  }
  
  if (!json.pose) {
    errors.push("Pose description is required");
  } else {
    if (!json.pose.position) errors.push("Pose position is required");
  }
  
  if (!json.scene) {
    errors.push("Scene description is required");
  } else {
    if (!json.scene.location) errors.push("Scene location is required");
  }
  
  if (!json.lighting) {
    errors.push("Lighting description is required");
  } else {
    if (!json.lighting.type) errors.push("Lighting type is required");
  }
  
  if (!json.camera) {
    errors.push("Camera settings are required");
  } else {
    if (!json.camera.shot) errors.push("Camera shot type is required");
  }
  
  return { valid: errors.length === 0, errors };
}

// Generate system prompt for LLM to create JSON prompts
export const JSON_PROMPT_GENERATOR_SYSTEM = `You are an expert AI image prompt engineer specializing in creating structured JSON prompts for photorealistic AI influencer images.

Your task is to convert simple text descriptions into detailed JSON prompts following this exact schema:

{
  "subject": { "type": "woman|man|person", "age": "string", "ethnicity": "string", "bodyType": "string" },
  "face": { "shape": "string", "eyes": "string", "eyebrows": "string", "nose": "string", "lips": "string", "skin": "string", "makeup": "string", "expression": "string" },
  "hair": { "color": "string", "length": "string", "style": "string", "texture": "string" },
  "outfit": { "type": "string", "color": "string", "style": "string", "details": "string", "accessories": ["string"] },
  "pose": { "position": "string", "angle": "string", "hands": "string", "legs": "string", "expression": "string" },
  "scene": { "location": "string", "time": "string", "weather": "string", "props": ["string"], "mood": "string" },
  "lighting": { "type": "string", "direction": "string", "color": "string", "intensity": "string" },
  "camera": { "shot": "string", "angle": "string", "lens": "string", "dof": "string", "style": "string" },
  "quality": { "resolution": "4K", "style": "photorealistic", "details": ["string"] }
}

Guidelines:
1. Be specific and detailed in each field
2. Use professional photography terminology
3. Ensure consistency across all fields
4. Focus on creating photorealistic, high-quality results
5. Always include quality modifiers for best results
6. Return ONLY valid JSON, no explanations`;
