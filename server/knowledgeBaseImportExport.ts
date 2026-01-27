// Knowledge Base Import/Export functionality
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import type { KnowledgeBaseItem, CreateKnowledgeInput } from "./knowledgeBase";

export interface ExportFormat {
  version: string;
  exportedAt: string;
  itemCount: number;
  items: KnowledgeBaseItem[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ImportPreview {
  totalItems: number;
  newItems: number;
  duplicates: number;
  invalid: number;
  items: Array<{
    title: string;
    status: "new" | "duplicate" | "invalid";
    reason?: string;
  }>;
}

// Export knowledge base as JSON
export async function exportAsJSON(): Promise<ExportFormat | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(sql`
      SELECT id, title, content, content_type as contentType, category, tags, priority, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM knowledge_base
      ORDER BY priority DESC, created_at DESC
    `);

    const items = (rows as any)[0]?.map((row: any) => ({
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

    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items,
    };
  } catch (error) {
    console.error("[KnowledgeBase] Error exporting as JSON:", error);
    return null;
  }
}

// Export knowledge base as CSV
export async function exportAsCSV(): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(sql`
      SELECT id, title, content, content_type as contentType, category, tags, priority, is_active as isActive
      FROM knowledge_base
      ORDER BY priority DESC, created_at DESC
    `);

    const items = (rows as any)[0] || [];

    // CSV header
    const header = "ID,Title,Content,Content Type,Category,Tags,Priority,Active\n";

    // CSV rows
    const csvRows = items.map((row: any) => {
      const tags = typeof row.tags === "string" ? row.tags : JSON.stringify(row.tags || []);
      return [
        row.id,
        escapeCSV(row.title),
        escapeCSV(row.content),
        row.contentType,
        row.category,
        escapeCSV(tags),
        row.priority,
        row.isActive ? "TRUE" : "FALSE",
      ].join(",");
    }).join("\n");

    return header + csvRows;
  } catch (error) {
    console.error("[KnowledgeBase] Error exporting as CSV:", error);
    return null;
  }
}

// Preview import from JSON
export async function previewImportJSON(data: ExportFormat): Promise<ImportPreview> {
  const db = await getDb();
  if (!db) {
    return {
      totalItems: 0,
      newItems: 0,
      duplicates: 0,
      invalid: 0,
      items: [],
    };
  }

  try {
    // Get existing titles for duplicate detection
    const existingRows = await db.execute(sql`SELECT title FROM knowledge_base`);
    const existingTitles = new Set(
      (existingRows as any)[0]?.map((row: any) => row.title.toLowerCase()) || []
    );

    const preview: ImportPreview = {
      totalItems: data.items.length,
      newItems: 0,
      duplicates: 0,
      invalid: 0,
      items: [],
    };

    for (const item of data.items) {
      // Validate item
      const validation = validateImportItem(item);
      if (!validation.valid) {
        preview.invalid++;
        preview.items.push({
          title: item.title || "(no title)",
          status: "invalid",
          reason: validation.errors.join(", "),
        });
        continue;
      }

      // Check for duplicates
      if (existingTitles.has(item.title.toLowerCase())) {
        preview.duplicates++;
        preview.items.push({
          title: item.title,
          status: "duplicate",
          reason: "Title already exists",
        });
      } else {
        preview.newItems++;
        preview.items.push({
          title: item.title,
          status: "new",
        });
      }
    }

    return preview;
  } catch (error) {
    console.error("[KnowledgeBase] Error previewing import:", error);
    return {
      totalItems: 0,
      newItems: 0,
      duplicates: 0,
      invalid: 0,
      items: [],
    };
  }
}

