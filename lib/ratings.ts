'use client';

import { useSyncExternalStore } from 'react';
import { log } from './logger';

/**
 * Per-game thumb-up / thumb-down ratings. Local-only — every device keeps
 * its own opinion — but the aggregate is *seeded* with a deterministic
 * baseline so day-one cards already show a sensible "94% liked" number
 * instead of "0 votes".
 *
 * Vote state is one of: 'up' | 'down' | null. Null means the user hasn't
 * voted yet (or revoked their vote).
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state'; // Shared with userStateClient — re-uses the same channel.

const KEYS = {
  myVotes: `${PREFIX}votes`,
} as const;

export type Vote = 'up' | 'down' | null;

export interface RatingSummary {
  up: number;
  down: number;
  total: number;
  /** 0-100 integer "% liked", or null when there are fewer than 3 votes. */
  percentLiked: number | null;
}

function emit(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

/* ─────────────────────────── Cache (referential stability for hooks) ─── */
type CacheEntry = { raw: string | null; parsed: Record<string, Vote> };
let voteCache: CacheEntry | null = null;
const EMPTY_VOTES: Record<string, Vote> = {};

function readVotes(): Record<string, Vote> {
  if (typeof window === 'undefined') return EMPTY_VOTES;
  try {
    const raw = window.localStorage.getItem(KEYS.myVotes);
    if (voteCache && voteCache.raw === raw) return voteCache.parsed;
    const parsed = raw ? (JSON.parse(raw) as Record<string, Vote>) : EMPTY_VOTES;
    voteCache = { raw, parsed };
    return parsed;
  } catch (err) {
    log.warn('ratings read failed', err);
    return EMPTY_VOTES;
  }
}

function writeVotes(value: Record<string, Vote>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEYS.myVotes, JSON.stringify(value));
    emit();
  } catch (err) {
    log.warn('ratings write failed', err);
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

export function getMyVote(slug: string): Vote {
  return readVotes()[slug] ?? null;
}

/** Toggle: same value clears the vote, otherwise sets it. Returns new value. */
export function setMyVote(slug: string, vote: 'up' | 'down'): Vote {
  const current = readVotes();
  const prev = current[slug] ?? null;
  const next: Vote = prev === vote ? null : vote;
  const merged = { ...current, [slug]: next };
  if (next === null) delete merged[slug];
  writeVotes(merged);
  return next;
}

export function useMyVote(slug: string): Vote {
  return useSyncExternalStore(
    subscribe,
    () => readVotes()[slug] ?? null,
    () => null,
  );
}

/* ─────────────────────────── Aggregate summary ──────────────────────────── */

/**
 * Synthetic baseline: deterministic hash → ups/downs in a believable range.
 * Same input → same output, safe to call during SSR. Real local votes are
 * folded in on top.
 */
function syntheticBaseline(slug: string): { up: number; down: number } {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h * 33) ^ slug.charCodeAt(i)) >>> 0;
  // Total votes in [80, 9000] — log-skewed so popular slugs read like
  // popular slugs. Like ratio in [78%, 98%] — kid-friendly portals skew
  // positive; nobody believes a casual game has 40% likes.
  const r1 = (h % 10_000) / 10_000;
  const r2 = ((h >> 8) % 10_000) / 10_000;
  const total = Math.floor(80 + r1 * 8920);
  const likeRatio = 0.78 + r2 * 0.20;
  const up = Math.floor(total * likeRatio);
  return { up, down: total - up };
}

/** Aggregate for a game = synthetic baseline ± current user's vote nudge. */
export function getRating(slug: string): RatingSummary {
  const base = syntheticBaseline(slug);
  const my = getMyVote(slug);
  const up = base.up + (my === 'up' ? 1 : 0);
  const down = base.down + (my === 'down' ? 1 : 0);
  const total = up + down;
  const percentLiked = total >= 3 ? Math.round((up / total) * 100) : null;
  return { up, down, total, percentLiked };
}

export function useRating(slug: string): RatingSummary {
  // The summary depends only on `slug` (static) + my own vote (reactive),
  // so re-running getRating on every storage tick is fine.
  useSyncExternalStore(
    subscribe,
    () => readVotes()[slug] ?? null,
    () => null,
  );
  return getRating(slug);
}

/**
 * "Most liked" comparator — for HomeGrid sort. Higher percent first; ties
 * broken by total votes so a 99%/5-vote game doesn't beat a 95%/9000-vote game.
 */
export function compareMostLiked(a: string, b: string): number {
  const ra = getRating(a);
  const rb = getRating(b);
  // Null percent (too few votes) sorts last.
  const pa = ra.percentLiked ?? -1;
  const pb = rb.percentLiked ?? -1;
  return pb - pa || rb.total - ra.total;
}
