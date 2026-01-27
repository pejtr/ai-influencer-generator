/**
 * AI Prompt Generator
 * Uses LLM to convert simple text descriptions into structured JSON prompts
 * for 100% character consistency
 */

import { invokeLLM } from "./_core/llm";
import { 
  JSONPromptSchema, 
  DEFAULT_JSON_PROMPT, 
  jsonToTextPrompt, 
  validateJSONPrompt,
  JSON_PROMPT_GENERATOR_SYSTEM 
} from "@shared/jsonPrompt";

// Generate JSON prompt from simple text description
export async function generateJSONPrompt(
  simpleDescription: string,
  baseCharacter?: Partial<JSONPromptSchema>
): Promise<{ jsonPrompt: JSONPromptSchema; textPrompt: string }> {
  const systemPrompt = JSON_PROMPT_GENERATOR_SYSTEM;
  
  let userPrompt = `Convert this description into a detailed JSON prompt:\n\n"${simpleDescription}"`;
  
  // If we have a base character, include it for consistency
  if (baseCharacter) {
    userPrompt += `\n\nIMPORTANT: Maintain consistency with this existing character:\n${JSON.stringify(baseCharacter, null, 2)}\n\nKeep the subject, face, and hair details the same. Only change the outfit, pose, scene, and lighting based on the new description.`;
  }
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "json_prompt",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["woman", "man", "person"] },
                  age: { type: "string" },
                  ethnicity: { type: "string" },
                  bodyType: { type: "string" }
                },
                required: ["type", "age"],
                additionalProperties: false
              },
              face: {
                type: "object",
                properties: {
                  shape: { type: "string" },
                  eyes: { type: "string" },
                  eyebrows: { type: "string" },
                  nose: { type: "string" },
                  lips: { type: "string" },
                  skin: { type: "string" },
                  makeup: { type: "string" },
                  expression: { type: "string" }
                },
                required: ["eyes"],
                additionalProperties: false
              },
              hair: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  length: { type: "string" },
                  style: { type: "string" },
                  texture: { type: "string" }
                },
                required: ["color", "length", "style"],
                additionalProperties: false
              },
              outfit: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  color: { type: "string" },
                  style: { type: "string" },
                  details: { type: "string" },
                  accessories: { type: "array", items: { type: "string" } }
                },
                required: ["type"],
                additionalProperties: false
              },
              pose: {
                type: "object",
                properties: {
                  position: { type: "string" },
                  angle: { type: "string" },
                  hands: { type: "string" },
                  legs: { type: "string" },
                  expression: { type: "string" }
                },
                required: ["position"],
                additionalProperties: false
              },
              scene: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  time: { type: "string" },
                  weather: { type: "string" },
                  props: { type: "array", items: { type: "string" } },
                  mood: { type: "string" }
                },
                required: ["location"],
                additionalProperties: false
              },
              lighting: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  direction: { type: "string" },
                  color: { type: "string" },
                  intensity: { type: "string" }
                },
                required: ["type"],
                additionalProperties: false
              },
              camera: {
                type: "object",
                properties: {
                  shot: { type: "string" },
                  angle: { type: "string" },
                  lens: { type: "string" },
                  dof: { type: "string" },
                  style: { type: "string" }
                },
                required: ["shot"],
                additionalProperties: false
              },
              quality: {
                type: "object",
                properties: {
                  resolution: { type: "string" },
                  style: { type: "string" },
                  details: { type: "array", items: { type: "string" } }
                },
                additionalProperties: false
              }
            },
            required: ["subject", "face", "hair", "outfit", "pose", "scene", "lighting", "camera"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }
    
    const jsonPrompt = JSON.parse(content) as JSONPromptSchema;
    
    // Validate the generated prompt
    const validation = validateJSONPrompt(jsonPrompt);
    if (!validation.valid) {
      console.warn("Generated prompt has validation issues:", validation.errors);
    }
    
    // Convert to text prompt
    const textPrompt = jsonToTextPrompt(jsonPrompt);
    
    return { jsonPrompt, textPrompt };
  } catch (error) {
    console.error("Failed to generate JSON prompt:", error);
    // Fallback to default with simple description appended
    const fallbackPrompt = { ...DEFAULT_JSON_PROMPT };
    return {
      jsonPrompt: fallbackPrompt,
      textPrompt: `${simpleDescription}, ${jsonToTextPrompt(fallbackPrompt)}`
    };
  }
}

