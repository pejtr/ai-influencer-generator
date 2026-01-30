import { sql } from "drizzle-orm";

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
  const result = await sql`
    SELECT * FROM ai_models
    WHERE userId = ${userId} AND isActive = TRUE
    ORDER BY updatedAt DESC
  `;
  return result.rows as AIModel[];
}

/**
 * Get a single AI model by ID
 */
export async function getModelById(modelId: number, userId: number): Promise<AIModel | null> {
  const result = await sql`
    SELECT * FROM ai_models
    WHERE id = ${modelId} AND userId = ${userId}
  `;
  return result.rows[0] as AIModel || null;
}

/**
 * Create a new AI model
 */
export async function createModel(input: CreateAIModelInput): Promise<AIModel> {
  const result = await sql`
    INSERT INTO ai_models (userId, name, description, previewImageUrl, characterSettings, isPublic)
    VALUES (${input.userId}, ${input.name}, ${input.description || null}, ${input.previewImageUrl || null}, ${JSON.stringify(input.characterSettings)}, ${input.isPublic || false})
  `;
  
  const insertId = (result as any).insertId;
  const newModel = await sql`SELECT * FROM ai_models WHERE id = ${insertId}`;
  return newModel.rows[0] as AIModel;
}

/**
 * Update an existing AI model
 */
export async function updateModel(modelId: number, userId: number, input: UpdateAIModelInput): Promise<AIModel | null> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.name !== undefined) {
    updates.push(`name = ?`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push(`description = ?`);
    values.push(input.description);
  }
  if (input.previewImageUrl !== undefined) {
    updates.push(`previewImageUrl = ?`);
    values.push(input.previewImageUrl);
  }
  if (input.characterSettings !== undefined) {
    updates.push(`characterSettings = ?`);
    values.push(JSON.stringify(input.characterSettings));
  }
  if (input.isPublic !== undefined) {
    updates.push(`isPublic = ?`);
    values.push(input.isPublic);
  }
  if (input.isActive !== undefined) {
    updates.push(`isActive = ?`);
    values.push(input.isActive);
  }
  
  if (updates.length === 0) {
    return getModelById(modelId, userId);
  }
  
  updates.push(`updatedAt = NOW()`);
  
  await sql.raw(`
    UPDATE ai_models
    SET ${updates.join(', ')}
    WHERE id = ? AND userId = ?
  `, [...values, modelId, userId]);
  
  return getModelById(modelId, userId);
}

/**
 * Delete an AI model (soft delete by setting isActive = false)
 */
export async function deleteModel(modelId: number, userId: number): Promise<boolean> {
  const result = await sql`
    UPDATE ai_models
    SET isActive = FALSE
    WHERE id = ${modelId} AND userId = ${userId}
  `;
  return (result as any).rowsAffected > 0;
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
  await sql`
    UPDATE ai_models
    SET timesUsed = timesUsed + 1
    WHERE id = ${modelId}
  `;
}

/**
 * Increment images generated count for a model
 */
export async function incrementModelImages(modelId: number, count: number = 1): Promise<void> {
  await sql`
    UPDATE ai_models
    SET imagesGenerated = imagesGenerated + ${count}
    WHERE id = ${modelId}
  `;
}

/**
 * Get public models for explore/marketplace
 */
export async function getPublicModels(limit: number = 50, offset: number = 0): Promise<AIModel[]> {
  const result = await sql`
    SELECT * FROM ai_models
    WHERE isPublic = TRUE AND isActive = TRUE
    ORDER BY timesUsed DESC, updatedAt DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return result.rows as AIModel[];
}

/**
 * Search public models by name or description
 */
export async function searchPublicModels(query: string, limit: number = 50): Promise<AIModel[]> {
  const searchTerm = `%${query}%`;
  const result = await sql`
    SELECT * FROM ai_models
    WHERE isPublic = TRUE AND isActive = TRUE
    AND (name LIKE ${searchTerm} OR description LIKE ${searchTerm})
    ORDER BY timesUsed DESC
    LIMIT ${limit}
  `;
  return result.rows as AIModel[];
}
