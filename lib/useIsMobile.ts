'use client';

import { useSyncExternalStore } from 'react';

/**
 * Detects "mobile" — coarse pointer (touch primary) OR viewport ≤ 768px.
 *
 * Live, not a one-shot — switching from desktop to a Chrome DevTools
 * mobile preview re-renders consumers automatically. SSR-safe (returns
 * `false` on the server so initial markup is the desktop layout — the
 * mobile filter activates after hydration).
 */

const QUERY = '(pointer: coarse), (max-width: 768px)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
