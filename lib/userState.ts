/**
 * Pure helpers shared between server and client components.
 *
 * No `'use client'` here: server pages (e.g. game-detail) call baseCount /
 * formatPlayCount during prerender to bake initial play-count chips into
 * the HTML. The React hooks + localStorage mutations live in
 * `userStateClient.ts` (which is marked 'use client').
 */

/* ───────────────────────────── Play counts (deterministic baseline) ─────── */

/**
 * Deterministic synthetic play-count for a slug.
 *
 * Log-skewed across [50K, 5M] so a few games look hugely popular and the
 * long tail shows 50-200K. This gives social proof on day 1 before we
 * have any real traffic data. Same input → same output, no randomness,
 * so it's safe to render during SSR.
 */
export function baseCount(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (Math.imul(h, 31) + slug.charCodeAt(i)) >>> 0;
  const r = h / 0xffffffff;
  return Math.floor(50_000 * Math.pow(100, r));
}

/** Format a play count compactly: 1.2M, 340K, 5.4K, 800. */
export function formatPlayCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(n);
}

/* ───────────────────────────── Daily featured ───────────────────────────── */

/**
 * Index into a games array deterministically by UTC day. Returns the
 * same value for all users until UTC midnight, then rotates. Calendar
 * scarcity without server state.
 */
export function dailyIndex(modulus: number): number {
  if (modulus <= 0) return 0;
  return Math.floor(Date.now() / 86_400_000) % modulus;
}

/** Milliseconds until UTC midnight — for countdown widgets. */
export function msUntilUtcMidnight(now = Date.now()): number {
  const ms = 86_400_000;
  return ms - (now % ms);
}

/* ───────────────────────────── Re-exports ───────────────────────────────── */
// The client hooks and mutations live in ./userStateClient. Importers
// don't need to know that split exists.
export type { RecentEntry, StreakState } from './userStateClient';
