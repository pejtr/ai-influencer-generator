/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API where available, with graceful fallback.
 */

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "selection" | "pull";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [30, 50, 30, 50, 30],
  selection: 5,
  pull: 15,
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function haptic(pattern: HapticPattern = "light"): void {
  if (!isHapticSupported()) return;

  try {
    const vibrationPattern = PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {
    // Silently fail - haptics are enhancement only
  }
}

/**
 * Trigger haptic feedback with custom duration in ms
 */
export function hapticCustom(durationMs: number): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(Math.min(durationMs, 200)); // Cap at 200ms
  } catch {
    // Silently fail
  }
}

/**
 * Progressive haptic feedback based on pull distance (0-1 progress)
 * Provides increasingly strong feedback as user pulls further
 */
export function hapticPull(progress: number): void {
  if (!isHapticSupported()) return;
  if (progress < 0.3) return; // Don't vibrate for small pulls

  try {
    // Scale vibration duration with progress (5ms to 25ms)
    const duration = Math.round(5 + progress * 20);
    navigator.vibrate(duration);
  } catch {
    // Silently fail
  }
}

/**
 * Haptic feedback for reaching the pull-to-refresh threshold
 */
export function hapticThreshold(): void {
  haptic("medium");
}

/**
 * Haptic feedback for swipe gestures
 */
export function hapticSwipe(): void {
  haptic("selection");
}

/**
 * Haptic feedback for successful action completion
 */
export function hapticSuccess(): void {
  haptic("success");
}

/**
 * Haptic feedback for error/failure
 */
export function hapticError(): void {
  haptic("error");
}
