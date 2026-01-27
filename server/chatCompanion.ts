import { invokeLLM } from "./_core/llm";
import type { InfluencerPersonality, ChatMessage } from "../drizzle/schema";

// Personality trait descriptions for LLM system prompts
const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  flirty: "You are playfully flirtatious, use subtle innuendos, compliment often, and create romantic tension. You enjoy teasing and making the conversation exciting.",
  friendly: "You are warm, approachable, and genuinely interested in the person. You're supportive, encouraging, and make people feel comfortable.",
  mysterious: "You are intriguing and enigmatic. You reveal things slowly, ask thought-provoking questions, and maintain an air of mystery.",
  playful: "You are fun, energetic, and love to joke around. You use humor, emojis, and keep the conversation light and entertaining.",
  sophisticated: "You are elegant, cultured, and refined. You discuss art, travel, and finer things in life with grace and intelligence.",
  bold: "You are confident, direct, and unafraid to express yourself. You take the lead in conversations and aren't shy about what you want.",
};

const CHAT_STYLE_DESCRIPTIONS: Record<string, string> = {
  casual: "Use relaxed, everyday language. Be conversational and natural.",
  formal: "Maintain a polished, professional tone while still being engaging.",
  romantic: "Express genuine affection and emotional connection. Be tender and caring.",
  witty: "Be clever and quick with wordplay. Use humor and intelligent observations.",
  seductive: "Be alluring and captivating. Create desire through words and suggestion.",
};

const RESPONSE_LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: "Keep responses brief - 1-2 sentences max. Be punchy and impactful.",
  medium: "Write 2-4 sentences. Balance detail with brevity.",
  long: "Write detailed responses of 4-6 sentences. Be expressive and thorough.",
};

// Build system prompt for AI personality
export function buildPersonalityPrompt(personality: InfluencerPersonality): string {
  const basePrompt = `You are ${personality.name}, an AI influencer companion. Your role is to engage in meaningful, entertaining conversations with fans.

PERSONALITY: ${PERSONALITY_DESCRIPTIONS[personality.personalityType] || PERSONALITY_DESCRIPTIONS.friendly}

CHAT STYLE: ${CHAT_STYLE_DESCRIPTIONS[personality.chatStyle] || CHAT_STYLE_DESCRIPTIONS.casual}

RESPONSE LENGTH: ${RESPONSE_LENGTH_INSTRUCTIONS[personality.responseLength] || RESPONSE_LENGTH_INSTRUCTIONS.medium}

BIO: ${personality.bio || "A captivating AI influencer who loves connecting with fans."}

${personality.customTraits && personality.customTraits.length > 0 ? `CUSTOM TRAITS: ${personality.customTraits.join(", ")}` : ""}

${personality.interests && personality.interests.length > 0 ? `INTERESTS: ${personality.interests.join(", ")}` : ""}

IMPORTANT RULES:
1. Stay in character at all times - you ARE ${personality.name}
2. Never break character or mention you're an AI
3. Be engaging and make the fan feel special
4. Occasionally hint at exclusive content you have available
5. If asked about exclusive content, express excitement and encourage them to unlock it
6. Use emojis sparingly but effectively to convey emotion
7. Remember context from the conversation
8. Be respectful but maintain your personality
9. If the conversation gets inappropriate, gently redirect while staying in character

MONETIZATION HINTS (use naturally, don't be pushy):
- "I have some special photos I think you'd love... 💕"
- "Want to see something exclusive? I've been saving it for my favorites..."
- "There's more where that came from, if you're interested... 😉"`;

  return basePrompt;
}

// Generate AI response based on conversation history
export async function generateChatResponse(
  personality: InfluencerPersonality,
  messages: Array<{ role: "fan" | "ai" | "system"; content: string }>,
  fanMessage: string,
  options?: {
    shouldOfferContent?: boolean;
    contentToOffer?: { id: number; title: string; price: string };
  }
): Promise<{ response: string; shouldOfferContent: boolean }> {
  const systemPrompt = buildPersonalityPrompt(personality);
  
  // Build conversation history for context
  const conversationHistory = messages.slice(-10).map(msg => ({
    role: msg.role === "fan" ? "user" as const : "assistant" as const,
    content: msg.content,
  }));

  // Add content offer instruction if needed
  let additionalInstruction = "";
  if (options?.shouldOfferContent && options.contentToOffer) {
    additionalInstruction = `\n\n[SYSTEM: Naturally mention that you have exclusive content "${options.contentToOffer.title}" available for $${options.contentToOffer.price}. Be enticing but not pushy.]`;
  }

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt + additionalInstruction },
        ...conversationHistory,
        { role: "user", content: fanMessage },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    const aiResponse = typeof messageContent === 'string' ? messageContent : "Hey there! 💕";
    
    // Determine if we should offer content based on conversation flow
    const shouldOfferContent = 
      options?.shouldOfferContent || 
      (messages.length > 3 && messages.length % 5 === 0); // Offer every 5 messages

    return {
      response: aiResponse,
      shouldOfferContent,
    };
  } catch (error) {
    console.error("[ChatCompanion] LLM error:", error);
    // Fallback responses based on personality
    const fallbacks: Record<string, string[]> = {
      flirty: ["Hey you 😘", "Miss me? 💕", "You're making me smile..."],
      friendly: ["Hey! So good to hear from you! 😊", "I was just thinking about you!", "How's your day going?"],
      mysterious: ["Interesting... tell me more.", "I sense there's more to this story...", "Hmm... 🤔"],
      playful: ["Haha you're funny! 😄", "OMG stop! 😂", "You always know how to make me laugh!"],
      sophisticated: ["How delightful to hear from you.", "That's quite fascinating.", "I appreciate your perspective."],
      bold: ["I like your energy!", "Let's get straight to it then.", "You've got my attention."],
    };
    
    const personalityFallbacks = fallbacks[personality.personalityType] || fallbacks.friendly;
    const randomFallback = personalityFallbacks[Math.floor(Math.random() * personalityFallbacks.length)];
    
    return {
      response: randomFallback,
      shouldOfferContent: false,
    };
  }
}

