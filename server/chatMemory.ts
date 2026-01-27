import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { sql } from "drizzle-orm";
import type { ChatMessage, InfluencerPersonality } from "../drizzle/schema";

// Types for memory system
export interface UserMemory {
  id: number;
  fanUserId: number;
  personalityId: number;
  memoryType: "fact" | "preference" | "interest" | "relationship" | "goal" | "experience" | "context";
  category: string | null;
  content: string;
  confidence: number;
  timesUsed: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface ConversationSummary {
  id: number;
  conversationId: number;
  summary: string;
  keyTopics: string[];
  emotionalTone: string | null;
  messageCount: number;
}

export interface ChatContext {
  recentSummary: string | null;
  activeMemories: UserMemory[];
  conversationMood: string | null;
  engagementLevel: "low" | "medium" | "high";
  suggestedTopics: string[];
  suggestedLinks: { url: string; label: string; reason: string }[];
}

// Memory extraction prompt
const MEMORY_EXTRACTION_PROMPT = `You are an AI assistant that extracts memorable facts and preferences from conversations.

Analyze the following message from a user and extract any personal information, preferences, or facts they shared.

For each piece of information, categorize it as:
- fact: Factual info (name, job, location, age)
- preference: Likes/dislikes (favorite color, food preferences)
- interest: Topics they're interested in
- relationship: Family, relationship status
- goal: Aspirations, plans
- experience: Past experiences they shared
- context: General context about them

Return a JSON array of extracted memories. Each memory should have:
- type: one of the categories above
- category: a subcategory (e.g., "work" for job info)
- content: the actual information
- confidence: 0.0-1.0 how confident you are

If no memorable information is found, return an empty array.

Example output:
[
  {"type": "fact", "category": "work", "content": "Works as a software engineer", "confidence": 0.95},
  {"type": "preference", "category": "food", "content": "Loves Italian food", "confidence": 0.85}
]`;

// Extract memories from a message
export async function extractMemoriesFromMessage(
  message: string,
  fanUserId: number,
  personalityId: number,
  conversationId: number,
  messageId: number
): Promise<UserMemory[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: MEMORY_EXTRACTION_PROMPT },
        { role: "user", content: `Message: "${message}"` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_extraction",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["fact", "preference", "interest", "relationship", "goal", "experience", "context"] 
                },
                category: { type: "string" },
                content: { type: "string" },
                confidence: { type: "number" }
              },
              required: ["type", "category", "content", "confidence"],
              additionalProperties: false
            }
          }
        }
      }
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : '';
    if (!content) return [];

    const memories = JSON.parse(content) as Array<{
      type: UserMemory["memoryType"];
      category: string;
      content: string;
      confidence: number;
    }>;

    // Save memories to database
    const savedMemories: UserMemory[] = [];
    for (const memory of memories) {
      if (memory.confidence >= 0.6) { // Only save high-confidence memories
        const result = await db.execute(sql`
          INSERT INTO userMemories (fanUserId, personalityId, memoryType, category, content, confidence, sourceMessageId, sourceConversationId)
          VALUES (${fanUserId}, ${personalityId}, ${memory.type}, ${memory.category}, ${memory.content}, ${memory.confidence}, ${messageId}, ${conversationId})
        `);
        
        const insertId = (result as any)[0]?.insertId || 0;
        
        savedMemories.push({
          id: insertId,
          fanUserId,
          personalityId,
          memoryType: memory.type,
          category: memory.category,
          content: memory.content,
          confidence: memory.confidence,
          timesUsed: 0,
          isActive: true,
          isVerified: false
        });
      }
    }

    return savedMemories;
  } catch (error) {
    console.error("[ChatMemory] Error extracting memories:", error);
    return [];
  }
}

