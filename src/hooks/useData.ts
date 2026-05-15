import { useState, useEffect, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const memoryCache: Record<string, { data: any, timestamp: number }> = {};

export function useData<T>(key: string, endpoint: string | null = null) {
  const [data, setData] = useState<T | null>(() => {
    if (memoryCache[key] && (Date.now() - memoryCache[key].timestamp < CACHE_EXPIRY)) {
      return memoryCache[key].data;
    }
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { value, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return value;
        }
      }
    } catch (e) {
      console.error('Cache parsing error:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
          signal: abortControllerRef.current?.signal
        });
        
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        
        const freshData = await res.json();
        
        setData(freshData);
        memoryCache[key] = { data: freshData, timestamp: Date.now() };
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          value: freshData,
          timestamp: Date.now()
        }));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Fetch failed', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key, endpoint]);

  return { data, loading, error };
}
