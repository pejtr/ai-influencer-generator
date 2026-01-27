import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface AnalyticsOverview {
  totalConversations: number;
  activeUsers: number;
  avgMessagesPerConversation: number;
  satisfactionScore: number;
}

export interface TopicData {
  topic: string;
  count: number;
}

export interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: string;
  conversations: number;
  messages: number;
}

export interface RecentConversation {
  id: number;
  userId: number;
  userName: string;
  messageCount: number;
  lastMessageAt: string;
  mood: string | null;
  engagementLevel: string | null;
}

export interface MemoryInsights {
  totalMemories: number;
  avgMemoriesPerUser: number;
  topCategories: Array<{ category: string; count: number }>;
}

// Get overview statistics
export async function getAnalyticsOverview(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsOverview | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const dateFilter = startDate && endDate
      ? sql`AND created_at BETWEEN ${startDate} AND ${endDate}`
      : sql``;

    // Total conversations (unique conversation_id from chat_messages)
    const conversationsResult = await db.execute(sql`
      SELECT COUNT(DISTINCT conversation_id) as total
      FROM chat_messages
      WHERE 1=1 ${dateFilter}
    `);
    const totalConversations = (conversationsResult as any)[0]?.[0]?.total || 0;

    // Active users (unique user_id from chat_messages)
    const usersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM chat_messages
      WHERE 1=1 ${dateFilter}
    `);
    const activeUsers = (usersResult as any)[0]?.[0]?.total || 0;

    // Average messages per conversation
    const avgResult = await db.execute(sql`
      SELECT AVG(msg_count) as avg_messages
      FROM (
        SELECT conversation_id, COUNT(*) as msg_count
        FROM chat_messages
        WHERE 1=1 ${dateFilter}
        GROUP BY conversation_id
      ) as conv_counts
    `);
    const avgMessagesPerConversation = Math.round((avgResult as any)[0]?.[0]?.avg_messages || 0);

    // Satisfaction score (based on engagement level from conversation_summaries)
    const satisfactionResult = await db.execute(sql`
      SELECT AVG(
        CASE engagement_level
          WHEN 'high' THEN 5
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 1
          ELSE 3
        END
      ) as avg_score
      FROM conversation_summaries
      WHERE 1=1 ${dateFilter}
    `);
    const satisfactionScore = Number(((satisfactionResult as any)[0]?.[0]?.avg_score || 3).toFixed(1));

    return {
      totalConversations,
      activeUsers,
      avgMessagesPerConversation,
      satisfactionScore,
    };
  } catch (error) {
    console.error("Error getting analytics overview:", error);
    return null;
  }
}

// Get top topics from conversation summaries
export async function getTopTopics(
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<TopicData[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const dateFilter = startDate && endDate
      ? sql`AND created_at BETWEEN ${startDate} AND ${endDate}`
      : sql``;

    const result = await db.execute(sql`
      SELECT topic, COUNT(*) as count
      FROM (
        SELECT JSON_UNQUOTE(JSON_EXTRACT(topics_discussed, CONCAT('$[', idx, ']'))) as topic
        FROM conversation_summaries,
        JSON_TABLE(
          JSON_ARRAY(0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
          '$[*]' COLUMNS(idx INT PATH '$')
        ) as numbers
        WHERE JSON_LENGTH(topics_discussed) > idx
        AND 1=1 ${dateFilter}
      ) as all_topics
      WHERE topic IS NOT NULL
      GROUP BY topic
      ORDER BY count DESC
      LIMIT ${limit}
    `);

    return ((result as any)[0] || []).map((row: any) => ({
      topic: row.topic,
      count: row.count,
    }));
  } catch (error) {
    console.error("Error getting top topics:", error);
    return [];
  }
}

// Get sentiment distribution from conversation summaries
export async function getSentimentDistribution(
  startDate?: string,
  endDate?: string
): Promise<SentimentData[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const dateFilter = startDate && endDate
      ? sql`AND created_at BETWEEN ${startDate} AND ${endDate}`
      : sql``;

    const result = await db.execute(sql`
      SELECT 
        mood as sentiment,
        COUNT(*) as count
      FROM conversation_summaries
      WHERE mood IS NOT NULL
      AND 1=1 ${dateFilter}
      GROUP BY mood
      ORDER BY count DESC
    `);

    const rows = (result as any)[0] || [];
    const total = rows.reduce((sum: number, row: any) => sum + row.count, 0);

    return rows.map((row: any) => ({
      sentiment: row.sentiment,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 100) : 0,
    }));
  } catch (error) {
    console.error("Error getting sentiment distribution:", error);
    return [];
  }
}

// Get time series data for charts
export async function getTimeSeriesData(
  days: number = 30
): Promise<TimeSeriesData[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT conversation_id) as conversations,
        COUNT(*) as messages
      FROM chat_messages
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return ((result as any)[0] || []).map((row: any) => ({
      date: row.date,
      conversations: row.conversations,
      messages: row.messages,
    }));
  } catch (error) {
    console.error("Error getting time series data:", error);
    return [];
  }
}

// Get recent conversations
export async function getRecentConversations(
  limit: number = 10
): Promise<RecentConversation[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT 
        cs.id,
        cs.user_id as userId,
        u.name as userName,
        cs.message_count as messageCount,
        cs.last_message_at as lastMessageAt,
        cs.mood,
        cs.engagement_level as engagementLevel
      FROM conversation_summaries cs
      LEFT JOIN user u ON cs.user_id = u.id
      ORDER BY cs.last_message_at DESC
      LIMIT ${limit}
    `);

    return ((result as any)[0] || []).map((row: any) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName || "Unknown User",
      messageCount: row.messageCount,
      lastMessageAt: row.lastMessageAt,
      mood: row.mood,
      engagementLevel: row.engagementLevel,
    }));
  } catch (error) {
    console.error("Error getting recent conversations:", error);
    return [];
  }
}

// Get memory insights
export async function getMemoryInsights(): Promise<MemoryInsights | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total memories
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM user_memories
    `);
    const totalMemories = (totalResult as any)[0]?.[0]?.total || 0;

    // Average memories per user
    const avgResult = await db.execute(sql`
      SELECT AVG(mem_count) as avg_memories
      FROM (
        SELECT user_id, COUNT(*) as mem_count
        FROM user_memories
        GROUP BY user_id
      ) as user_counts
    `);
    const avgMemoriesPerUser = Math.round((avgResult as any)[0]?.[0]?.avg_memories || 0);

    // Top categories
    const categoriesResult = await db.execute(sql`
      SELECT memory_type as category, COUNT(*) as count
      FROM user_memories
      GROUP BY memory_type
      ORDER BY count DESC
      LIMIT 5
    `);
    const topCategories = ((categoriesResult as any)[0] || []).map((row: any) => ({
      category: row.category,
      count: row.count,
    }));

    return {
      totalMemories,
      avgMemoriesPerUser,
      topCategories,
    };
  } catch (error) {
    console.error("Error getting memory insights:", error);
    return null;
  }
}
