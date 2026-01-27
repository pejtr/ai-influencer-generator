// Knowledge Base Version History functionality
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import type { KnowledgeBaseItem } from "./knowledgeBase";

export interface HistoryEntry {
  id: number;
  knowledgeId: number;
  userId: number;
  action: "create" | "update" | "delete" | "restore";
  oldTitle?: string;
  newTitle?: string;
  oldContent?: string;
  newContent?: string;
  oldContentType?: string;
  newContentType?: string;
  oldCategory?: string;
  newCategory?: string;
  oldTags?: string[];
  newTags?: string[];
  oldPriority?: number;
  newPriority?: number;
  oldIsActive?: boolean;
  newIsActive?: boolean;
  createdAt: Date;
  userName?: string; // Joined from users table
}

export interface HistoryDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

// Record a history entry
export async function recordHistory(params: {
  knowledgeId: number;
  userId: number;
  action: "create" | "update" | "delete" | "restore";
  oldData?: Partial<KnowledgeBaseItem>;
  newData?: Partial<KnowledgeBaseItem>;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`
      INSERT INTO knowledge_base_history (
        knowledge_id, user_id, action,
        old_title, new_title,
        old_content, new_content,
        old_content_type, new_content_type,
        old_category, new_category,
        old_tags, new_tags,
        old_priority, new_priority,
        old_is_active, new_is_active
      ) VALUES (
        ${params.knowledgeId},
        ${params.userId},
        ${params.action},
        ${params.oldData?.title || null},
        ${params.newData?.title || null},
        ${params.oldData?.content || null},
        ${params.newData?.content || null},
        ${params.oldData?.contentType || null},
        ${params.newData?.contentType || null},
        ${params.oldData?.category || null},
        ${params.newData?.category || null},
        ${params.oldData?.tags ? JSON.stringify(params.oldData.tags) : null},
        ${params.newData?.tags ? JSON.stringify(params.newData.tags) : null},
        ${params.oldData?.priority || null},
        ${params.newData?.priority || null},
        ${params.oldData?.isActive !== undefined ? params.oldData.isActive : null},
        ${params.newData?.isActive !== undefined ? params.newData.isActive : null}
      )
    `);

    console.log(`[KnowledgeHistory] Recorded ${params.action} for knowledge ID ${params.knowledgeId} by user ${params.userId}`);
    return true;
  } catch (error) {
    console.error("[KnowledgeHistory] Error recording history:", error);
    return false;
  }
}

// Get history for a specific knowledge item
export async function getKnowledgeHistory(knowledgeId: number): Promise<HistoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT 
        h.*,
        u.name as userName
      FROM knowledge_base_history h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.knowledge_id = ${knowledgeId}
      ORDER BY h.created_at DESC
    `);

    return ((rows as any)[0] || []).map((row: any) => ({
      id: row.id,
      knowledgeId: row.knowledge_id,
      userId: row.user_id,
      action: row.action,
      oldTitle: row.old_title,
      newTitle: row.new_title,
      oldContent: row.old_content,
      newContent: row.new_content,
      oldContentType: row.old_content_type,
      newContentType: row.new_content_type,
      oldCategory: row.old_category,
      newCategory: row.new_category,
      oldTags: row.old_tags ? JSON.parse(row.old_tags) : undefined,
      newTags: row.new_tags ? JSON.parse(row.new_tags) : undefined,
      oldPriority: row.old_priority,
      newPriority: row.new_priority,
      oldIsActive: row.old_is_active,
      newIsActive: row.new_is_active,
      createdAt: new Date(row.created_at),
      userName: row.userName,
    }));
  } catch (error) {
    console.error("[KnowledgeHistory] Error getting history:", error);
    return [];
  }
}

// Get all recent history (for admin dashboard)
export async function getRecentHistory(limit: number = 50): Promise<HistoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT 
        h.*,
        u.name as userName,
        k.title as currentTitle
      FROM knowledge_base_history h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN knowledge_base k ON h.knowledge_id = k.id
      ORDER BY h.created_at DESC
      LIMIT ${limit}
    `);

    return ((rows as any)[0] || []).map((row: any) => ({
      id: row.id,
      knowledgeId: row.knowledge_id,
      userId: row.user_id,
      action: row.action,
      oldTitle: row.old_title,
      newTitle: row.new_title || row.currentTitle,
      oldContent: row.old_content,
      newContent: row.new_content,
      oldContentType: row.old_content_type,
      newContentType: row.new_content_type,
      oldCategory: row.old_category,
      newCategory: row.new_category,
      oldTags: row.old_tags ? JSON.parse(row.old_tags) : undefined,
      newTags: row.new_tags ? JSON.parse(row.new_tags) : undefined,
      oldPriority: row.old_priority,
      newPriority: row.new_priority,
      oldIsActive: row.old_is_active,
      newIsActive: row.new_is_active,
      createdAt: new Date(row.created_at),
      userName: row.userName,
    }));
  } catch (error) {
    console.error("[KnowledgeHistory] Error getting recent history:", error);
    return [];
  }
}

