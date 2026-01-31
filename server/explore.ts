import { sql } from "drizzle-orm";
import { getDb } from "./db";

// ============================================
// PUBLIC CHARACTERS / PERSONALITIES
// ============================================

export interface PublicCharacter {
  id: number;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  personalityType: string;
  chatStyle: string;
  category: string | null;
  style: string | null;
  viewCount: number;
  likeCount: number;
  messageCount: number;
  creatorName: string;
  creatorId: number;
  isLikedByUser?: boolean;
  createdAt: Date;
}

export interface ExploreFilters {
  category?: string;
  style?: string;
  search?: string;
  sortBy?: "trending" | "newest" | "most_liked" | "most_viewed";
  limit?: number;
  offset?: number;
}

export async function getPublicCharacters(
  filters: ExploreFilters,
  userId?: number
): Promise<{ characters: PublicCharacter[]; total: number }> {
  const db = await getDb();
  if (!db) return { characters: [], total: 0 };
  
  try {
    const {
      category,
      style,
      search,
      sortBy = "trending",
      limit = 20,
      offset = 0,
    } = filters;

    // Use drizzle sql template for safe queries
    const result = await db.execute(sql`
      SELECT 
        ip.id,
        ip.name,
        ip.bio,
        ip.avatarUrl,
        ip.personalityType,
        ip.chatStyle,
        ip.category,
        ip.style,
        ip.viewCount,
        ip.likeCount,
        ip.messageCount,
        u.name as creatorName,
        u.id as creatorId,
        ip.createdAt
      FROM influencerPersonalities ip
      JOIN users u ON ip.userId = u.id
      WHERE ip.isPublic = TRUE
        ${category ? sql`AND ip.category = ${category}` : sql``}
        ${style ? sql`AND ip.style = ${style}` : sql``}
        ${search ? sql`AND (ip.name LIKE ${`%${search}%`} OR ip.bio LIKE ${`%${search}%`})` : sql``}
      ORDER BY 
        CASE 
          WHEN ${sortBy} = 'trending' THEN (ip.viewCount + ip.likeCount * 2)
          WHEN ${sortBy} = 'most_liked' THEN ip.likeCount
          WHEN ${sortBy} = 'most_viewed' THEN ip.viewCount
          ELSE 0
        END DESC,
        CASE WHEN ${sortBy} = 'newest' THEN ip.createdAt END DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM influencerPersonalities ip
      WHERE ip.isPublic = TRUE
        ${category ? sql`AND ip.category = ${category}` : sql``}
        ${style ? sql`AND ip.style = ${style}` : sql``}
        ${search ? sql`AND (ip.name LIKE ${`%${search}%`} OR ip.bio LIKE ${`%${search}%`})` : sql``}
    `);

    // MySQL execute returns [rows, fields] tuple
    const rows = (result as any)[0] as any[];
    const countRows = (countResult as any)[0] as any[];

    // If userId provided, check likes for each character
    let characters = rows || [];
    if (userId && characters.length > 0) {
      const likeResult = await db.execute(sql`
        SELECT personalityId FROM characterLikes WHERE userId = ${userId}
      `);
      const likeRows = (likeResult as any)[0] as any[];
      const likedIds = new Set(likeRows.map(r => r.personalityId));
      characters = characters.map(c => ({
        ...c,
        isLikedByUser: likedIds.has(c.id)
      }));
    }

    return {
      characters,
      total: countRows?.[0]?.total ?? 0,
    };
  } catch (error) {
    console.error("[Explore] Error fetching public characters:", error);
    return { characters: [], total: 0 };
  }
}

export async function getCharacterById(
  characterId: number,
  userId?: number
): Promise<PublicCharacter | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.execute(sql`
      SELECT 
        ip.id,
        ip.name,
        ip.bio,
        ip.avatarUrl,
        ip.personalityType,
        ip.chatStyle,
        ip.category,
        ip.style,
        ip.viewCount,
        ip.likeCount,
        ip.messageCount,
        u.name as creatorName,
        u.id as creatorId,
        ip.createdAt
      FROM influencerPersonalities ip
      JOIN users u ON ip.userId = u.id
      WHERE ip.id = ${characterId} AND ip.isPublic = TRUE
    `);

    const rows = (result as any)[0] as any[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    
    // Check if user liked this character
    let isLikedByUser = false;
    if (userId) {
      const likeResult = await db.execute(sql`
        SELECT id FROM characterLikes WHERE userId = ${userId} AND personalityId = ${characterId}
      `);
      const likeRows = (likeResult as any)[0] as any[];
      isLikedByUser = likeRows && likeRows.length > 0;
    }

    return {
      ...row,
      isLikedByUser,
    };
  } catch (error) {
    console.error("[Explore] Error fetching character by ID:", error);
    return null;
  }
}

