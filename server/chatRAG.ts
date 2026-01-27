import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { sql } from "drizzle-orm";

// Types for RAG system
export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  contentType: "platform_feature" | "how_to" | "best_practice" | "faq" | "pricing" | "policy" | "tip" | "industry";
  category: string;
  tags: string[];
  priority: number;
}

export interface RAGContext {
  relevantKnowledge: KnowledgeItem[];
  suggestedLinks: { url: string; label: string; reason: string }[];
}

// Platform knowledge base - pre-defined content
export const PLATFORM_KNOWLEDGE: Array<Omit<KnowledgeItem, "id">> = [
  // Platform Features
  {
    title: "AI Influencer Studio",
    content: "The Studio is where you create and customize your AI influencer. You can design their appearance, set their personality traits, and generate professional photos. Access it from the main navigation or dashboard.",
    contentType: "platform_feature",
    category: "creation",
    tags: ["studio", "create", "design", "customize", "appearance"],
    priority: 10
  },
  {
    title: "Character Consistency",
    content: "Our platform uses advanced AI to maintain character consistency across all generated images. Your AI influencer will look the same in every photo, making them feel like a real person. Use the same character seed and reference images for best results.",
    contentType: "platform_feature",
    category: "generation",
    tags: ["consistency", "character", "same face", "identity"],
    priority: 9
  },
  {
    title: "Cinematography Presets",
    content: "Professional cinematography presets let you create stunning, film-quality images. Choose from camera gear presets (Sony, Canon, RED, ARRI), lens options (24mm to 200mm), lighting setups (Rembrandt, Golden Hour, Noir), and director styles (Wes Anderson, Christopher Nolan).",
    contentType: "platform_feature",
    category: "generation",
    tags: ["cinematography", "camera", "lens", "lighting", "film", "professional"],
    priority: 8
  },
  {
    title: "Scene Generator / Storyboard Mode",
    content: "Create multiple shots of your AI influencer in different poses and angles while maintaining consistency. Perfect for creating content series, storyboards, or social media campaigns. Generate 2x2, 3x3, or 4x4 grids of related images.",
    contentType: "platform_feature",
    category: "generation",
    tags: ["storyboard", "scene", "multiple", "poses", "angles", "series"],
    priority: 8
  },
  {
    title: "Elements Tool (Reference Images)",
    content: "Upload reference images to guide the AI. You can lock specific elements like face, outfit, background, or props. Adjust the reference strength from 0-100% to control how closely the AI follows your references.",
    contentType: "platform_feature",
    category: "generation",
    tags: ["reference", "elements", "upload", "lock", "face", "outfit"],
    priority: 7
  },
  {
    title: "Chat Companion System",
    content: "Create AI personalities that can chat with fans. Set personality traits (flirty, friendly, mysterious), chat style, and response length. The AI remembers past conversations and can recommend exclusive content.",
    contentType: "platform_feature",
    category: "monetization",
    tags: ["chat", "companion", "personality", "fans", "conversation"],
    priority: 9
  },
  {
    title: "Exclusive Content Sales",
    content: "Sell exclusive photos and content through the chat companion. Set prices for individual pieces or create bundles. Fans can purchase directly in the chat interface.",
    contentType: "platform_feature",
    category: "monetization",
    tags: ["exclusive", "content", "sell", "price", "monetize"],
    priority: 8
  },
  
  // How-To Guides
  {
    title: "How to Create Your First AI Influencer",
    content: "1. Go to Studio from the navigation. 2. Choose a base style or upload reference images. 3. Set personality traits and bio. 4. Generate your first image. 5. Save your character for consistency. Start with simple prompts and gradually add more detail.",
    contentType: "how_to",
    category: "getting_started",
    tags: ["create", "first", "start", "beginner", "tutorial"],
    priority: 10
  },
  {
    title: "How to Maintain Character Consistency",
    content: "For consistent results: 1. Always use the same character seed. 2. Upload a clear reference image of your character's face. 3. Use the Elements tool to lock facial features. 4. Keep similar lighting and style across generations. 5. Use the same camera/lens presets.",
    contentType: "how_to",
    category: "generation",
    tags: ["consistency", "same", "character", "face", "identity"],
    priority: 9
  },
  {
    title: "How to Set Up Chat Companion",
    content: "1. Create an AI personality in the Companion section. 2. Set personality type (flirty, friendly, etc.). 3. Write a compelling bio. 4. Set pricing for messages and content. 5. Upload exclusive content to sell. 6. Share your companion's chat link with fans.",
    contentType: "how_to",
    category: "monetization",
    tags: ["chat", "companion", "setup", "personality", "monetize"],
    priority: 8
  },
  
  // Best Practices
  {
    title: "Best Practices for Prompt Writing",
    content: "Write detailed prompts with: subject description, setting/location, lighting conditions, camera angle, mood/atmosphere. Be specific but not overly long. Use cinematography presets to add professional quality. Example: 'Professional portrait, soft natural lighting, shallow depth of field, warm color palette'",
    contentType: "best_practice",
    category: "generation",
    tags: ["prompt", "writing", "tips", "quality", "professional"],
    priority: 8
  },
  {
    title: "Best Practices for Monetization",
    content: "Successful creators: 1. Post consistently (daily or every other day). 2. Engage with fans through chat. 3. Offer tiered content (free teasers, paid exclusives). 4. Create content series/themes. 5. Use scarcity (limited time offers). 6. Build a story/narrative for your AI influencer.",
    contentType: "best_practice",
    category: "monetization",
    tags: ["monetize", "earn", "money", "success", "tips"],
    priority: 9
  },
  {
    title: "Content Strategy Tips",
    content: "Plan your content: 1. Create a content calendar. 2. Mix different types (portraits, lifestyle, themed). 3. Follow trends but maintain your unique style. 4. Engage with current events/seasons. 5. Create series that keep fans coming back. 6. Use analytics to see what performs best.",
    contentType: "best_practice",
    category: "content",
    tags: ["strategy", "content", "planning", "calendar", "success"],
    priority: 7
  },
  
  // FAQs
  {
    title: "How much does it cost?",
    content: "We offer flexible pricing: Free tier includes limited generations. Basic plan starts at $9.99/month with more credits. Premium and VIP tiers offer unlimited generations and exclusive features. Check the Pricing page for current offers and credit packages.",
    contentType: "faq",
    category: "pricing",
    tags: ["cost", "price", "free", "subscription", "credits"],
    priority: 10
  },
  {
    title: "Can I use the images commercially?",
    content: "Yes! All images you generate are yours to use commercially. You can sell them, use them for marketing, or monetize them through our platform. We recommend checking local laws regarding AI-generated content disclosure.",
    contentType: "faq",
    category: "legal",
    tags: ["commercial", "sell", "rights", "license", "legal"],
    priority: 8
  },
  {
    title: "How do I earn money?",
    content: "Multiple ways to earn: 1. Sell exclusive content through chat companion. 2. Receive tips from fans. 3. Charge per message in premium chats. 4. Sell content bundles. 5. Affiliate program - earn commission for referrals. Earnings are paid out via Stripe.",
    contentType: "faq",
    category: "monetization",
    tags: ["earn", "money", "income", "payout", "stripe"],
    priority: 9
  },
  {
    title: "What makes your AI different?",
    content: "Our platform specializes in character consistency - your AI influencer looks the same in every image. We also offer professional cinematography presets, advanced memory for chat companions, and a complete monetization system. It's an all-in-one platform for AI influencer creation.",
    contentType: "faq",
    category: "general",
    tags: ["different", "unique", "special", "why", "compare"],
    priority: 7
  },
  
  // Industry Knowledge
  {
    title: "AI Influencer Industry Overview",
    content: "AI influencers are virtual personalities created using AI. They can have millions of followers and earn significant income through brand deals, merchandise, and fan engagement. The industry is growing rapidly with brands increasingly working with AI personalities for marketing.",
    contentType: "industry",
    category: "overview",
    tags: ["industry", "market", "trend", "virtual", "influencer"],
    priority: 6
  },
  {
    title: "Successful AI Influencer Examples",
    content: "Notable AI influencers include Lil Miquela (3M+ followers), Imma (400K+ followers), and Shudu (230K+ followers). They work with major brands like Prada, Calvin Klein, and Samsung. Success factors: consistent character, engaging personality, regular content, authentic storytelling.",
    contentType: "industry",
    category: "examples",
    tags: ["examples", "successful", "famous", "miquela", "imma"],
    priority: 5
  }
];

