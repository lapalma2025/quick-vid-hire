import { useRef, useCallback } from "react";

/**
 * Simple in-memory cache for search results.
 * Stores up to `maxSize` entries, evicting the oldest when full.
 */
export function useSearchCache<T>(maxSize = 50) {
  const cacheRef = useRef(new Map<string, T>());

  const get = useCallback((key: string): T | undefined => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key: string, value: T): void => {
    const cache = cacheRef.current;
    
    // Evict oldest entry if at capacity
    if (cache.size >= maxSize && !cache.has(key)) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, value);
  }, [maxSize]);

  const has = useCallback((key: string): boolean => {
    return cacheRef.current.has(key);
  }, []);

  const clear = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  return { get, set, has, clear };
}
