/**
 * In-memory LRU cache for transformed images.
 * Prevents redundant re-processing of the same image transformations.
 * Cache key is derived from: sourceUrl + width + height + format + quality
 */

interface CacheEntry {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  originalSize: number;
  savings: number;
  cachedAt: number;
  accessCount: number;
}

const MAX_CACHE_SIZE = 500; // Max entries
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export class ImageTransformCache {
  private cache = new Map<string, CacheEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Generate a deterministic cache key from transform parameters
   */
  static makeKey(params: {
    imageUrl: string;
    width?: number;
    height?: number;
    format: string;
    quality: number;
  }): string {
    return `${params.imageUrl}|${params.width ?? "auto"}|${params.height ?? "auto"}|${params.format}|${params.quality}`;
  }

  /**
   * Get a cached transform result, or null if not found/expired
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.cachedAt > MAX_CACHE_AGE_MS) {
      this.cache.delete(key);
      return null;
    }

    // Update access count and move to end (LRU)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Store a transform result in cache
   */
  set(key: string, result: Omit<CacheEntry, "cachedAt" | "accessCount">): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      ...result,
      cachedAt: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    maxEntries: number;
    hitRate: string;
    totalSavedBytes: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let totalSavedBytes = 0;
    let oldest: number | null = null;
    let newest: number | null = null;

    this.cache.forEach((entry) => {
      totalSavedBytes += entry.originalSize - entry.size;
      if (!oldest || entry.cachedAt < oldest) oldest = entry.cachedAt;
      if (!newest || entry.cachedAt > newest) newest = entry.cachedAt;
    });

    return {
      entries: this.cache.size,
      maxEntries: MAX_CACHE_SIZE,
      hitRate: "tracked per request",
      totalSavedBytes,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now - entry.cachedAt > MAX_CACHE_AGE_MS) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Don't prevent process exit
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const imageCache = new ImageTransformCache();