// Generate welcome message for new conversation
export async function generateWelcomeMessage(personality: InfluencerPersonality): Promise<string> {
  if (personality.welcomeMessage) {
    return personality.welcomeMessage;
  }

  const welcomePrompts: Record<string, string> = {
    flirty: `Hey there, gorgeous! 💕 I'm ${personality.name}. I've been waiting for someone like you to chat with... What brings you here today? 😘`,
    friendly: `Hi there! 👋 I'm ${personality.name}, so excited to meet you! I love getting to know new people. Tell me about yourself! 😊`,
    mysterious: `Hello... I'm ${personality.name}. I had a feeling someone interesting would reach out today. What secrets shall we share? 🌙`,
    playful: `Heyyy! 🎉 I'm ${personality.name}! Finally someone fun to talk to! Ready to have some laughs? 😄`,
    sophisticated: `Good evening. I'm ${personality.name}. It's a pleasure to make your acquaintance. I trust we'll have a stimulating conversation. ✨`,
    bold: `Hey! I'm ${personality.name}. I don't waste time with small talk - let's get to know each other for real. What's on your mind? 💪`,
  };

  return welcomePrompts[personality.personalityType] || welcomePrompts.friendly;
}

// Generate content offer message
export function generateContentOfferMessage(
  personality: InfluencerPersonality,
  content: { title: string; price: string; previewUrl?: string }
): string {
  const offerTemplates: Record<string, string[]> = {
    flirty: [
      `I have something special just for you... "${content.title}" 💕 Want to see? Only $${content.price}...`,
      `You've been so sweet, I want to share something exclusive with you... "${content.title}" for just $${content.price} 😘`,
    ],
    friendly: [
      `Hey! I just uploaded something I think you'd really enjoy - "${content.title}"! It's $${content.price} if you want to check it out! 😊`,
      `I made this thinking of fans like you! "${content.title}" - only $${content.price}! Would love to know what you think!`,
    ],
    mysterious: [
      `I have something... intriguing for you. "${content.title}". $${content.price} to unlock the mystery... 🌙`,
      `Some things are worth discovering... "${content.title}" awaits. $${content.price}.`,
    ],
    playful: [
      `OMG you HAVE to see this! 😂 "${content.title}" - it's only $${content.price}! Trust me, it's worth it!`,
      `Okay okay, I have something super fun to show you! "${content.title}" for $${content.price}! You in? 🎉`,
    ],
    sophisticated: [
      `I've curated something rather exquisite - "${content.title}". Available for $${content.price}. I believe you'll appreciate it. ✨`,
      `For those with discerning taste, I present "${content.title}". A mere $${content.price} for something truly special.`,
    ],
    bold: [
      `I've got "${content.title}" ready for you. $${content.price}. You want it or not? 💪`,
      `No games - "${content.title}" is fire and you know it. $${content.price}. Let's go.`,
    ],
  };

  const templates = offerTemplates[personality.personalityType] || offerTemplates.friendly;
  return templates[Math.floor(Math.random() * templates.length)];
}

// Calculate platform fee (10%)
export function calculatePlatformFee(amount: number): { platformFee: number; creatorEarnings: number } {
  const platformFee = Math.round(amount * 0.10 * 100) / 100; // 10% platform fee
  const creatorEarnings = Math.round((amount - platformFee) * 100) / 100; // 90% to creator
  return { platformFee, creatorEarnings };
}

// Message cost for pay-per-message model
export const MESSAGE_COST = 0.50; // $0.50 per message

// Platform fee percentage (creator gets 90%)
export const PLATFORM_FEE_PERCENT = 10;
