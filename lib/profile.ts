'use client';

import { useSyncExternalStore } from 'react';
import { log } from './logger';

/**
 * Local play-time tracking. Sums milliseconds the user has spent inside
 * Plixfy games — purely a UX nicety surfaced on the profile dashboard,
 * never sent to the server.
 *
 * Identity (nickname / avatar) moved off localStorage and onto Clerk
 * in Phase 1. The legacy `useProfile`/`saveProfile`/`ProfileSetupModal`
 * are gone — components read identity from `useUser()` (`@clerk/nextjs`).
 *
 * Reactivity piggybacks on the `plixfy:state` event used elsewhere so a
 * single subscribe channel covers play time + favorites + recent + streak.
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state';

const KEYS = {
  playTime: `${PREFIX}playtime`,
} as const;

function emit(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

type CacheEntry = { raw: string | null; parsed: unknown };
const cache = new Map<string, CacheEntry>();

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const hit = cache.get(key);
    if (hit && hit.raw === raw) return hit.parsed as T;
    const parsed = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, { raw, parsed });
    return parsed;
  } catch (err) {
    log.warn('profile read failed', { key, err });
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emit();
  } catch (err) {
    log.warn('profile write failed', { key, err });
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

interface PlayTimeState {
  totalMs: number;
}

const EMPTY_PT: PlayTimeState = { totalMs: 0 };

export function getTotalPlayMs(): number {
  return safeRead<PlayTimeState>(KEYS.playTime, EMPTY_PT).totalMs;
}

export function addPlayMs(ms: number): void {
  if (!Number.isFinite(ms) || ms <= 0) return;
  // Cap each increment at 4h — guards against tabs left open for days
  // accumulating absurd values.
  const capped = Math.min(ms, 4 * 60 * 60 * 1000);
  const current = safeRead<PlayTimeState>(KEYS.playTime, EMPTY_PT);
  safeWrite<PlayTimeState>(KEYS.playTime, { totalMs: current.totalMs + capped });
}

export function usePlayTimeMs(): number {
  return useSyncExternalStore(
    subscribe,
    () => safeRead<PlayTimeState>(KEYS.playTime, EMPTY_PT).totalMs,
    () => 0,
  );
}

export function formatPlayTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours >= 1) return `${hours}h ${mins}m`;
  if (mins >= 1) return `${mins}m`;
  return `${totalSec}s`;
}