// Calculate diff between old and new data
export function calculateDiff(entry: HistoryEntry): HistoryDiff[] {
  const diffs: HistoryDiff[] = [];

  if (entry.oldTitle !== entry.newTitle && (entry.oldTitle || entry.newTitle)) {
    diffs.push({
      field: "Title",
      oldValue: entry.oldTitle || "(none)",
      newValue: entry.newTitle || "(none)",
    });
  }

  if (entry.oldContent !== entry.newContent && (entry.oldContent || entry.newContent)) {
    diffs.push({
      field: "Content",
      oldValue: entry.oldContent ? truncate(entry.oldContent, 100) : "(none)",
      newValue: entry.newContent ? truncate(entry.newContent, 100) : "(none)",
    });
  }

  if (entry.oldContentType !== entry.newContentType && (entry.oldContentType || entry.newContentType)) {
    diffs.push({
      field: "Content Type",
      oldValue: entry.oldContentType || "(none)",
      newValue: entry.newContentType || "(none)",
    });
  }

  if (entry.oldCategory !== entry.newCategory && (entry.oldCategory || entry.newCategory)) {
    diffs.push({
      field: "Category",
      oldValue: entry.oldCategory || "(none)",
      newValue: entry.newCategory || "(none)",
    });
  }

  if (JSON.stringify(entry.oldTags) !== JSON.stringify(entry.newTags) && (entry.oldTags || entry.newTags)) {
    diffs.push({
      field: "Tags",
      oldValue: entry.oldTags?.join(", ") || "(none)",
      newValue: entry.newTags?.join(", ") || "(none)",
    });
  }

  if (entry.oldPriority !== entry.newPriority && (entry.oldPriority !== undefined || entry.newPriority !== undefined)) {
    diffs.push({
      field: "Priority",
      oldValue: entry.oldPriority !== undefined ? entry.oldPriority : "(none)",
      newValue: entry.newPriority !== undefined ? entry.newPriority : "(none)",
    });
  }

  if (entry.oldIsActive !== entry.newIsActive && (entry.oldIsActive !== undefined || entry.newIsActive !== undefined)) {
    diffs.push({
      field: "Active Status",
      oldValue: entry.oldIsActive !== undefined ? (entry.oldIsActive ? "Active" : "Inactive") : "(none)",
      newValue: entry.newIsActive !== undefined ? (entry.newIsActive ? "Active" : "Inactive") : "(none)",
    });
  }

  return diffs;
}

// Restore a previous version
export async function restoreVersion(params: {
  knowledgeId: number;
  historyId: number;
  userId: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get the history entry to restore
    const historyRows = await db.execute(sql`
      SELECT * FROM knowledge_base_history
      WHERE id = ${params.historyId} AND knowledge_id = ${params.knowledgeId}
    `);

    const historyEntry = (historyRows as any)[0]?.[0];
    if (!historyEntry) {
      console.error("[KnowledgeHistory] History entry not found");
      return false;
    }

    // Get current data for history record
    const currentRows = await db.execute(sql`
      SELECT * FROM knowledge_base WHERE id = ${params.knowledgeId}
    `);

    const currentData = (currentRows as any)[0]?.[0];
    if (!currentData) {
      console.error("[KnowledgeHistory] Current knowledge item not found");
      return false;
    }

    // Restore to old values from history
    await db.execute(sql`
      UPDATE knowledge_base
      SET 
        title = ${historyEntry.old_title || currentData.title},
        content = ${historyEntry.old_content || currentData.content},
        content_type = ${historyEntry.old_content_type || currentData.content_type},
        category = ${historyEntry.old_category || currentData.category},
        tags = ${historyEntry.old_tags || currentData.tags},
        priority = ${historyEntry.old_priority !== null ? historyEntry.old_priority : currentData.priority},
        is_active = ${historyEntry.old_is_active !== null ? historyEntry.old_is_active : currentData.is_active}
      WHERE id = ${params.knowledgeId}
    `);

    // Record the restore action
    await recordHistory({
      knowledgeId: params.knowledgeId,
      userId: params.userId,
      action: "restore",
      oldData: {
        title: currentData.title,
        content: currentData.content,
        contentType: currentData.content_type,
        category: currentData.category,
        tags: typeof currentData.tags === "string" ? JSON.parse(currentData.tags) : currentData.tags,
        priority: currentData.priority,
        isActive: Boolean(currentData.is_active),
      },
      newData: {
        title: historyEntry.old_title || currentData.title,
        content: historyEntry.old_content || currentData.content,
        contentType: historyEntry.old_content_type || currentData.content_type,
        category: historyEntry.old_category || currentData.category,
        tags: historyEntry.old_tags ? JSON.parse(historyEntry.old_tags) : (typeof currentData.tags === "string" ? JSON.parse(currentData.tags) : currentData.tags),
        priority: historyEntry.old_priority !== null ? historyEntry.old_priority : currentData.priority,
        isActive: historyEntry.old_is_active !== null ? Boolean(historyEntry.old_is_active) : Boolean(currentData.is_active),
      },
    });

    console.log(`[KnowledgeHistory] Restored knowledge ID ${params.knowledgeId} to history ID ${params.historyId}`);
    return true;
  } catch (error) {
    console.error("[KnowledgeHistory] Error restoring version:", error);
    return false;
  }
}

// Helper function
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
