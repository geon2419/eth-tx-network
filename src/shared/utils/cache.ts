type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export type CacheOptions = {
  /** Time-to-live in milliseconds. Default: Infinity (no expiration) */
  ttl?: number;
  /** Whether to normalize keys (extract pathname). Default: true */
  normalize?: boolean;
};

/**
 * Generic data cache with TTL and key normalization support.
 * Designed for caching fetch results, parsed data, and computed values.
 *
 * @example
 * ```typescript
 * const cache = new DataCache<Promise<Data>>({ ttl: 30 * 60 * 1000 });
 *
 * // Store promise
 * const promise = fetchData(url);
 * cache.set(url, promise);
 *
 * // Retrieve with type hint
 * const cached = cache.get<Promise<Data>>(url);
 * if (cached) return cached;
 * ```
 */
export class DataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private options: CacheOptions = {}) {}

  /**
   * Normalizes cache key to ensure consistent lookups.
   * Extracts pathname from URLs to treat relative and absolute paths as identical.
   *
   * @example
   * ```typescript
   * normalizeKey("/data/file.csv") // "/data/file.csv"
   * normalizeKey("http://localhost:3000/data/file.csv") // "/data/file.csv"
   * ```
   */
  private normalizeKey(key: string): string {
    if (!this.options.normalize) return key;

    try {
      const url = new URL(key, "http://dummy");
      return url.pathname;
    } catch {
      return key;
    }
  }

  /**
   * Retrieves cached value if present and not expired.
   * Automatically deletes expired entries.
   *
   * @param key - Cache key (will be normalized if normalize option is true)
   * @returns Cached value with type hint, or undefined if not found/expired
   */
  get<V = T>(key: string): V | undefined {
    const normalized = this.normalizeKey(key);
    const entry = this.cache.get(normalized);

    if (!entry) return undefined;

    const ttl = this.options.ttl ?? Infinity;
    const age = Date.now() - entry.timestamp;

    if (age > ttl) {
      this.cache.delete(normalized);
      return undefined;
    }

    return entry.data as unknown as V;
  }

  /**
   * Stores value in cache with current timestamp.
   *
   * @param key - Cache key (will be normalized if normalize option is true)
   * @param data - Value to cache
   */
  set(key: string, data: T): void {
    const normalized = this.normalizeKey(key);
    this.cache.set(normalized, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Deletes a specific cache entry.
   *
   * @param key - Cache key to delete
   * @returns true if entry was deleted, false if not found
   */
  delete(key: string): boolean {
    const normalized = this.normalizeKey(key);
    return this.cache.delete(normalized);
  }

  /**
   * Clears all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns cache statistics for debugging.
   *
   * @returns Object with cache size and list of keys
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Global cache instance for dataset fetching and parsing across all features.
 * Stores both Promises (for async operations) and sync data (for Worker results).
 * Maintains compatibility with React Suspense pattern.
 *
 * @example
 * ```typescript
 * // Store fetch promise
 * const promise = fetchAndParse(url);
 * datasetCache.set(url, promise);
 *
 * // Retrieve with type hint
 * const cached = datasetCache.get<Promise<Transaction[]>>(url);
 * if (cached) return cached;
 *
 * // Store sync data (Worker result)
 * datasetCache.set(url, parseResult);
 * const result = datasetCache.get<ParseResult>(url);
 *
 * // Clear failed fetch from cache
 * try {
 *   await promise;
 * } catch (error) {
 *   datasetCache.delete(url); // Don't cache errors
 *   throw error;
 * }
 * ```
 */
export const datasetCache = new DataCache<unknown>({ ttl: Infinity });
