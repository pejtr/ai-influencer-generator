import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  workflowProjects,
  workflowPrompts,
} from "../drizzle/schema";

async function getDbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

// ── Workflow Projects ──────────────────────────────────────────────────────
export async function createWorkflowProject(data: {
  userId: number;
  name: string;
  modelId: string;
  genre?: string | null;
  speedRamp?: string | null;
  cinematicBible?: string | null;
}) {
  const db = await getDbOrThrow();
  const [result] = await db.insert(workflowProjects).values(data);
  return result;
}

export async function getWorkflowProjects(userId: number) {
  const db = await getDbOrThrow();
  return db
    .select()
    .from(workflowProjects)
    .where(eq(workflowProjects.userId, userId))
    .orderBy(desc(workflowProjects.createdAt))
    .limit(50);
}

export async function updateWorkflowProject(
  projectId: number,
  userId: number,
  data: Partial<{
    name: string;
    modelId: string;
    genre: string | null;
    speedRamp: string | null;
    cinematicBible: string | null;
  }>
) {
  const db = await getDbOrThrow();
  await db
    .update(workflowProjects)
    .set(data)
    .where(and(eq(workflowProjects.id, projectId), eq(workflowProjects.userId, userId)));
  return { success: true };
}

export async function deleteWorkflowProject(projectId: number, userId: number) {
  const db = await getDbOrThrow();
  await db
    .delete(workflowPrompts)
    .where(and(eq(workflowPrompts.projectId, projectId), eq(workflowPrompts.userId, userId)));
  await db
    .delete(workflowProjects)
    .where(and(eq(workflowProjects.id, projectId), eq(workflowProjects.userId, userId)));
  return { success: true };
}

// ── Workflow Prompts ───────────────────────────────────────────────────────
export async function saveWorkflowPrompt(data: {
  userId: number;
  projectId?: number | null;
  composition?: string | null;
  subject?: string | null;
  cameraMovement?: string | null;
  mood?: string | null;
  fullPrompt?: string | null;
  sceneNumber?: number;
}) {
  const db = await getDbOrThrow();
  const [result] = await db.insert(workflowPrompts).values({
    ...data,
    sceneNumber: data.sceneNumber ?? 1,
  });
  return result;
}

export async function getWorkflowPrompts(projectId: number, userId: number) {
  const db = await getDbOrThrow();
  return db
    .select()
    .from(workflowPrompts)
    .where(and(eq(workflowPrompts.projectId, projectId), eq(workflowPrompts.userId, userId)))
    .orderBy(workflowPrompts.sceneNumber);
}

export async function deleteWorkflowPrompt(promptId: number, userId: number) {
  const db = await getDbOrThrow();
  await db
    .delete(workflowPrompts)
    .where(and(eq(workflowPrompts.id, promptId), eq(workflowPrompts.userId, userId)));
  return { success: true };
}