export async function incrementCharacterView(characterId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.execute(sql`
      UPDATE influencerPersonalities SET viewCount = viewCount + 1 WHERE id = ${characterId}
    `);
  } catch (error) {
    console.error("[Explore] Error incrementing view count:", error);
  }
}

export async function toggleCharacterLike(
  userId: number,
  characterId: number
): Promise<{ liked: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Check if already liked
    const checkResult = await db.execute(sql`
      SELECT id FROM characterLikes WHERE userId = ${userId} AND personalityId = ${characterId}
    `);
    const checkRows = (checkResult as any)[0] as any[];

    if (checkRows && checkRows.length > 0) {
      // Unlike
      await db.execute(sql`
        DELETE FROM characterLikes WHERE userId = ${userId} AND personalityId = ${characterId}
      `);
      await db.execute(sql`
        UPDATE influencerPersonalities SET likeCount = GREATEST(likeCount - 1, 0) WHERE id = ${characterId}
      `);
      return { liked: false };
    } else {
      // Like
      await db.execute(sql`
        INSERT INTO characterLikes (userId, personalityId) VALUES (${userId}, ${characterId})
      `);
      await db.execute(sql`
        UPDATE influencerPersonalities SET likeCount = likeCount + 1 WHERE id = ${characterId}
      `);
      return { liked: true };
    }
  } catch (error) {
    console.error("[Explore] Error toggling character like:", error);
    throw error;
  }
}

// ============================================
// PRESET MARKETPLACE
// ============================================

export interface PresetMarketplace {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  promptData: any;
  category: string | null;
  tags: string | null;
  previewImageUrl: string | null;
  likeCount: number;
  useCount: number;
  creatorName: string;
  isLikedByUser?: boolean;
  createdAt: Date;
}

export async function getPublicPresets(
  filters: ExploreFilters,
  userId?: number
): Promise<{ presets: PresetMarketplace[]; total: number }> {
  const db = await getDb();
  if (!db) return { presets: [], total: 0 };
  
  try {
    const {
      category,
      search,
      sortBy = "trending",
      limit = 20,
      offset = 0,
    } = filters;

    const result = await db.execute(sql`
      SELECT 
        pm.*,
        u.name as creatorName
      FROM presetMarketplace pm
      JOIN users u ON pm.userId = u.id
      WHERE pm.isPublic = TRUE
        ${category ? sql`AND pm.category = ${category}` : sql``}
        ${search ? sql`AND (pm.title LIKE ${`%${search}%`} OR pm.description LIKE ${`%${search}%`} OR pm.tags LIKE ${`%${search}%`})` : sql``}
      ORDER BY 
        CASE 
          WHEN ${sortBy} = 'trending' THEN (pm.useCount + pm.likeCount * 2)
          WHEN ${sortBy} = 'most_liked' THEN pm.likeCount
          WHEN ${sortBy} = 'most_viewed' THEN pm.useCount
          ELSE 0
        END DESC,
        CASE WHEN ${sortBy} = 'newest' THEN pm.createdAt END DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM presetMarketplace pm
      WHERE pm.isPublic = TRUE
        ${category ? sql`AND pm.category = ${category}` : sql``}
        ${search ? sql`AND (pm.title LIKE ${`%${search}%`} OR pm.description LIKE ${`%${search}%`} OR pm.tags LIKE ${`%${search}%`})` : sql``}
    `);

    const rows = (result as any)[0] as any[];
    const countRows = (countResult as any)[0] as any[];

    // If userId provided, check likes for each preset
    let presets = rows || [];
    if (userId && presets.length > 0) {
      const likeResult = await db.execute(sql`
        SELECT presetId FROM presetLikes WHERE userId = ${userId}
      `);
      const likeRows = (likeResult as any)[0] as any[];
      const likedIds = new Set(likeRows.map(r => r.presetId));
      presets = presets.map(p => ({
        ...p,
        isLikedByUser: likedIds.has(p.id)
      }));
    }

    return {
      presets,
      total: countRows?.[0]?.total ?? 0,
    };
  } catch (error) {
    console.error("[Explore] Error fetching public presets:", error);
    return { presets: [], total: 0 };
  }
}

