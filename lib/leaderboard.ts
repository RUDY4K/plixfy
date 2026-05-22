'use client';

import { useSyncExternalStore } from 'react';
import { log } from './logger';

/**
 * Per-game top-10 leaderboard. Local-only for now — every device keeps its
 * own list — but the data shape mirrors what a Postgres `scores` table
 * would look like so the swap-to-backend is a single repository
 * implementation away.
 *
 * Ordering for "lower is better" games (timed runs, fewest moves) is
 * controlled by the `direction` arg of `submitScore`. Default = higher
 * is better.
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state';
const MAX_ENTRIES = 10;

const key = (slug: string) => `${PREFIX}lb:${slug}`;

export interface ScoreEntry {
  /** Nickname at the time the score was set — stays stable if user renames. */
  nickname: string;
  avatar: string;
  score: number;
  /** UTC ms timestamp. */
  at: number;
}

export type ScoreDirection = 'higher-better' | 'lower-better';

function emit(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

/**
 * useSyncExternalStore needs referential stability — cache the parsed
 * array per storage key and reuse it until the raw string changes.
 */
type CacheEntry = { raw: string | null; parsed: ScoreEntry[] };
const cache = new Map<string, CacheEntry>();
const EMPTY: ScoreEntry[] = [];

function safeRead(k: string): ScoreEntry[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(k);
    const hit = cache.get(k);
    if (hit && hit.raw === raw) return hit.parsed;
    let parsed: ScoreEntry[] = EMPTY;
    if (raw) {
      const json = JSON.parse(raw);
      parsed = Array.isArray(json) ? json.filter(isValidEntry) : EMPTY;
    }
    cache.set(k, { raw, parsed });
    return parsed;
  } catch (err) {
    log.warn('leaderboard read failed', { k, err });
    return EMPTY;
  }
}

function isValidEntry(x: unknown): x is ScoreEntry {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.nickname === 'string' &&
    typeof e.avatar === 'string' &&
    typeof e.score === 'number' &&
    Number.isFinite(e.score) &&
    typeof e.at === 'number'
  );
}

function safeWrite(k: string, entries: ScoreEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(k, JSON.stringify(entries));
    emit();
  } catch (err) {
    log.warn('leaderboard write failed', { k, err });
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

/** Sort + truncate. Higher-better → DESC by score; lower-better → ASC. */
function rank(entries: ScoreEntry[], direction: ScoreDirection): ScoreEntry[] {
  const sign = direction === 'lower-better' ? 1 : -1;
  return [...entries]
    .sort((a, b) => sign * (a.score - b.score) || a.at - b.at)
    .slice(0, MAX_ENTRIES);
}

export function getTop(slug: string): ScoreEntry[] {
  return safeRead(key(slug));
}

/**
 * Submit a score for `slug`. Returns the rank (1-indexed) if it made the
 * top 10, or `null` otherwise.
 *
 * The local leaderboard is anonymous-only — identity (nickname / avatar)
 * lives in Clerk now and is only accessible from React. The authoritative
 * cross-device leaderboard is `lib/leaderboard-server.ts` which the game
 * pages read from for the GlobalLeaderboard widget.
 */
export function submitScore(
  slug: string,
  score: number,
  direction: ScoreDirection = 'higher-better',
): number | null {
  if (!Number.isFinite(score)) return null;
  const entry: ScoreEntry = {
    nickname: 'You',
    avatar: '👾',
    score,
    at: Date.now(),
  };
  const k = key(slug);
  const merged = rank([...safeRead(k), entry], direction);
  // Find this entry's position post-rank — match on `at` since it's unique.
  const idx = merged.findIndex((e) => e.at === entry.at);
  if (idx === -1) return null;
  safeWrite(k, merged);
  return idx + 1;
}

/** Highest score on the board (or null if empty). */
export function topScore(slug: string, direction: ScoreDirection = 'higher-better'): number | null {
  const list = getTop(slug);
  if (list.length === 0) return null;
  const ranked = rank(list, direction);
  return ranked[0]?.score ?? null;
}

export function useLeaderboard(slug: string): ScoreEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => safeRead(key(slug)),
    () => EMPTY,
  );
}

/**
 * Champion-badge counter. Returns the number of local leaderboards the
 * player tops (#1 with nickname "You"). Local-only signal — the
 * server-side leaderboard (lib/leaderboard-server) is where real
 * cross-device wins are tracked.
 */
export function countChampionships(): number {
  if (typeof window === 'undefined') return 0;
  let wins = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(`${PREFIX}lb:`)) continue;
    const list = safeRead(k);
    if (list.length === 0) continue;
    if (list[0]?.nickname === 'You') wins += 1;
  }
  return wins;
}
