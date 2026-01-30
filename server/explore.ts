import { sql } from "drizzle-orm";
import { db } from "./db";

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
  try {
    const {
      category,
      style,
      search,
      sortBy = "trending",
      limit = 20,
      offset = 0,
    } = filters;

    let whereClause = "WHERE ip.isPublic = TRUE";
    const params: any[] = [];

    if (category) {
      whereClause += ` AND ip.category = ?`;
      params.push(category);
    }

    if (style) {
      whereClause += ` AND ip.style = ?`;
      params.push(style);
    }

    if (search) {
      whereClause += ` AND (ip.name LIKE ? OR ip.bio LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderClause = "";
    switch (sortBy) {
      case "trending":
        // Trending = high views + likes in last 7 days (simplified: just use total counts)
        orderClause = "ORDER BY (ip.viewCount + ip.likeCount * 2) DESC";
        break;
      case "newest":
        orderClause = "ORDER BY ip.createdAt DESC";
        break;
      case "most_liked":
        orderClause = "ORDER BY ip.likeCount DESC";
        break;
      case "most_viewed":
        orderClause = "ORDER BY ip.viewCount DESC";
        break;
    }

    const query = `
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
        ${userId ? `, (SELECT COUNT(*) FROM characterLikes WHERE userId = ? AND personalityId = ip.id) as isLiked` : ""}
      FROM influencerPersonalities ip
      JOIN users u ON ip.userId = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM influencerPersonalities ip
      ${whereClause}
    `;

    const queryParams = userId ? [userId, ...params, limit, offset] : [...params, limit, offset];
    const countParams = params;

    const [characters, countResult] = await Promise.all([
      db.execute(sql.raw(query, queryParams)),
      db.execute(sql.raw(countQuery, countParams)),
    ]);

    return {
      characters: (characters.rows as any[]).map((row) => ({
        ...row,
        isLikedByUser: userId ? row.isLiked > 0 : false,
      })),
      total: (countResult.rows[0] as any).total,
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
  try {
    const query = `
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
        ${userId ? `, (SELECT COUNT(*) FROM characterLikes WHERE userId = ? AND personalityId = ip.id) as isLiked` : ""}
      FROM influencerPersonalities ip
      JOIN users u ON ip.userId = u.id
      WHERE ip.id = ? AND ip.isPublic = TRUE
    `;

    const params = userId ? [userId, characterId] : [characterId];
    const result = await db.execute(sql.raw(query, params));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as any;
    return {
      ...row,
      isLikedByUser: userId ? row.isLiked > 0 : false,
    };
  } catch (error) {
    console.error("[Explore] Error fetching character by ID:", error);
    return null;
  }
}

export async function incrementCharacterView(characterId: number): Promise<void> {
  try {
    await db.execute(
      sql.raw("UPDATE influencerPersonalities SET viewCount = viewCount + 1 WHERE id = ?", [
        characterId,
      ])
    );
  } catch (error) {
    console.error("[Explore] Error incrementing view count:", error);
  }
}

export async function toggleCharacterLike(
  userId: number,
  characterId: number
): Promise<{ liked: boolean }> {
  try {
    // Check if already liked
    const checkResult = await db.execute(
      sql.raw("SELECT id FROM characterLikes WHERE userId = ? AND personalityId = ?", [
        userId,
        characterId,
      ])
    );

    if (checkResult.rows.length > 0) {
      // Unlike
      await db.execute(
        sql.raw("DELETE FROM characterLikes WHERE userId = ? AND personalityId = ?", [
          userId,
          characterId,
        ])
      );
      await db.execute(
        sql.raw(
          "UPDATE influencerPersonalities SET likeCount = GREATEST(likeCount - 1, 0) WHERE id = ?",
          [characterId]
        )
      );
      return { liked: false };
    } else {
      // Like
      await db.execute(
        sql.raw("INSERT INTO characterLikes (userId, personalityId) VALUES (?, ?)", [
          userId,
          characterId,
        ])
      );
      await db.execute(
        sql.raw("UPDATE influencerPersonalities SET likeCount = likeCount + 1 WHERE id = ?", [
          characterId,
        ])
      );
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
  try {
    const {
      category,
      search,
      sortBy = "trending",
      limit = 20,
      offset = 0,
    } = filters;

    let whereClause = "WHERE pm.isPublic = TRUE";
    const params: any[] = [];

    if (category) {
      whereClause += ` AND pm.category = ?`;
      params.push(category);
    }

    if (search) {
      whereClause += ` AND (pm.title LIKE ? OR pm.description LIKE ? OR pm.tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    let orderClause = "";
    switch (sortBy) {
      case "trending":
        orderClause = "ORDER BY (pm.useCount + pm.likeCount * 2) DESC";
        break;
      case "newest":
        orderClause = "ORDER BY pm.createdAt DESC";
        break;
      case "most_liked":
        orderClause = "ORDER BY pm.likeCount DESC";
        break;
      case "most_viewed":
        orderClause = "ORDER BY pm.useCount DESC";
        break;
    }

    const query = `
      SELECT 
        pm.*,
        u.name as creatorName
        ${userId ? `, (SELECT COUNT(*) FROM presetLikes WHERE userId = ? AND presetId = pm.id) as isLiked` : ""}
      FROM presetMarketplace pm
      JOIN users u ON pm.userId = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM presetMarketplace pm
      ${whereClause}
    `;

    const queryParams = userId ? [userId, ...params, limit, offset] : [...params, limit, offset];
    const countParams = params;

    const [presets, countResult] = await Promise.all([
      db.execute(sql.raw(query, queryParams)),
      db.execute(sql.raw(countQuery, countParams)),
    ]);

    return {
      presets: (presets.rows as any[]).map((row) => ({
        ...row,
        isLikedByUser: userId ? row.isLiked > 0 : false,
      })),
      total: (countResult.rows[0] as any).total,
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
  try {
    const checkResult = await db.execute(
      sql.raw("SELECT id FROM presetLikes WHERE userId = ? AND presetId = ?", [userId, presetId])
    );

    if (checkResult.rows.length > 0) {
      // Unlike
      await db.execute(
        sql.raw("DELETE FROM presetLikes WHERE userId = ? AND presetId = ?", [userId, presetId])
      );
      await db.execute(
        sql.raw(
          "UPDATE presetMarketplace SET likeCount = GREATEST(likeCount - 1, 0) WHERE id = ?",
          [presetId]
        )
      );
      return { liked: false };
    } else {
      // Like
      await db.execute(
        sql.raw("INSERT INTO presetLikes (userId, presetId) VALUES (?, ?)", [userId, presetId])
      );
      await db.execute(
        sql.raw("UPDATE presetMarketplace SET likeCount = likeCount + 1 WHERE id = ?", [presetId])
      );
      return { liked: true };
    }
  } catch (error) {
    console.error("[Explore] Error toggling preset like:", error);
    throw error;
  }
}

export async function incrementPresetUse(presetId: number): Promise<void> {
  try {
    await db.execute(
      sql.raw("UPDATE presetMarketplace SET useCount = useCount + 1 WHERE id = ?", [presetId])
    );
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
  try {
    const checkResult = await db.execute(
      sql.raw("SELECT id FROM creatorFollows WHERE followerId = ? AND creatorId = ?", [
        followerId,
        creatorId,
      ])
    );

    if (checkResult.rows.length > 0) {
      // Unfollow
      await db.execute(
        sql.raw("DELETE FROM creatorFollows WHERE followerId = ? AND creatorId = ?", [
          followerId,
          creatorId,
        ])
      );
      return { following: false };
    } else {
      // Follow
      await db.execute(
        sql.raw("INSERT INTO creatorFollows (followerId, creatorId) VALUES (?, ?)", [
          followerId,
          creatorId,
        ])
      );
      return { following: true };
    }
  } catch (error) {
    console.error("[Explore] Error toggling creator follow:", error);
    throw error;
  }
}

export async function getCreatorFollowers(creatorId: number): Promise<number> {
  try {
    const result = await db.execute(
      sql.raw("SELECT COUNT(*) as count FROM creatorFollows WHERE creatorId = ?", [creatorId])
    );
    return (result.rows[0] as any).count;
  } catch (error) {
    console.error("[Explore] Error getting creator followers:", error);
    return 0;
  }
}

export async function isFollowingCreator(
  followerId: number,
  creatorId: number
): Promise<boolean> {
  try {
    const result = await db.execute(
      sql.raw("SELECT id FROM creatorFollows WHERE followerId = ? AND creatorId = ?", [
        followerId,
        creatorId,
      ])
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("[Explore] Error checking if following creator:", error);
    return false;
  }
}

// ============================================
// TRENDING & STATS
// ============================================

export async function getTrendingCharacters(limit: number = 10): Promise<PublicCharacter[]> {
  try {
    const query = `
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
      LIMIT ?
    `;

    const result = await db.execute(sql.raw(query, [limit]));
    return result.rows as any[];
  } catch (error) {
    console.error("[Explore] Error fetching trending characters:", error);
    return [];
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const result = await db.execute(
      sql.raw(
        "SELECT DISTINCT category FROM influencerPersonalities WHERE isPublic = TRUE AND category IS NOT NULL"
      )
    );
    return result.rows.map((row: any) => row.category);
  } catch (error) {
    console.error("[Explore] Error fetching categories:", error);
    return [];
  }
}

export async function getStyles(): Promise<string[]> {
  try {
    const result = await db.execute(
      sql.raw(
        "SELECT DISTINCT style FROM influencerPersonalities WHERE isPublic = TRUE AND style IS NOT NULL"
      )
    );
    return result.rows.map((row: any) => row.style);
  } catch (error) {
    console.error("[Explore] Error fetching styles:", error);
    return [];
  }
}
