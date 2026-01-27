// Knowledge Base CRUD operations
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  content: string;
  contentType: "platform_feature" | "how_to" | "best_practice" | "faq" | "industry" | "tip";
  category: string;
  tags: string[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKnowledgeInput {
  title: string;
  content: string;
  contentType: KnowledgeBaseItem["contentType"];
  category: string;
  tags: string[];
  priority: number;
}

export interface UpdateKnowledgeInput {
  title?: string;
  content?: string;
  contentType?: KnowledgeBaseItem["contentType"];
  category?: string;
  tags?: string[];
  priority?: number;
  isActive?: boolean;
}

// Get all knowledge items
export async function getAllKnowledgeItems(): Promise<KnowledgeBaseItem[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT id, title, content, content_type as contentType, category, tags, priority, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM knowledge_base
      ORDER BY priority DESC, created_at DESC
    `);

    return (rows as any)[0]?.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.contentType,
      category: row.category,
      tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [],
      priority: row.priority,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })) || [];
  } catch (error) {
    console.error("[KnowledgeBase] Error getting all items:", error);
    return [];
  }
}

// Get knowledge item by ID
export async function getKnowledgeItemById(id: number): Promise<KnowledgeBaseItem | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(sql`
      SELECT id, title, content, content_type as contentType, category, tags, priority, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM knowledge_base
      WHERE id = ${id}
    `);

    const row = (rows as any)[0]?.[0];
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.contentType,
      category: row.category,
      tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [],
      priority: row.priority,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  } catch (error) {
    console.error("[KnowledgeBase] Error getting item by ID:", error);
    return null;
  }
}

// Create new knowledge item
export async function createKnowledgeItem(input: CreateKnowledgeInput, userId?: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(sql`
      INSERT INTO knowledge_base (title, content, content_type, category, tags, priority)
      VALUES (${input.title}, ${input.content}, ${input.contentType}, ${input.category}, ${JSON.stringify(input.tags)}, ${input.priority})
    `);

    const insertId = (result as any)[0]?.insertId || null;

    // Record history
    if (insertId && userId) {
      const { recordHistory } = await import("./knowledgeBaseHistory");
      await recordHistory({
        knowledgeId: insertId,
        userId,
        action: "create",
        newData: input,
      });
    }

    return insertId;
  } catch (error) {
    console.error("[KnowledgeBase] Error creating item:", error);
    return null;
  }
}

// Update knowledge item
export async function updateKnowledgeItem(id: number, input: UpdateKnowledgeInput, userId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push("title = ?");
      values.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push("content = ?");
      values.push(input.content);
    }
    if (input.contentType !== undefined) {
      updates.push("content_type = ?");
      values.push(input.contentType);
    }
    if (input.category !== undefined) {
      updates.push("category = ?");
      values.push(input.category);
    }
    if (input.tags !== undefined) {
      updates.push("tags = ?");
      values.push(JSON.stringify(input.tags));
    }
    if (input.priority !== undefined) {
      updates.push("priority = ?");
      values.push(input.priority);
    }
    if (input.isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(input.isActive ? 1 : 0);
    }

    if (updates.length === 0) return true;

    // Get old data for history
    const oldData = userId ? await getKnowledgeItemById(id) : null;

    values.push(id);

    await db.execute(sql.raw(`
      UPDATE knowledge_base 
      SET ${updates.join(", ")}
      WHERE id = ?
    `.replace(/\?/g, () => {
      const val = values.shift();
      if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
      return String(val);
    })));

    // Record history
    if (userId && oldData) {
      const { recordHistory } = await import("./knowledgeBaseHistory");
      await recordHistory({
        knowledgeId: id,
        userId,
        action: "update",
        oldData,
        newData: input,
      });
    }

    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Error updating item:", error);
    return false;
  }
}

// Delete knowledge item
export async function deleteKnowledgeItem(id: number, userId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get old data for history
    const oldData = userId ? await getKnowledgeItemById(id) : null;

    await db.execute(sql`DELETE FROM knowledge_base WHERE id = ${id}`);

    // Record history
    if (userId && oldData) {
      const { recordHistory } = await import("./knowledgeBaseHistory");
      await recordHistory({
        knowledgeId: id,
        userId,
        action: "delete",
        oldData,
      });
    }

    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Error deleting item:", error);
    return false;
  }
}

// Search knowledge items
export async function searchKnowledgeItems(
  query: string,
  filters?: {
    contentType?: string;
    category?: string;
    isActive?: boolean;
  }
): Promise<KnowledgeBaseItem[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereConditions: string[] = [];
    
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      whereConditions.push(`(LOWER(title) LIKE '${searchTerm}' OR LOWER(content) LIKE '${searchTerm}' OR LOWER(tags) LIKE '${searchTerm}')`);
    }
    
    if (filters?.contentType) {
      whereConditions.push(`content_type = '${filters.contentType}'`);
    }
    
    if (filters?.category) {
      whereConditions.push(`category = '${filters.category}'`);
    }
    
    if (filters?.isActive !== undefined) {
      whereConditions.push(`is_active = ${filters.isActive ? 1 : 0}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const rows = await db.execute(sql.raw(`
      SELECT id, title, content, content_type as contentType, category, tags, priority, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM knowledge_base
      ${whereClause}
      ORDER BY priority DESC, created_at DESC
    `));

    return (rows as any)[0]?.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.contentType,
      category: row.category,
      tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [],
      priority: row.priority,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })) || [];
  } catch (error) {
    console.error("[KnowledgeBase] Error searching items:", error);
    return [];
  }
}

// Get unique categories
export async function getKnowledgeCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT DISTINCT category FROM knowledge_base ORDER BY category
    `);

    return (rows as any)[0]?.map((row: any) => row.category) || [];
  } catch (error) {
    console.error("[KnowledgeBase] Error getting categories:", error);
    return [];
  }
}

// Get stats
export async function getKnowledgeStats(): Promise<{
  total: number;
  active: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, byType: {}, byCategory: {} };

  try {
    const totalRows = await db.execute(sql`SELECT COUNT(*) as count FROM knowledge_base`);
    const activeRows = await db.execute(sql`SELECT COUNT(*) as count FROM knowledge_base WHERE is_active = TRUE`);
    const typeRows = await db.execute(sql`SELECT content_type, COUNT(*) as count FROM knowledge_base GROUP BY content_type`);
    const categoryRows = await db.execute(sql`SELECT category, COUNT(*) as count FROM knowledge_base GROUP BY category`);

    const byType: Record<string, number> = {};
    (typeRows as any)[0]?.forEach((row: any) => {
      byType[row.content_type] = row.count;
    });

    const byCategory: Record<string, number> = {};
    (categoryRows as any)[0]?.forEach((row: any) => {
      byCategory[row.category] = row.count;
    });

    return {
      total: (totalRows as any)[0]?.[0]?.count || 0,
      active: (activeRows as any)[0]?.[0]?.count || 0,
      byType,
      byCategory,
    };
  } catch (error) {
    console.error("[KnowledgeBase] Error getting stats:", error);
    return { total: 0, active: 0, byType: {}, byCategory: {} };
  }
}