// Internal links for proactive suggestions
export const INTERNAL_LINKS = [
  { url: "/studio", label: "AI Studio", keywords: ["create", "generate", "image", "photo", "design", "customize"] },
  { url: "/gallery", label: "Gallery", keywords: ["gallery", "images", "photos", "collection", "view"] },
  { url: "/pricing", label: "Pricing", keywords: ["price", "cost", "subscription", "credits", "plan", "upgrade"] },
  { url: "/companion", label: "Chat Companion", keywords: ["chat", "companion", "personality", "fans", "monetize"] },
  { url: "/dashboard", label: "Dashboard", keywords: ["dashboard", "stats", "analytics", "earnings", "overview"] },
  { url: "/settings", label: "Settings", keywords: ["settings", "account", "profile", "preferences"] },
  { url: "/affiliate", label: "Affiliate Program", keywords: ["affiliate", "referral", "commission", "earn", "share"] }
];

// Initialize knowledge base in database
export async function initializeKnowledgeBase(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if knowledge base is already populated
    const existing = await db.execute(sql`SELECT COUNT(*) as count FROM knowledgeBase`);
    const count = (existing as any)[0]?.[0]?.count || 0;
    
    if (count > 0) {
      console.log("[RAG] Knowledge base already initialized with", count, "items");
      return;
    }

    // Insert all knowledge items
    for (const item of PLATFORM_KNOWLEDGE) {
      await db.execute(sql`
        INSERT INTO knowledgeBase (title, content, contentType, category, tags, priority)
        VALUES (${item.title}, ${item.content}, ${item.contentType}, ${item.category}, ${JSON.stringify(item.tags)}, ${item.priority})
      `);
    }

    console.log("[RAG] Knowledge base initialized with", PLATFORM_KNOWLEDGE.length, "items");
  } catch (error) {
    console.error("[RAG] Error initializing knowledge base:", error);
  }
}

