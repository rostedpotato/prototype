'use client';

import { useState, useEffect } from 'react';

/**
 * Custom React hook for debouncing fast-changing values (e.g. search inputs).
 * Prevents rapid repeated re-filtering or spamming queries to the database.
 * 
 * @param value The value to debounce (e.g., search text)
 * @param delay Milliseconds to wait after the last change (default: 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
