/**
 * Elements System - Reference Image Workflow
 * Allows users to upload reference images for character, outfit, scene, and objects
 * to maintain consistency across generated images
 */

// Element types that can be referenced
export type ElementType = "character" | "outfit" | "scene" | "object" | "style";

// Reference element structure
export interface ReferenceElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  strength: number; // 0-100, how strongly to apply this reference
  extractedFeatures?: ExtractedFeatures;
  createdAt: Date;
  updatedAt: Date;
}

// Features extracted from reference images
export interface ExtractedFeatures {
  // Character features
  gender?: string;
  age?: string;
  ethnicity?: string;
  faceShape?: string;
  eyeColor?: string;
  eyeShape?: string;
  hairColor?: string;
  hairStyle?: string;
  hairLength?: string;
  skinTone?: string;
  bodyType?: string;
  
  // Outfit features
  outfitType?: string;
  outfitColor?: string;
  outfitStyle?: string;
  accessories?: string[];
  
  // Scene features
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  props?: string[];
  
  // Style features
  artStyle?: string;
  colorPalette?: string[];
  lighting?: string;
  
  // Object features
  objectType?: string;
  objectColor?: string;
  objectMaterial?: string;
  
  // Raw description for prompt building
  rawDescription?: string;
}

// Element category definitions
export const ELEMENT_CATEGORIES: Record<ElementType, {
  name: string;
  description: string;
  icon: string;
  extractableFeatures: string[];
}> = {
  character: {
    name: "Character",
    description: "Lock face and body identity",
    icon: "👤",
    extractableFeatures: ["gender", "age", "ethnicity", "faceShape", "eyeColor", "eyeShape", "hairColor", "hairStyle", "hairLength", "skinTone", "bodyType"]
  },
  outfit: {
    name: "Outfit",
    description: "Apply specific clothing and accessories",
    icon: "👗",
    extractableFeatures: ["outfitType", "outfitColor", "outfitStyle", "accessories"]
  },
  scene: {
    name: "Scene/Background",
    description: "Use as background or environment",
    icon: "🏞️",
    extractableFeatures: ["location", "timeOfDay", "weather", "mood", "props"]
  },
  object: {
    name: "Object/Prop",
    description: "Include specific objects in scene",
    icon: "📦",
    extractableFeatures: ["objectType", "objectColor", "objectMaterial"]
  },
  style: {
    name: "Style Reference",
    description: "Match artistic style and color palette",
    icon: "🎨",
    extractableFeatures: ["artStyle", "colorPalette", "lighting"]
  }
};

// Default strength values per element type
export const DEFAULT_STRENGTHS: Record<ElementType, number> = {
  character: 90, // High strength for character consistency
  outfit: 75,
  scene: 60,
  object: 70,
  style: 50
};

