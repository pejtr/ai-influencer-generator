import { sql } from "drizzle-orm";
import { getDb } from "./db";

export interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  category: string;
  tags: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  authorId: number | null;
  authorName: string | null;
  viewCount: number;
  readTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get published blog articles with optional category filter
 */
export async function getBlogArticles(
  category?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ articles: BlogArticle[]; total: number }> {
  const db = await getDb();
  if (!db) return { articles: [], total: 0 };

  try {
    let result;
    let countResult;

    if (category) {
      result = await db.execute(sql`
        SELECT * FROM blogArticles 
        WHERE status = 'published' AND category = ${category}
        ORDER BY publishedAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM blogArticles 
        WHERE status = 'published' AND category = ${category}
      `);
    } else {
      result = await db.execute(sql`
        SELECT * FROM blogArticles 
        WHERE status = 'published'
        ORDER BY publishedAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM blogArticles 
        WHERE status = 'published'
      `);
    }

    const rows = (result as any)[0] as BlogArticle[];
    const countRows = (countResult as any)[0] as any[];

    return {
      articles: rows || [],
      total: countRows?.[0]?.total ?? 0,
    };
  } catch (error) {
    console.error("[Blog] Error fetching articles:", error);
    return { articles: [], total: 0 };
  }
}

/**
 * Get single article by slug
 */
export async function getBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(sql`
      SELECT * FROM blogArticles 
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `);

    const rows = (result as any)[0] as BlogArticle[];
    return rows?.[0] || null;
  } catch (error) {
    console.error("[Blog] Error fetching article by slug:", error);
    return null;
  }
}

/**
 * Increment article view count
 */
export async function incrementArticleView(articleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql`
      UPDATE blogArticles SET viewCount = viewCount + 1 WHERE id = ${articleId}
    `);
  } catch (error) {
    console.error("[Blog] Error incrementing view count:", error);
  }
}

/**
 * Get all unique categories
 */
export async function getBlogCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT DISTINCT category FROM blogArticles 
      WHERE status = 'published'
      ORDER BY category
    `);

    const rows = (result as any)[0] as any[];
    return rows?.map(r => r.category) || [];
  } catch (error) {
    console.error("[Blog] Error fetching categories:", error);
    return [];
  }
}

/**
 * Get recent articles for sidebar
 */
export async function getRecentBlogArticles(limit: number = 5): Promise<BlogArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT id, slug, title, featuredImageUrl, publishedAt, readTimeMinutes 
      FROM blogArticles 
      WHERE status = 'published'
      ORDER BY publishedAt DESC
      LIMIT ${limit}
    `);

    const rows = (result as any)[0] as BlogArticle[];
    return rows || [];
  } catch (error) {
    console.error("[Blog] Error fetching recent articles:", error);
    return [];
  }
}

/**
 * Search articles by title, content, or keywords
 */
export async function searchBlogArticles(query: string): Promise<BlogArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const searchTerm = `%${query}%`;
    const result = await db.execute(sql`
      SELECT * FROM blogArticles 
      WHERE status = 'published'
        AND (title LIKE ${searchTerm} OR content LIKE ${searchTerm} OR keywords LIKE ${searchTerm})
      ORDER BY publishedAt DESC
      LIMIT 20
    `);

    const rows = (result as any)[0] as BlogArticle[];
    return rows || [];
  } catch (error) {
    console.error("[Blog] Error searching articles:", error);
    return [];
  }
}


// ==================== COMMENTS ====================

export interface BlogComment {
  id: number;
  article_id: number;
  user_id: number;
  user_name: string;
  content: string;
  parent_id: number | null;
  status: string;
  created_at: number;
  updated_at: number | null;
}

/**
 * Get comments for an article
 */
export async function getArticleComments(articleId: number): Promise<BlogComment[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT * FROM blog_comments 
      WHERE article_id = ${articleId} AND status = 'approved'
      ORDER BY created_at DESC
    `);
    return ((result as any)[0] as BlogComment[]) || [];
  } catch (error) {
    console.error("[Blog] Error fetching comments:", error);
    return [];
  }
}

/**
 * Add a comment to an article
 */
export async function addComment(
  articleId: number,
  userId: number,
  userName: string,
  content: string,
  parentId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`
      INSERT INTO blog_comments (article_id, user_id, user_name, content, parent_id, status, created_at)
      VALUES (${articleId}, ${userId}, ${userName}, ${content}, ${parentId || null}, 'approved', ${Date.now()})
    `);
    return true;
  } catch (error) {
    console.error("[Blog] Error adding comment:", error);
    return false;
  }
}

// ==================== RATINGS ====================

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
}

/**
 * Get rating stats for an article
 */
export async function getArticleRatingStats(articleId: number): Promise<RatingStats> {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalRatings: 0 };

  try {
    const result = await db.execute(sql`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total 
      FROM blog_ratings 
      WHERE article_id = ${articleId}
    `);
    const rows = (result as any)[0] as any[];
    return {
      averageRating: rows?.[0]?.avg_rating ? Number(rows[0].avg_rating) : 0,
      totalRatings: rows?.[0]?.total ? Number(rows[0].total) : 0,
    };
  } catch (error) {
    console.error("[Blog] Error fetching rating stats:", error);
    return { averageRating: 0, totalRatings: 0 };
  }
}

/**
 * Get user's rating for an article
 */
export async function getUserRating(articleId: number, userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(sql`
      SELECT rating FROM blog_ratings 
      WHERE article_id = ${articleId} AND user_id = ${userId}
      LIMIT 1
    `);
    const rows = (result as any)[0] as any[];
    return rows?.[0]?.rating ? Number(rows[0].rating) : null;
  } catch (error) {
    console.error("[Blog] Error fetching user rating:", error);
    return null;
  }
}

/**
 * Submit or update a rating
 */
export async function submitRating(articleId: number, userId: number, rating: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`
      INSERT INTO blog_ratings (article_id, user_id, rating, created_at)
      VALUES (${articleId}, ${userId}, ${rating}, ${Date.now()})
      ON DUPLICATE KEY UPDATE rating = ${rating}
    `);
    return true;
  } catch (error) {
    console.error("[Blog] Error submitting rating:", error);
    return false;
  }
}