// Generate variation of existing character in new scene
export async function generateCharacterVariation(
  baseCharacter: JSONPromptSchema,
  newSceneDescription: string
): Promise<{ jsonPrompt: JSONPromptSchema; textPrompt: string }> {
  const systemPrompt = `You are an expert AI image prompt engineer. Your task is to create a new scene variation for an existing character while maintaining 100% identity consistency.

CRITICAL RULES FOR CHARACTER CONSISTENCY:
1. Keep ALL subject details EXACTLY the same (type, age, ethnicity, bodyType)
2. Keep ALL face details EXACTLY the same (shape, eyes, eyebrows, nose, lips, skin)
3. Keep ALL hair details EXACTLY the same (color, length, style, texture)
4. Only modify: outfit, pose, scene, lighting, camera settings

Return a complete JSON prompt with the character's identity preserved but in the new scene.`;

  const userPrompt = `Base character (MUST preserve identity):
${JSON.stringify(baseCharacter, null, 2)}

New scene request: "${newSceneDescription}"

Create a new JSON prompt that places this EXACT character in the new scene. The character's face, hair, and body MUST remain identical.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "character_variation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["woman", "man", "person"] },
                  age: { type: "string" },
                  ethnicity: { type: "string" },
                  bodyType: { type: "string" }
                },
                required: ["type", "age"],
                additionalProperties: false
              },
              face: {
                type: "object",
                properties: {
                  shape: { type: "string" },
                  eyes: { type: "string" },
                  eyebrows: { type: "string" },
                  nose: { type: "string" },
                  lips: { type: "string" },
                  skin: { type: "string" },
                  makeup: { type: "string" },
                  expression: { type: "string" }
                },
                required: ["eyes"],
                additionalProperties: false
              },
              hair: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  length: { type: "string" },
                  style: { type: "string" },
                  texture: { type: "string" }
                },
                required: ["color", "length", "style"],
                additionalProperties: false
              },
              outfit: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  color: { type: "string" },
                  style: { type: "string" },
                  details: { type: "string" },
                  accessories: { type: "array", items: { type: "string" } }
                },
                required: ["type"],
                additionalProperties: false
              },
              pose: {
                type: "object",
                properties: {
                  position: { type: "string" },
                  angle: { type: "string" },
                  hands: { type: "string" },
                  legs: { type: "string" },
                  expression: { type: "string" }
                },
                required: ["position"],
                additionalProperties: false
              },
              scene: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  time: { type: "string" },
                  weather: { type: "string" },
                  props: { type: "array", items: { type: "string" } },
                  mood: { type: "string" }
                },
                required: ["location"],
                additionalProperties: false
              },
              lighting: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  direction: { type: "string" },
                  color: { type: "string" },
                  intensity: { type: "string" }
                },
                required: ["type"],
                additionalProperties: false
              },
              camera: {
                type: "object",
                properties: {
                  shot: { type: "string" },
                  angle: { type: "string" },
                  lens: { type: "string" },
                  dof: { type: "string" },
                  style: { type: "string" }
                },
                required: ["shot"],
                additionalProperties: false
              },
              quality: {
                type: "object",
                properties: {
                  resolution: { type: "string" },
                  style: { type: "string" },
                  details: { type: "array", items: { type: "string" } }
                },
                additionalProperties: false
              }
            },
            required: ["subject", "face", "hair", "outfit", "pose", "scene", "lighting", "camera"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }
    
    const jsonPrompt = JSON.parse(content) as JSONPromptSchema;
    const textPrompt = jsonToTextPrompt(jsonPrompt);
    
    return { jsonPrompt, textPrompt };
  } catch (error) {
    console.error("Failed to generate character variation:", error);
    // Fallback: merge base character with simple scene change
    const fallbackPrompt = {
      ...baseCharacter,
      scene: {
        ...baseCharacter.scene,
        location: newSceneDescription
      }
    };
    return {
      jsonPrompt: fallbackPrompt as JSONPromptSchema,
      textPrompt: jsonToTextPrompt(fallbackPrompt as JSONPromptSchema)
    };
  }
}

// Analyze reference image to extract character features (placeholder for future vision API)
export async function analyzeReferenceImage(
  imageUrl: string
): Promise<Partial<JSONPromptSchema>> {
  // This would use a vision model to analyze the reference image
  // For now, return a placeholder that indicates manual input is needed
  
  const systemPrompt = `You are an expert at analyzing images of people and extracting detailed physical characteristics for AI image generation prompts.

Analyze the provided image and extract:
1. Subject details (gender, approximate age, ethnicity, body type)
2. Face details (face shape, eye color/shape, eyebrows, nose, lips, skin tone/condition)
3. Hair details (color, length, style, texture)

Be extremely specific and detailed to enable consistent recreation of this person's appearance.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            { type: "text", text: "Analyze this reference image and extract the character's physical features:" },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "character_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["woman", "man", "person"] },
                  age: { type: "string" },
                  ethnicity: { type: "string" },
                  bodyType: { type: "string" }
                },
                required: ["type", "age"],
                additionalProperties: false
              },
              face: {
                type: "object",
                properties: {
                  shape: { type: "string" },
                  eyes: { type: "string" },
                  eyebrows: { type: "string" },
                  nose: { type: "string" },
                  lips: { type: "string" },
                  skin: { type: "string" },
                  makeup: { type: "string" },
                  expression: { type: "string" }
                },
                required: ["eyes"],
                additionalProperties: false
              },
              hair: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  length: { type: "string" },
                  style: { type: "string" },
                  texture: { type: "string" }
                },
                required: ["color", "length", "style"],
                additionalProperties: false
              }
            },
            required: ["subject", "face", "hair"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from vision analysis");
    }
    
    return JSON.parse(content) as Partial<JSONPromptSchema>;
  } catch (error) {
    console.error("Failed to analyze reference image:", error);
    return {};
  }
}

// Build optimized prompt with reference image for consistent generation
export function buildConsistentPrompt(
  jsonPrompt: JSONPromptSchema,
  referenceImageUrl?: string
): { prompt: string; referenceImage?: string } {
  const textPrompt = jsonToTextPrompt(jsonPrompt);
  
  // Add consistency boosters
  const consistencyBoost = "same person, consistent identity, exact same face, identical features";
  const qualityBoost = "masterpiece, best quality, ultra detailed, photorealistic, 8K UHD";
  
  const finalPrompt = `${textPrompt}, ${consistencyBoost}, ${qualityBoost}`;
  
  return {
    prompt: finalPrompt,
    referenceImage: referenceImageUrl
  };
}
