import { generateImage } from "./_core/imageGeneration.ts";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";
  addWatermark?: boolean;
}

interface GenerateImageResult {
  imageUrl: string;
  prompt: string;
}

/**
 * Generate an AI influencer image using the built-in image generation service
 */
export async function generateInfluencerImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { prompt, addWatermark = false } = options;

  try {
    console.log("[ImageGen] Generating image with prompt:", prompt.substring(0, 100) + "...");

    // Use built-in image generation helper
    const result = await generateImage({
      prompt: prompt,
    });

    if (!result.url) {
      throw new Error("Image generation returned no URL");
    }

    console.log("[ImageGen] Image generated successfully:", result.url);

    return {
      imageUrl: result.url,
      prompt,
    };
  } catch (error) {
    console.error("[ImageGen] Error generating image:", error);
    throw error;
  }
}

/**
 * Build a detailed prompt from character settings
 */
export function buildPromptFromSettings(settings: {
  characterType: string;
  gender: string;
  ethnicity: string;
  eyeColor: string;
  skinTone: string;
  skinFeatures: string[];
  age: number;
  customPrompt?: string;
}): string {
  const {
    characterType,
    gender,
    ethnicity,
    eyeColor,
    skinTone,
    skinFeatures,
    age,
    customPrompt,
  } = settings;

  let prompt = `A photorealistic portrait of a ${age}-year-old ${gender.toLowerCase()} `;

  // Add character type specific details
  if (characterType.toLowerCase() === "human") {
    prompt += `${ethnicity.toLowerCase()} person `;
  } else {
    prompt += `${characterType.toLowerCase()} character with ${ethnicity.toLowerCase()} features `;
  }

  prompt += `with ${eyeColor.toLowerCase()} eyes and ${skinTone.toLowerCase()} skin tone`;

  // Add skin features
  if (skinFeatures && skinFeatures.length > 0 && !skinFeatures.includes("none")) {
    const features = skinFeatures.filter(f => f.toLowerCase() !== "none").join(", ");
    if (features) {
      prompt += `, featuring ${features}`;
    }
  }

  prompt += ". ";

  // Add custom prompt if provided
  if (customPrompt && customPrompt.trim()) {
    prompt += customPrompt.trim() + ". ";
  }

  // Add quality modifiers
  prompt += "Professional influencer photo, high quality, studio lighting, social media ready, Instagram aesthetic, fashion photography style, 8K resolution, detailed skin texture, natural makeup, confident expression.";

  return prompt;
}
