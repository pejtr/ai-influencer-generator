import { invokeLLM } from "./_core/llm";
import type { InfluencerPersonality, ChatMessage } from "../drizzle/schema";
import {
  extractMemoriesFromMessage,
  getRelevantMemories,
  buildMemoryContext,
  getConversationSummaries,
  generateConversationSummary,
  updateMemoryUsage,
  getChatContext,
  updateChatContext,
  type UserMemory,
  type ConversationSummary
} from "./chatMemory";
import {
  getRelevantKnowledge,
  buildRAGContext,
  initializeKnowledgeBase,
  type RAGContext
} from "./chatRAG";
import { buildPersonalityPrompt } from "./chatCompanion";

// Enhanced chat response with memory and RAG
export interface EnhancedChatResponse {
  response: string;
  shouldOfferContent: boolean;
  memoriesUsed: UserMemory[];
  newMemoriesExtracted: UserMemory[];
  suggestedLinks: Array<{ url: string; label: string; reason: string }>;
  conversationMood?: string;
}

// Initialize the enhanced chat system
export async function initializeEnhancedChat(): Promise<void> {
  await initializeKnowledgeBase();
  console.log("[EnhancedChat] System initialized");
}

// Generate enhanced AI response with memory and RAG
export async function generateEnhancedChatResponse(
  personality: InfluencerPersonality,
  messages: Array<{ role: "fan" | "ai" | "system"; content: string }>,
  fanMessage: string,
  fanUserId: number,
  conversationId: number,
  options?: {
    shouldOfferContent?: boolean;
    contentToOffer?: { id: number; title: string; price: string };
    lastMessageId?: number;
  }
): Promise<EnhancedChatResponse> {
  const personalityId = personality.id;

  // 1. Get relevant memories for this user
  const memories = await getRelevantMemories(fanUserId, personalityId, fanMessage);
  
  // 2. Get conversation summaries
  const summaries = await getConversationSummaries(conversationId);
  
  // 3. Get RAG context (platform knowledge + suggested links)
  const ragContext = await getRelevantKnowledge(fanMessage);
  
  // 4. Build enhanced system prompt
  const basePrompt = buildPersonalityPrompt(personality);
  const memoryContext = buildMemoryContext(memories, summaries);
  const ragContextStr = buildRAGContext(ragContext);
  
  const enhancedPrompt = basePrompt + memoryContext + ragContextStr + `

ENHANCED CAPABILITIES:
- You have access to the user's past conversations and preferences (shown in MEMORY CONTEXT)
- You know about the platform's features (shown in PLATFORM KNOWLEDGE)
- You can suggest relevant pages using markdown links like [Studio](/studio)
- Reference past conversations naturally when relevant
- If the user asks about platform features, use the knowledge provided
- Be helpful and guide users to relevant features when appropriate`;

  // 5. Build conversation history
  const conversationHistory = messages.slice(-10).map(msg => ({
    role: msg.role === "fan" ? "user" as const : "assistant" as const,
    content: msg.content,
  }));

  // 6. Add content offer instruction if needed
  let additionalInstruction = "";
  if (options?.shouldOfferContent && options.contentToOffer) {
    additionalInstruction = `\n\n[SYSTEM: Naturally mention that you have exclusive content "${options.contentToOffer.title}" available for $${options.contentToOffer.price}. Be enticing but not pushy.]`;
  }

  try {
    // 7. Generate response
    const response = await invokeLLM({
      messages: [
        { role: "system", content: enhancedPrompt + additionalInstruction },
        ...conversationHistory,
        { role: "user", content: fanMessage },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    const aiResponse = typeof messageContent === 'string' ? messageContent : "Hey there! 💕";

    // 8. Extract new memories from fan's message (async, don't wait)
    const newMemories = options?.lastMessageId 
      ? await extractMemoriesFromMessage(fanMessage, fanUserId, personalityId, conversationId, options.lastMessageId)
      : [];

    // 9. Update memory usage for memories that were used
    if (memories.length > 0) {
      await updateMemoryUsage(memories.map(m => m.id));
    }

    // 10. Analyze conversation mood
    const mood = await analyzeConversationMood(messages.slice(-5), fanMessage);

    // 11. Update chat context cache
    await updateChatContext(conversationId, {
      activeMemories: memories,
      conversationMood: mood,
      suggestedLinks: ragContext.suggestedLinks,
      suggestedTopics: ragContext.relevantKnowledge.map(k => k.category)
    });

    // 12. Generate summary if conversation is getting long
    if (messages.length > 0 && messages.length % 20 === 0) {
      generateConversationSummary(conversationId, fanUserId, personalityId, messages);
    }

    // Determine if we should offer content
    const shouldOfferContent = 
      options?.shouldOfferContent || 
      (messages.length > 3 && messages.length % 5 === 0);

    return {
      response: aiResponse,
      shouldOfferContent,
      memoriesUsed: memories,
      newMemoriesExtracted: newMemories,
      suggestedLinks: ragContext.suggestedLinks,
      conversationMood: mood
    };
  } catch (error) {
    console.error("[EnhancedChat] LLM error:", error);
    
    // Fallback responses
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
      memoriesUsed: [],
      newMemoriesExtracted: [],
      suggestedLinks: [],
    };
  }
}

// Analyze conversation mood
async function analyzeConversationMood(
  recentMessages: Array<{ role: string; content: string }>,
  currentMessage: string
): Promise<string> {
  if (recentMessages.length < 2) return "neutral";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Analyze the emotional tone of this conversation and return a single word describing the mood.
Options: excited, happy, curious, flirty, friendly, neutral, confused, frustrated, sad
Return only the mood word, nothing else.`
        },
        {
          role: "user",
          content: `Recent messages:\n${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nLatest: ${currentMessage}`
        }
      ]
    });

    const messageContent = response.choices[0]?.message?.content;
    const mood = typeof messageContent === 'string' ? messageContent.trim().toLowerCase() : 'neutral';
    
    const validMoods = ["excited", "happy", "curious", "flirty", "friendly", "neutral", "confused", "frustrated", "sad"];
    return validMoods.includes(mood) ? mood : "neutral";
  } catch {
    return "neutral";
  }
}

// Get conversation insights for display
export interface ConversationInsights {
  totalMessages: number;
  memoriesCount: number;
  topTopics: string[];
  mood: string;
  engagementLevel: "low" | "medium" | "high";
  suggestedActions: string[];
}

export async function getConversationInsights(
  conversationId: number,
  fanUserId: number,
  personalityId: number,
  messageCount: number
): Promise<ConversationInsights> {
  const memories = await getRelevantMemories(fanUserId, personalityId);
  const summaries = await getConversationSummaries(conversationId);
  const context = await getChatContext(conversationId, fanUserId, personalityId);

  // Extract topics from summaries
  const topTopics: string[] = [];
  for (const summary of summaries) {
    topTopics.push(...summary.keyTopics);
  }
  const uniqueTopics = Array.from(new Set(topTopics)).slice(0, 5);

  // Determine engagement level
  let engagementLevel: "low" | "medium" | "high" = "medium";
  if (messageCount > 50) engagementLevel = "high";
  else if (messageCount < 10) engagementLevel = "low";

  // Generate suggested actions
  const suggestedActions: string[] = [];
  if (memories.length === 0) {
    suggestedActions.push("Ask about their interests to build rapport");
  }
  if (messageCount > 10 && messageCount % 10 === 0) {
    suggestedActions.push("Consider offering exclusive content");
  }
  if (context.conversationMood === "excited" || context.conversationMood === "happy") {
    suggestedActions.push("Great mood! Good time for upselling");
  }

  return {
    totalMessages: messageCount,
    memoriesCount: memories.length,
    topTopics: uniqueTopics,
    mood: context.conversationMood || "neutral",
    engagementLevel,
    suggestedActions
  };
}

// Export for use in routers
export {
  getRelevantMemories,
  getConversationSummaries,
  deleteUserMemories,
  getMemoryStats
} from "./chatMemory";

export {
  searchKnowledge,
  getAllKnowledge,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge
} from "./chatRAG";
