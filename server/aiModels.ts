import { sql } from "drizzle-orm";
import { getDb } from "./db";

export interface AIModel {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  characterSettings: any; // JSON object with all character builder settings
  timesUsed: number;
  imagesGenerated: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIModelInput {
  userId: number;
  name: string;
  description?: string;
  previewImageUrl?: string;
  characterSettings: any;
  isPublic?: boolean;
}

export interface UpdateAIModelInput {
  name?: string;
  description?: string;
  previewImageUrl?: string;
  characterSettings?: any;
  isPublic?: boolean;
  isActive?: boolean;
}

/**
 * Get all AI models for a user
 */
export async function getUserModels(userId: number): Promise<AIModel[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM ai_models
    WHERE userId = ${userId} AND isActive = TRUE
    ORDER BY updatedAt DESC
  `);
  const rows = (result as any)[0] as any[];
  return rows || [];
}

/**
 * Get a single AI model by ID
 */
export async function getModelById(modelId: number, userId: number): Promise<AIModel | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM ai_models
    WHERE id = ${modelId} AND userId = ${userId}
  `);
  const rows = (result as any)[0] as any[];
  return rows?.[0] || null;
}

/**
 * Create a new AI model
 */
export async function createModel(input: CreateAIModelInput): Promise<AIModel> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO ai_models (userId, name, description, previewImageUrl, characterSettings, isPublic)
    VALUES (${input.userId}, ${input.name}, ${input.description || null}, ${input.previewImageUrl || null}, ${JSON.stringify(input.characterSettings)}, ${input.isPublic || false})
  `);
  
  const insertId = (result as any)[0]?.insertId;
  const newModelResult = await db.execute(sql`SELECT * FROM ai_models WHERE id = ${insertId}`);
  const newModelRows = (newModelResult as any)[0] as any[];
  return newModelRows[0];
}

/**
 * Update an existing AI model
 */
export async function updateModel(modelId: number, userId: number, input: UpdateAIModelInput): Promise<AIModel | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Build dynamic update
  const setClauses: string[] = [];
  
  if (input.name !== undefined) {
    setClauses.push(`name = '${input.name.replace(/'/g, "''")}'`);
  }
  if (input.description !== undefined) {
    setClauses.push(`description = '${(input.description || '').replace(/'/g, "''")}'`);
  }
  if (input.previewImageUrl !== undefined) {
    setClauses.push(`previewImageUrl = '${(input.previewImageUrl || '').replace(/'/g, "''")}'`);
  }
  if (input.characterSettings !== undefined) {
    setClauses.push(`characterSettings = '${JSON.stringify(input.characterSettings).replace(/'/g, "''")}'`);
  }
  if (input.isPublic !== undefined) {
    setClauses.push(`isPublic = ${input.isPublic}`);
  }
  if (input.isActive !== undefined) {
    setClauses.push(`isActive = ${input.isActive}`);
  }
  
  if (setClauses.length === 0) {
    return getModelById(modelId, userId);
  }
  
  setClauses.push(`updatedAt = NOW()`);
  
  await db.execute(sql.raw(`
    UPDATE ai_models
    SET ${setClauses.join(', ')}
    WHERE id = ${modelId} AND userId = ${userId}
  `));
  
  return getModelById(modelId, userId);
}

/**
 * Delete an AI model (soft delete by setting isActive = false)
 */
export async function deleteModel(modelId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.execute(sql`
    UPDATE ai_models
    SET isActive = FALSE
    WHERE id = ${modelId} AND userId = ${userId}
  `);
  return (result as any)[0]?.affectedRows > 0;
}

/**
 * Duplicate an AI model
 */
export async function duplicateModel(modelId: number, userId: number): Promise<AIModel | null> {
  const original = await getModelById(modelId, userId);
  if (!original) return null;
  
  return createModel({
    userId,
    name: `${original.name} (Copy)`,
    description: original.description || undefined,
    previewImageUrl: original.previewImageUrl || undefined,
    characterSettings: original.characterSettings,
    isPublic: false, // Duplicates are private by default
  });
}

/**
 * Increment usage stats for a model
 */
export async function incrementModelUsage(modelId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.execute(sql`
    UPDATE ai_models
    SET timesUsed = timesUsed + 1
    WHERE id = ${modelId}
  `);
}

/**
 * Increment images generated count for a model
 */
export async function incrementModelImages(modelId: number, count: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.execute(sql`
    UPDATE ai_models
    SET imagesGenerated = imagesGenerated + ${count}
    WHERE id = ${modelId}
  `);
}

/**
 * Get public models for explore/marketplace
 */
export async function getPublicModels(limit: number = 50, offset: number = 0): Promise<AIModel[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM ai_models
    WHERE isPublic = TRUE AND isActive = TRUE
    ORDER BY timesUsed DESC, updatedAt DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  const rows = (result as any)[0] as any[];
  return rows || [];
}

/**
 * Search public models by name or description
 */
export async function searchPublicModels(query: string, limit: number = 50): Promise<AIModel[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchTerm = `%${query}%`;
  const result = await db.execute(sql`
    SELECT * FROM ai_models
    WHERE isPublic = TRUE AND isActive = TRUE
    AND (name LIKE ${searchTerm} OR description LIKE ${searchTerm})
    ORDER BY timesUsed DESC
    LIMIT ${limit}
  `);
  const rows = (result as any)[0] as any[];
  return rows || [];
}
