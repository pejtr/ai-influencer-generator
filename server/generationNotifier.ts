/**
 * Generation completion notifier.
 * Sends push notifications to users when their image/video generation completes.
 * Uses the notifyOwner helper for owner notifications and
 * tracks events in pwaAnalytics for analytics.
 */

import { notifyOwner } from "./_core/notification";
import { trackPwaEvent } from "./db";

export interface GenerationResult {
  userId: number;
  type: "image" | "video" | "audio" | "batch";
  status: "completed" | "failed";
  generationId?: number;
  imageUrl?: string;
  error?: string;
  duration?: number; // ms
}

/**
 * Notify about generation completion.
 * - Tracks the event in pwaAnalytics
 * - Sends owner notification for important events
 */
export async function notifyGenerationComplete(result: GenerationResult): Promise<void> {
  try {
    // Track in analytics
    const eventType = result.status === "completed" ? "generation_completed" : "generation_failed";
    await trackPwaEvent({
      userId: result.userId,
      eventType: eventType as any,
      metadata: {
        type: result.type,
        generationId: result.generationId,
        duration: result.duration,
        hasImage: !!result.imageUrl,
        error: result.error,
      },
    });

    // For failures, also notify the owner so they can investigate
    if (result.status === "failed") {
      await notifyOwner({
        title: `Generation Failed: ${result.type}`,
        content: `User ${result.userId} experienced a ${result.type} generation failure. Error: ${result.error || "Unknown"}. Generation ID: ${result.generationId || "N/A"}.`,
      });
    }

    console.log(`[GenerationNotifier] ${eventType} for user ${result.userId}, type: ${result.type}`);
  } catch (error) {
    console.warn("[GenerationNotifier] Failed to send notification:", error);
  }
}

/**
 * Track generation start event
 */
export async function trackGenerationStart(userId: number, type: string): Promise<void> {
  try {
    await trackPwaEvent({
      userId,
      eventType: "generation_started" as any,
      metadata: { type, startedAt: Date.now() },
    });
  } catch (error) {
    console.warn("[GenerationNotifier] Failed to track generation start:", error);
  }
}
