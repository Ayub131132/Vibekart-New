import { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache: Record<string, CacheEntry<any>> = {};

export function useData<T>(key: string, endpoint: string | null = null, options: { 
  expiry?: number, 
  forceRefresh?: boolean 
} = {}) {
  const { expiry = DEFAULT_CACHE_EXPIRY, forceRefresh = false } = options;

  const getCachedData = useCallback((): T | null => {
    // 1. Check memory cache first (fastest)
    const memCache = memoryCache[key];
    if (memCache && (Date.now() - memCache.timestamp < expiry) && !forceRefresh) {
      return memCache.data;
    }

    // 2. Check localStorage
    try {
      const localCached = localStorage.getItem(`cache_${key}`);
      if (localCached) {
        const { data: value, timestamp }: CacheEntry<T> = JSON.parse(localCached);
        if ((Date.now() - timestamp < expiry) && !forceRefresh) {
          // Hydrate memory cache
          memoryCache[key] = { data: value, timestamp };
          return value;
        }
      }
    } catch (e) {
      console.warn('[CACHE] Failed to read from localStorage', e);
    }
    return null;
  }, [key, expiry, forceRefresh]);

  const [data, setData] = useState<T | null>(getCachedData);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!endpoint) return;

    // Check cache again for automatic effect triggers to avoid double-fetching
    if (!isManualRefresh && !forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
      const res = await fetch(url, {
        signal: controller.signal
      });
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const freshData = await res.json();
      
      // Update caches
      const entry: CacheEntry<T> = { data: freshData, timestamp: Date.now() };
      memoryCache[key] = entry;
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (e) {
        console.warn('[CACHE] Storage limit reached or blocked');
      }

      setData(freshData);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, [key, endpoint, forceRefresh, getCachedData]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  return { data, loading, error, refresh: () => fetchData(true) };
}