// Import from JSON
export async function importFromJSON(
  data: ExportFormat,
  options: {
    skipDuplicates?: boolean;
    overwriteDuplicates?: boolean;
  } = {}
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ["Database not available"],
    };
  }

  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get existing titles
    const existingRows = await db.execute(sql`SELECT id, title FROM knowledge_base`);
    const existingMap = new Map(
      (existingRows as any)[0]?.map((row: any) => [row.title.toLowerCase(), row.id]) || []
    );

    for (const item of data.items) {
      try {
        // Validate
        const validation = validateImportItem(item);
        if (!validation.valid) {
          result.errors.push(`${item.title}: ${validation.errors.join(", ")}`);
          result.skipped++;
          continue;
        }

        const existingId = existingMap.get(item.title.toLowerCase());

        if (existingId) {
          if (options.overwriteDuplicates) {
            // Update existing
            await db.execute(sql`
              UPDATE knowledge_base
              SET content = ${item.content},
                  content_type = ${item.contentType},
                  category = ${item.category},
                  tags = ${JSON.stringify(item.tags)},
                  priority = ${item.priority}
              WHERE id = ${existingId}
            `);
            result.imported++;
          } else {
            result.skipped++;
          }
        } else {
          // Insert new
          await db.execute(sql`
            INSERT INTO knowledge_base (title, content, content_type, category, tags, priority)
            VALUES (${item.title}, ${item.content}, ${item.contentType}, ${item.category}, ${JSON.stringify(item.tags)}, ${item.priority})
          `);
          result.imported++;
        }
      } catch (error) {
        result.errors.push(`${item.title}: ${error instanceof Error ? error.message : "Unknown error"}`);
        result.skipped++;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error("[KnowledgeBase] Error importing from JSON:", error);
    return {
      success: false,
      imported: result.imported,
      skipped: result.skipped,
      errors: [...result.errors, error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Import from CSV
export async function importFromCSV(
  csvContent: string,
  options: {
    skipDuplicates?: boolean;
    overwriteDuplicates?: boolean;
  } = {}
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ["Database not available"],
    };
  }

  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const lines = csvContent.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ["CSV file is empty or invalid"],
      };
    }

    // Skip header
    const dataLines = lines.slice(1);

    // Get existing titles
    const existingRows = await db.execute(sql`SELECT id, title FROM knowledge_base`);
    const existingMap = new Map(
      (existingRows as any)[0]?.map((row: any) => [row.title.toLowerCase(), row.id]) || []
    );

    for (const line of dataLines) {
      try {
        const fields = parseCSVLine(line);
        if (fields.length < 7) {
          result.errors.push(`Invalid CSV line: ${line.substring(0, 50)}...`);
          result.skipped++;
          continue;
        }

        const item = {
          title: fields[1],
          content: fields[2],
          contentType: fields[3] as any,
          category: fields[4],
          tags: JSON.parse(fields[5]),
          priority: parseInt(fields[6], 10),
        };

        // Validate
        const validation = validateImportItem(item);
        if (!validation.valid) {
          result.errors.push(`${item.title}: ${validation.errors.join(", ")}`);
          result.skipped++;
          continue;
        }

        const existingId = existingMap.get(item.title.toLowerCase());

        if (existingId) {
          if (options.overwriteDuplicates) {
            await db.execute(sql`
              UPDATE knowledge_base
              SET content = ${item.content},
                  content_type = ${item.contentType},
                  category = ${item.category},
                  tags = ${JSON.stringify(item.tags)},
                  priority = ${item.priority}
              WHERE id = ${existingId}
            `);
            result.imported++;
          } else {
            result.skipped++;
          }
        } else {
          await db.execute(sql`
            INSERT INTO knowledge_base (title, content, content_type, category, tags, priority)
            VALUES (${item.title}, ${item.content}, ${item.contentType}, ${item.category}, ${JSON.stringify(item.tags)}, ${item.priority})
          `);
          result.imported++;
        }
      } catch (error) {
        result.errors.push(`Line error: ${error instanceof Error ? error.message : "Unknown error"}`);
        result.skipped++;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error("[KnowledgeBase] Error importing from CSV:", error);
    return {
      success: false,
      imported: result.imported,
      skipped: result.skipped,
      errors: [...result.errors, error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Validation helper
function validateImportItem(item: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.title || item.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!item.content || item.content.trim() === "") {
    errors.push("Content is required");
  }

  const validTypes = ["platform_feature", "how_to", "best_practice", "faq", "industry", "tip"];
  if (!validTypes.includes(item.contentType)) {
    errors.push(`Invalid content type: ${item.contentType}`);
  }

  if (!item.category || item.category.trim() === "") {
    errors.push("Category is required");
  }

  if (!Array.isArray(item.tags)) {
    errors.push("Tags must be an array");
  }

  if (typeof item.priority !== "number" || item.priority < 1 || item.priority > 10) {
    errors.push("Priority must be a number between 1 and 10");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CSV helpers
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}