// Prompt building for reference elements
export function buildReferencePrompt(
  element: ReferenceElement,
  includeStrength: boolean = true
): string {
  const parts: string[] = [];
  const features = element.extractedFeatures;
  
  if (!features) {
    return element.description || "";
  }
  
  switch (element.type) {
    case "character":
      if (features.gender) parts.push(features.gender);
      if (features.age) parts.push(`${features.age} years old`);
      if (features.ethnicity) parts.push(features.ethnicity);
      if (features.faceShape) parts.push(`${features.faceShape} face`);
      if (features.eyeColor) parts.push(`${features.eyeColor} eyes`);
      if (features.eyeShape) parts.push(`${features.eyeShape} eye shape`);
      if (features.hairColor && features.hairStyle) {
        parts.push(`${features.hairColor} ${features.hairStyle} hair`);
      }
      if (features.skinTone) parts.push(`${features.skinTone} skin`);
      if (features.bodyType) parts.push(`${features.bodyType} body type`);
      break;
      
    case "outfit":
      if (features.outfitColor && features.outfitType) {
        parts.push(`wearing ${features.outfitColor} ${features.outfitType}`);
      } else if (features.outfitType) {
        parts.push(`wearing ${features.outfitType}`);
      }
      if (features.outfitStyle) parts.push(`${features.outfitStyle} style`);
      if (features.accessories && features.accessories.length > 0) {
        parts.push(`with ${features.accessories.join(", ")}`);
      }
      break;
      
    case "scene":
      if (features.location) parts.push(`in ${features.location}`);
      if (features.timeOfDay) parts.push(`at ${features.timeOfDay}`);
      if (features.weather) parts.push(`${features.weather} weather`);
      if (features.mood) parts.push(`${features.mood} atmosphere`);
      if (features.props && features.props.length > 0) {
        parts.push(`with ${features.props.join(", ")}`);
      }
      break;
      
    case "object":
      if (features.objectColor && features.objectType) {
        parts.push(`${features.objectColor} ${features.objectType}`);
      } else if (features.objectType) {
        parts.push(features.objectType);
      }
      if (features.objectMaterial) parts.push(`made of ${features.objectMaterial}`);
      break;
      
    case "style":
      if (features.artStyle) parts.push(`${features.artStyle} style`);
      if (features.colorPalette && features.colorPalette.length > 0) {
        parts.push(`color palette: ${features.colorPalette.join(", ")}`);
      }
      if (features.lighting) parts.push(`${features.lighting} lighting`);
      break;
  }
  
  // Add raw description if available
  if (features.rawDescription) {
    parts.push(features.rawDescription);
  }
  
  let prompt = parts.join(", ");
  
  // Add strength modifier if requested
  if (includeStrength && element.strength !== 100) {
    // Higher strength = more emphasis in prompt
    if (element.strength >= 80) {
      prompt = `(${prompt}:1.3)`; // Strong emphasis
    } else if (element.strength >= 60) {
      prompt = `(${prompt}:1.1)`; // Medium emphasis
    } else if (element.strength >= 40) {
      prompt = `(${prompt}:0.9)`; // Slight de-emphasis
    } else {
      prompt = `(${prompt}:0.7)`; // Weak emphasis
    }
  }
  
  return prompt;
}

// Combine multiple reference elements into a single prompt
export function combineReferencePrompts(
  elements: ReferenceElement[],
  basePrompt: string
): string {
  const parts: string[] = [basePrompt];
  
  // Sort by type priority: character > outfit > scene > object > style
  const priorityOrder: ElementType[] = ["character", "outfit", "scene", "object", "style"];
  const sortedElements = [...elements].sort((a, b) => 
    priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  );
  
  for (const element of sortedElements) {
    const refPrompt = buildReferencePrompt(element, true);
    if (refPrompt) {
      parts.push(refPrompt);
    }
  }
  
  return parts.join(", ");
}

// Reference element presets for quick selection
export interface ElementPreset {
  id: string;
  name: string;
  type: ElementType;
  features: ExtractedFeatures;
  description: string;
}