// Search knowledge base by keywords (now using database only)
export async function searchKnowledge(
  query: string,
  limit: number = 5
): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[RAG] Database not available, returning empty results");
    return [];
  }

  try {
    // Extract keywords from query
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (keywords.length === 0) return [];

    // Build search conditions
    const searchConditions = keywords.map(kw => 
      `(LOWER(title) LIKE '%${kw}%' OR LOWER(content) LIKE '%${kw}%' OR LOWER(tags) LIKE '%${kw}%')`
    ).join(' OR ');

    const rows = await db.execute(sql.raw(`
      SELECT id, title, content, content_type as contentType, category, tags, priority 
      FROM knowledge_base 
      WHERE is_active = TRUE AND (${searchConditions})
      ORDER BY priority DESC
      LIMIT ${limit}
    `));

    const results = ((rows as any)[0] as any[]).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.contentType,
      category: row.category,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      priority: row.priority
    }));

    console.log(`[RAG] Found ${results.length} knowledge items for query: "${query}"`);
    return results;
  } catch (error) {
    console.error("[RAG] Error searching knowledge:", error);
    return [];
  }
}

// Get relevant knowledge for a message using LLM
export async function getRelevantKnowledge(
  userMessage: string,
  conversationContext?: string
): Promise<RAGContext> {
  try {
    // First, use keyword search
    const keywordResults = await searchKnowledge(userMessage, 3);

    // Determine relevant internal links
    const suggestedLinks = findRelevantLinks(userMessage);

    // If we have good keyword matches, use them
    if (keywordResults.length > 0) {
      return {
        relevantKnowledge: keywordResults,
        suggestedLinks
      };
    }

    // Fallback: use LLM to determine intent and find relevant knowledge
    const intentResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that categorizes user questions about an AI influencer platform.
          
Categorize the user's message into one of these categories:
- creation: Questions about creating AI influencers, using the studio
- generation: Questions about generating images, consistency, quality
- monetization: Questions about earning money, selling content, chat companion
- pricing: Questions about costs, subscriptions, credits
- technical: Technical questions, troubleshooting
- general: General questions about the platform or AI influencers

Return a JSON object with:
- category: one of the categories above
- keywords: array of 3-5 relevant keywords
- needsHelp: boolean, true if user seems confused or needs assistance`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              needsHelp: { type: "boolean" }
            },
            required: ["category", "keywords", "needsHelp"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = intentResponse.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : '';
    
    if (content) {
      const intent = JSON.parse(content);
      
      // Search with extracted keywords
      const keywordSearch = intent.keywords.join(' ');
      const results = await searchKnowledge(keywordSearch, 3);
      
      return {
        relevantKnowledge: results,
        suggestedLinks
      };
    }

    return {
      relevantKnowledge: [],
      suggestedLinks
    };
  } catch (error) {
    console.error("[RAG] Error getting relevant knowledge:", error);
    return {
      relevantKnowledge: [],
      suggestedLinks: findRelevantLinks(userMessage)
    };
  }
}

// Find relevant internal links based on message content
function findRelevantLinks(message: string): Array<{ url: string; label: string; reason: string }> {
  const messageLower = message.toLowerCase();
  const relevantLinks: Array<{ url: string; label: string; reason: string }> = [];

  for (const link of INTERNAL_LINKS) {
    const matchedKeywords = link.keywords.filter(kw => messageLower.includes(kw));
    if (matchedKeywords.length > 0) {
      relevantLinks.push({
        url: link.url,
        label: link.label,
        reason: `Related to: ${matchedKeywords.join(', ')}`
      });
    }
  }

  return relevantLinks.slice(0, 3); // Max 3 links
}

// Build RAG context for LLM prompt
export function buildRAGContext(ragContext: RAGContext): string {
  if (ragContext.relevantKnowledge.length === 0 && ragContext.suggestedLinks.length === 0) {
    return "";
  }

  let context = "\n\n[PLATFORM KNOWLEDGE - Use this to provide accurate information]\n";

  if (ragContext.relevantKnowledge.length > 0) {
    context += "\nRelevant information:\n";
    for (const item of ragContext.relevantKnowledge) {
      context += `\n**${item.title}**\n${item.content}\n`;
    }
  }

  if (ragContext.suggestedLinks.length > 0) {
    context += "\n\nYou can suggest these pages to the user (include as clickable links):\n";
    for (const link of ragContext.suggestedLinks) {
      context += `- [${link.label}](${link.url})\n`;
    }
  }

  context += "\nUse this knowledge to provide helpful, accurate responses. Naturally suggest relevant links when appropriate.";

  return context;
}

// Get all knowledge items (for admin)
export async function getAllKnowledge(): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT * FROM knowledgeBase 
      WHERE isActive = TRUE
      ORDER BY priority DESC, category, title
    `);

    return ((rows as any)[0] as any[]).map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || []
    }));
  } catch (error) {
    console.error("[RAG] Error getting all knowledge:", error);
    return [];
  }
}