// Get relevant memories for a user
export async function getRelevantMemories(
  fanUserId: number,
  personalityId: number,
  currentMessage?: string,
  limit: number = 10
): Promise<UserMemory[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT * FROM userMemories 
      WHERE fanUserId = ${fanUserId} AND personalityId = ${personalityId} AND isActive = TRUE
      ORDER BY timesUsed DESC, confidence DESC, createdAt DESC
      LIMIT ${limit}
    `);
    
    return (rows as any)[0] as UserMemory[];
  } catch (error) {
    console.error("[ChatMemory] Error getting memories:", error);
    return [];
  }
}

// Update memory usage
export async function updateMemoryUsage(memoryIds: number[]): Promise<void> {
  if (memoryIds.length === 0) return;
  
  const db = await getDb();
  if (!db) return;

  try {
    const idList = memoryIds.join(',');
    await db.execute(sql.raw(`UPDATE userMemories SET timesUsed = timesUsed + 1, lastUsedAt = NOW() WHERE id IN (${idList})`));
  } catch (error) {
    console.error("[ChatMemory] Error updating memory usage:", error);
  }
}

// Generate conversation summary
const SUMMARY_PROMPT = `You are an AI assistant that summarizes conversations.

Summarize the following conversation between a fan and an AI influencer.
Focus on:
1. Main topics discussed
2. Key information shared by the fan
3. Emotional tone of the conversation
4. Any requests or interests expressed

Return a JSON object with:
- summary: A brief summary (2-3 sentences)
- keyTopics: Array of main topics (max 5)
- emotionalTone: Overall tone (e.g., "friendly", "flirty", "curious", "excited")

Example:
{
  "summary": "The fan discussed their interest in photography and asked about the influencer's travel experiences. They seemed excited about potentially meeting up.",
  "keyTopics": ["photography", "travel", "meetup"],
  "emotionalTone": "excited"
}`;

export async function generateConversationSummary(
  conversationId: number,
  fanUserId: number,
  personalityId: number,
  messages: Array<{ role: string; content: string }>
): Promise<ConversationSummary | null> {
  if (messages.length < 5) return null; // Don't summarize short conversations

  const db = await getDb();
  if (!db) return null;

  try {
    const conversationText = messages
      .map(m => `${m.role === "fan" ? "Fan" : "AI"}: ${m.content}`)
      .join("\n");

    const response = await invokeLLM({
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: conversationText }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "conversation_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              keyTopics: { type: "array", items: { type: "string" } },
              emotionalTone: { type: "string" }
            },
            required: ["summary", "keyTopics", "emotionalTone"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : '';
    if (!content) return null;

    const parsed = JSON.parse(content);
    const keyTopicsJson = JSON.stringify(parsed.keyTopics);

    // Save to database
    const result = await db.execute(sql`
      INSERT INTO conversationSummaries 
      (conversationId, fanUserId, personalityId, summary, keyTopics, emotionalTone, messageRangeStart, messageRangeEnd, messageCount)
      VALUES (${conversationId}, ${fanUserId}, ${personalityId}, ${parsed.summary}, ${keyTopicsJson}, ${parsed.emotionalTone}, 1, ${messages.length}, ${messages.length})
    `);

    const insertId = (result as any)[0]?.insertId || 0;

    return {
      id: insertId,
      conversationId,
      summary: parsed.summary,
      keyTopics: parsed.keyTopics,
      emotionalTone: parsed.emotionalTone,
      messageCount: messages.length
    };
  } catch (error) {
    console.error("[ChatMemory] Error generating summary:", error);
    return null;
  }
}

// Get conversation summaries
export async function getConversationSummaries(
  conversationId: number,
  limit: number = 5
): Promise<ConversationSummary[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT * FROM conversationSummaries 
      WHERE conversationId = ${conversationId}
      ORDER BY createdAt DESC
      LIMIT ${limit}
    `);
    
    return ((rows as any)[0] as any[]).map(row => ({
      ...row,
      keyTopics: typeof row.keyTopics === 'string' ? JSON.parse(row.keyTopics) : row.keyTopics
    }));
  } catch (error) {
    console.error("[ChatMemory] Error getting summaries:", error);
    return [];
  }
}

// Build memory context for LLM
export function buildMemoryContext(memories: UserMemory[], summaries: ConversationSummary[]): string {
  if (memories.length === 0 && summaries.length === 0) return "";

  let context = "\n\n[MEMORY CONTEXT - Use this to personalize your responses]\n";

  if (memories.length > 0) {
    context += "\nThings you remember about this fan:\n";
    for (const memory of memories) {
      context += `- ${memory.content} (${memory.memoryType})\n`;
    }
  }

  if (summaries.length > 0) {
    context += "\nPrevious conversation summary:\n";
    const latestSummary = summaries[0];
    context += `${latestSummary.summary}\n`;
    if (latestSummary.keyTopics.length > 0) {
      context += `Topics discussed: ${latestSummary.keyTopics.join(", ")}\n`;
    }
  }

  context += "\nUse this context naturally in your responses. Reference past conversations when relevant, but don't be creepy about it.";

  return context;
}