export const ELEMENT_PRESETS: ElementPreset[] = [
  // Character presets
  {
    id: "char_young_woman",
    name: "Young Woman (Generic)",
    type: "character",
    description: "Generic young woman template",
    features: {
      gender: "woman",
      age: "25",
      faceShape: "oval",
      eyeShape: "almond",
      bodyType: "slim"
    }
  },
  {
    id: "char_young_man",
    name: "Young Man (Generic)",
    type: "character",
    description: "Generic young man template",
    features: {
      gender: "man",
      age: "28",
      faceShape: "square",
      eyeShape: "deep-set",
      bodyType: "athletic"
    }
  },
  
  // Outfit presets
  {
    id: "outfit_casual",
    name: "Casual Everyday",
    type: "outfit",
    description: "Relaxed everyday clothing",
    features: {
      outfitType: "jeans and t-shirt",
      outfitStyle: "casual",
      accessories: ["watch"]
    }
  },
  {
    id: "outfit_formal",
    name: "Formal Business",
    type: "outfit",
    description: "Professional business attire",
    features: {
      outfitType: "suit and tie",
      outfitStyle: "formal business",
      accessories: ["watch", "cufflinks"]
    }
  },
  {
    id: "outfit_evening",
    name: "Evening Gown",
    type: "outfit",
    description: "Elegant evening wear",
    features: {
      outfitType: "evening gown",
      outfitColor: "black",
      outfitStyle: "elegant",
      accessories: ["diamond earrings", "clutch"]
    }
  },
  {
    id: "outfit_swimwear",
    name: "Beach/Swimwear",
    type: "outfit",
    description: "Beach and swimwear",
    features: {
      outfitType: "bikini",
      outfitStyle: "beach",
      accessories: ["sunglasses"]
    }
  },
  
  // Scene presets
  {
    id: "scene_studio",
    name: "Photo Studio",
    type: "scene",
    description: "Professional studio setting",
    features: {
      location: "professional photo studio",
      mood: "clean professional",
      lighting: "studio lighting"
    }
  },
  {
    id: "scene_beach",
    name: "Tropical Beach",
    type: "scene",
    description: "Beach paradise setting",
    features: {
      location: "tropical beach",
      timeOfDay: "golden hour",
      weather: "sunny",
      mood: "relaxed vacation",
      props: ["palm trees", "ocean waves", "white sand"]
    }
  },
  {
    id: "scene_city",
    name: "Urban City",
    type: "scene",
    description: "Modern city environment",
    features: {
      location: "modern city street",
      timeOfDay: "afternoon",
      mood: "urban energetic",
      props: ["skyscrapers", "city lights", "traffic"]
    }
  },
  {
    id: "scene_luxury",
    name: "Luxury Interior",
    type: "scene",
    description: "High-end interior setting",
    features: {
      location: "luxury penthouse",
      mood: "sophisticated elegant",
      props: ["designer furniture", "floor-to-ceiling windows", "city view"]
    }
  },
  
  // Style presets
  {
    id: "style_fashion",
    name: "High Fashion Editorial",
    type: "style",
    description: "Vogue-style fashion photography",
    features: {
      artStyle: "high fashion editorial",
      lighting: "dramatic fashion lighting",
      colorPalette: ["black", "white", "gold"]
    }
  },
  {
    id: "style_cinematic",
    name: "Cinematic Film",
    type: "style",
    description: "Movie-like cinematic look",
    features: {
      artStyle: "cinematic film",
      lighting: "cinematic lighting",
      colorPalette: ["teal", "orange", "desaturated"]
    }
  },
  {
    id: "style_vintage",
    name: "Vintage Film",
    type: "style",
    description: "Nostalgic vintage aesthetic",
    features: {
      artStyle: "vintage film photography",
      lighting: "soft natural",
      colorPalette: ["warm", "faded", "sepia tones"]
    }
  }
];

// Validation for reference elements
export function validateReferenceElement(element: Partial<ReferenceElement>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!element.type) {
    errors.push("Element type is required");
  }
  
  if (!element.name || element.name.trim().length === 0) {
    errors.push("Element name is required");
  }
  
  if (!element.imageUrl && !element.extractedFeatures) {
    errors.push("Either image URL or extracted features are required");
  }
  
  if (element.strength !== undefined && (element.strength < 0 || element.strength > 100)) {
    errors.push("Strength must be between 0 and 100");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Create a new reference element
export function createReferenceElement(
  type: ElementType,
  name: string,
  options: {
    imageUrl?: string;
    description?: string;
    strength?: number;
    features?: ExtractedFeatures;
  } = {}
): ReferenceElement {
  return {
    id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    description: options.description || "",
    imageUrl: options.imageUrl || "",
    strength: options.strength ?? DEFAULT_STRENGTHS[type],
    extractedFeatures: options.features,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Types are already exported above