// Add new knowledge item
export async function addKnowledge(item: Omit<KnowledgeItem, "id">): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.execute(sql`
      INSERT INTO knowledgeBase (title, content, contentType, category, tags, priority)
      VALUES (${item.title}, ${item.content}, ${item.contentType}, ${item.category}, ${JSON.stringify(item.tags)}, ${item.priority})
    `);

    return (result as any)[0]?.insertId || 0;
  } catch (error) {
    console.error("[RAG] Error adding knowledge:", error);
    return 0;
  }
}

// Update knowledge item
export async function updateKnowledge(id: number, updates: Partial<KnowledgeItem>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const setClause: string[] = [];
    
    if (updates.title) setClause.push(`title = '${updates.title.replace(/'/g, "''")}'`);
    if (updates.content) setClause.push(`content = '${updates.content.replace(/'/g, "''")}'`);
    if (updates.contentType) setClause.push(`contentType = '${updates.contentType}'`);
    if (updates.category) setClause.push(`category = '${updates.category}'`);
    if (updates.tags) setClause.push(`tags = '${JSON.stringify(updates.tags)}'`);
    if (updates.priority !== undefined) setClause.push(`priority = ${updates.priority}`);

    if (setClause.length === 0) return false;

    await db.execute(sql.raw(`UPDATE knowledgeBase SET ${setClause.join(", ")} WHERE id = ${id}`));
    return true;
  } catch (error) {
    console.error("[RAG] Error updating knowledge:", error);
    return false;
  }
}

// Delete knowledge item
export async function deleteKnowledge(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`UPDATE knowledgeBase SET isActive = FALSE WHERE id = ${id}`);
    return true;
  } catch (error) {
    console.error("[RAG] Error deleting knowledge:", error);
    return false;
  }
}