export async function togglePresetLike(
  userId: number,
  presetId: number
): Promise<{ liked: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const checkResult = await db.execute(sql`
      SELECT id FROM presetLikes WHERE userId = ${userId} AND presetId = ${presetId}
    `);
    const checkRows = (checkResult as any)[0] as any[];

    if (checkRows && checkRows.length > 0) {
      // Unlike
      await db.execute(sql`
        DELETE FROM presetLikes WHERE userId = ${userId} AND presetId = ${presetId}
      `);
      await db.execute(sql`
        UPDATE presetMarketplace SET likeCount = GREATEST(likeCount - 1, 0) WHERE id = ${presetId}
      `);
      return { liked: false };
    } else {
      // Like
      await db.execute(sql`
        INSERT INTO presetLikes (userId, presetId) VALUES (${userId}, ${presetId})
      `);
      await db.execute(sql`
        UPDATE presetMarketplace SET likeCount = likeCount + 1 WHERE id = ${presetId}
      `);
      return { liked: true };
    }
  } catch (error) {
    console.error("[Explore] Error toggling preset like:", error);
    throw error;
  }
}

export async function incrementPresetUse(presetId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.execute(sql`
      UPDATE presetMarketplace SET useCount = useCount + 1 WHERE id = ${presetId}
    `);
  } catch (error) {
    console.error("[Explore] Error incrementing preset use count:", error);
  }
}

// ============================================
// CREATOR FOLLOWS
// ============================================

export async function toggleCreatorFollow(
  followerId: number,
  creatorId: number
): Promise<{ following: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const checkResult = await db.execute(sql`
      SELECT id FROM creatorFollows WHERE followerId = ${followerId} AND creatorId = ${creatorId}
    `);
    const checkRows = (checkResult as any)[0] as any[];

    if (checkRows && checkRows.length > 0) {
      // Unfollow
      await db.execute(sql`
        DELETE FROM creatorFollows WHERE followerId = ${followerId} AND creatorId = ${creatorId}
      `);
      return { following: false };
    } else {
      // Follow
      await db.execute(sql`
        INSERT INTO creatorFollows (followerId, creatorId) VALUES (${followerId}, ${creatorId})
      `);
      return { following: true };
    }
  } catch (error) {
    console.error("[Explore] Error toggling creator follow:", error);
    throw error;
  }
}

export async function getCreatorFollowers(creatorId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM creatorFollows WHERE creatorId = ${creatorId}
    `);
    const rows = (result as any)[0] as any[];
    return rows?.[0]?.count ?? 0;
  } catch (error) {
    console.error("[Explore] Error getting creator followers:", error);
    return 0;
  }
}

export async function isFollowingCreator(
  followerId: number,
  creatorId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const result = await db.execute(sql`
      SELECT id FROM creatorFollows WHERE followerId = ${followerId} AND creatorId = ${creatorId}
    `);
    const rows = (result as any)[0] as any[];
    return rows && rows.length > 0;
  } catch (error) {
    console.error("[Explore] Error checking if following creator:", error);
    return false;
  }
}

// ============================================
// TRENDING & STATS
// ============================================

export async function getTrendingCharacters(limit: number = 10): Promise<PublicCharacter[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.execute(sql`
      SELECT 
        ip.id,
        ip.name,
        ip.bio,
        ip.avatarUrl,
        ip.personalityType,
        ip.chatStyle,
        ip.category,
        ip.style,
        ip.viewCount,
        ip.likeCount,
        ip.messageCount,
        u.name as creatorName,
        u.id as creatorId,
        ip.createdAt
      FROM influencerPersonalities ip
      JOIN users u ON ip.userId = u.id
      WHERE ip.isPublic = TRUE
      ORDER BY (ip.viewCount + ip.likeCount * 2) DESC
      LIMIT ${limit}
    `);
    const rows = (result as any)[0] as any[];
    return rows || [];
  } catch (error) {
    console.error("[Explore] Error fetching trending characters:", error);
    return [];
  }
}

export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT category FROM influencerPersonalities WHERE isPublic = TRUE AND category IS NOT NULL
    `);
    const rows = (result as any)[0] as any[];
    return rows?.map((row: any) => row.category) || [];
  } catch (error) {
    console.error("[Explore] Error fetching categories:", error);
    return [];
  }
}

export async function getStyles(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT style FROM influencerPersonalities WHERE isPublic = TRUE AND style IS NOT NULL
    `);
    const rows = (result as any)[0] as any[];
    return rows?.map((row: any) => row.style) || [];
  } catch (error) {
    console.error("[Explore] Error fetching styles:", error);
    return [];
  }
}