// Get or create chat context cache
export async function getChatContext(
  conversationId: number,
  fanUserId: number,
  personalityId: number
): Promise<ChatContext> {
  const db = await getDb();
  if (!db) {
    return {
      recentSummary: null,
      activeMemories: [],
      conversationMood: null,
      engagementLevel: "medium",
      suggestedTopics: [],
      suggestedLinks: []
    };
  }

  try {
    const rows = await db.execute(sql`
      SELECT * FROM chatContextCache WHERE conversationId = ${conversationId}
    `);

    const results = (rows as any)[0] as any[];
    if (results.length > 0) {
      const cache = results[0];
      return {
        recentSummary: cache.recentSummary,
        activeMemories: cache.activeMemories ? JSON.parse(cache.activeMemories) : [],
        conversationMood: cache.conversationMood,
        engagementLevel: cache.engagementLevel,
        suggestedTopics: cache.suggestedTopics ? JSON.parse(cache.suggestedTopics) : [],
        suggestedLinks: cache.suggestedLinks ? JSON.parse(cache.suggestedLinks) : []
      };
    }

    // Create new cache entry
    await db.execute(sql`
      INSERT INTO chatContextCache (conversationId, fanUserId, personalityId) 
      VALUES (${conversationId}, ${fanUserId}, ${personalityId})
    `);

    return {
      recentSummary: null,
      activeMemories: [],
      conversationMood: null,
      engagementLevel: "medium",
      suggestedTopics: [],
      suggestedLinks: []
    };
  } catch (error) {
    console.error("[ChatMemory] Error getting chat context:", error);
    return {
      recentSummary: null,
      activeMemories: [],
      conversationMood: null,
      engagementLevel: "medium",
      suggestedTopics: [],
      suggestedLinks: []
    };
  }
}

// Update chat context cache
export async function updateChatContext(
  conversationId: number,
  updates: Partial<ChatContext>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.recentSummary !== undefined) {
      setClause.push(`recentSummary = '${updates.recentSummary?.replace(/'/g, "''") || ''}'`);
    }
    if (updates.activeMemories !== undefined) {
      setClause.push(`activeMemories = '${JSON.stringify(updates.activeMemories.map(m => m.id))}'`);
    }
    if (updates.conversationMood !== undefined) {
      setClause.push(`conversationMood = '${updates.conversationMood?.replace(/'/g, "''") || ''}'`);
    }
    if (updates.engagementLevel !== undefined) {
      setClause.push(`engagementLevel = '${updates.engagementLevel}'`);
    }
    if (updates.suggestedTopics !== undefined) {
      setClause.push(`suggestedTopics = '${JSON.stringify(updates.suggestedTopics)}'`);
    }
    if (updates.suggestedLinks !== undefined) {
      setClause.push(`suggestedLinks = '${JSON.stringify(updates.suggestedLinks)}'`);
    }

    if (setClause.length === 0) return;

    await db.execute(sql.raw(`UPDATE chatContextCache SET ${setClause.join(", ")} WHERE conversationId = ${conversationId}`));
  } catch (error) {
    console.error("[ChatMemory] Error updating chat context:", error);
  }
}

// Delete user memories (for privacy)
export async function deleteUserMemories(
  fanUserId: number,
  personalityId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    let result;
    if (personalityId) {
      result = await db.execute(sql`
        DELETE FROM userMemories WHERE fanUserId = ${fanUserId} AND personalityId = ${personalityId}
      `);
    } else {
      result = await db.execute(sql`
        DELETE FROM userMemories WHERE fanUserId = ${fanUserId}
      `);
    }
    return (result as any)[0]?.affectedRows || 0;
  } catch (error) {
    console.error("[ChatMemory] Error deleting memories:", error);
    return 0;
  }
}

// Get memory stats for a user
export async function getMemoryStats(fanUserId: number, personalityId: number): Promise<{
  totalMemories: number;
  byType: Record<string, number>;
  mostUsed: UserMemory[];
}> {
  const db = await getDb();
  if (!db) return { totalMemories: 0, byType: {}, mostUsed: [] };

  try {
    const countRows = await db.execute(sql`
      SELECT memoryType, COUNT(*) as count FROM userMemories 
      WHERE fanUserId = ${fanUserId} AND personalityId = ${personalityId} AND isActive = TRUE
      GROUP BY memoryType
    `);

    const mostUsedRows = await db.execute(sql`
      SELECT * FROM userMemories 
      WHERE fanUserId = ${fanUserId} AND personalityId = ${personalityId} AND isActive = TRUE
      ORDER BY timesUsed DESC
      LIMIT 5
    `);

    const byType: Record<string, number> = {};
    let total = 0;
    for (const row of (countRows as any)[0] as any[]) {
      byType[row.memoryType] = row.count;
      total += row.count;
    }

    return {
      totalMemories: total,
      byType,
      mostUsed: (mostUsedRows as any)[0] as UserMemory[]
    };
  } catch (error) {
    console.error("[ChatMemory] Error getting memory stats:", error);
    return { totalMemories: 0, byType: {}, mostUsed: [] };
  }
}
