'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { log } from './logger';

/**
 * Client-only state — localStorage-backed and reactive across components.
 *
 * Everything in this module ultimately touches `window.localStorage` and
 * is invalid to call on the server, so it sits behind a 'use client'
 * boundary. Pure helpers (baseCount, formatPlayCount, dailyIndex, …)
 * live in `./userState.ts` so server components can use them.
 *
 * Reactivity: every mutation fires a custom 'plixfy:state' event; hooks
 * subscribe to that plus the native 'storage' event for cross-tab sync.
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state';
const MAX_RECENT = 12;

const KEYS = {
  recent: `${PREFIX}recent`,
  favorites: `${PREFIX}favorites`,
  playCounts: `${PREFIX}counts`,
  streak: `${PREFIX}streak`,
} as const;

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

/**
 * Snapshot cache keyed by storage key. useSyncExternalStore requires
 * getSnapshot to return the SAME reference until the underlying value
 * changes — otherwise React loops infinitely re-rendering. We achieve
 * referential stability by caching the parsed value alongside the
 * source string; a new parse only happens when the string differs.
 */
type CacheEntry = { raw: string | null; parsed: unknown };
const cache = new Map<string, CacheEntry>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const hit = cache.get(key);
    if (hit && hit.raw === raw) return hit.parsed as T;
    const parsed = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, { raw, parsed });
    return parsed;
  } catch (err) {
    log.warn('userState read failed', { key, err });
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emit();
  } catch (err) {
    log.warn('userState write failed', { key, err });
  }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/* ─────────────────────────────── Recently played ──────────────────────────── */

export interface RecentEntry {
  slug: string;
  at: number;
}

export function getRecent(): RecentEntry[] {
  return read<RecentEntry[]>(KEYS.recent, []);
}

export function recordPlay(slug: string): void {
  if (!slug) return;
  const now = Date.now();
  const current = getRecent().filter((r) => r.slug !== slug);
  current.unshift({ slug, at: now });
  write(KEYS.recent, current.slice(0, MAX_RECENT));
  incrementPlayCount(slug);
}

const EMPTY_RECENT: RecentEntry[] = [];

export function useRecent(): RecentEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => read<RecentEntry[]>(KEYS.recent, EMPTY_RECENT),
    () => EMPTY_RECENT,
  );
}

/* ─────────────────────────────── Favorites ────────────────────────────────── */

export function getFavorites(): string[] {
  return read<string[]>(KEYS.favorites, []);
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const current = getFavorites();
  const idx = current.indexOf(slug);
  if (idx === -1) current.push(slug);
  else current.splice(idx, 1);
  write(KEYS.favorites, current);
  return idx === -1;
}

const EMPTY_FAVS: string[] = [];

export function useFavorites(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => read<string[]>(KEYS.favorites, EMPTY_FAVS),
    () => EMPTY_FAVS,
  );
}

export function useIsFavorite(slug: string): [boolean, () => void] {
  const favs = useFavorites();
  const fav = favs.includes(slug);
  const toggle = useCallback(() => toggleFavorite(slug), [slug]);
  return [fav, toggle];
}

/* ─────────────────────────────── Play counts (local layer) ────────────────── */

export function getLocalPlayCount(slug: string): number {
  const counts = read<Record<string, number>>(KEYS.playCounts, {});
  return counts[slug] ?? 0;
}

function incrementPlayCount(slug: string): void {
  const counts = read<Record<string, number>>(KEYS.playCounts, {});
  counts[slug] = (counts[slug] ?? 0) + 1;
  write(KEYS.playCounts, counts);
}

/* ─────────────────────────────── Streak ───────────────────────────────────── */

export interface StreakState {
  count: number;
  lastVisitDate: string; // YYYY-MM-DD in local time
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterday(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return isoDate(dt);
}

export function recordVisit(): StreakState {
  const today = isoDate(new Date());
  const prev = read<StreakState | null>(KEYS.streak, null);
  let next: StreakState;
  if (!prev) {
    next = { count: 1, lastVisitDate: today };
  } else if (prev.lastVisitDate === today) {
    return prev;
  } else if (prev.lastVisitDate === yesterday(today)) {
    next = { count: prev.count + 1, lastVisitDate: today };
  } else {
    next = { count: 1, lastVisitDate: today };
  }
  write(KEYS.streak, next);
  return next;
}

const EMPTY_STREAK: StreakState = { count: 0, lastVisitDate: '' };

export function useStreak(): StreakState {
  return useSyncExternalStore(
    subscribe,
    () => read<StreakState>(KEYS.streak, EMPTY_STREAK),
    () => EMPTY_STREAK,
  );
}
