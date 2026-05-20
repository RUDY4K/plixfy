'use client';

import { useSyncExternalStore } from 'react';
import { log } from './logger';
import { getFavorites } from './userStateClient';

/**
 * Badge system. Each badge has a deterministic id and a `check(snapshot)`
 * predicate; `evaluate()` runs all unearned predicates against the current
 * localStorage snapshot and writes back the newly earned ids. Decoupling
 * the badge data from the trigger event lets us check after any state
 * change without each callsite knowing which badges might fire.
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state';
const AWARDED_EVENT = 'plixfy:achievement';

const KEY = `${PREFIX}achievements`;

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const BADGES: readonly Badge[] = [
  { id: 'first-timer', emoji: '🎮', title: 'First Timer', description: 'Played your first game' },
  { id: 'on-fire', emoji: '🔥', title: 'On Fire', description: 'Reached a 3-day streak' },
  { id: 'speed-demon', emoji: '⚡', title: 'Speed Demon', description: 'Played 5 games in one session' },
  { id: 'champion', emoji: '🏆', title: 'Champion', description: 'Topped a leaderboard at #1' },
  { id: 'explorer', emoji: '🌟', title: 'Explorer', description: 'Played 10 different games' },
  { id: 'legend', emoji: '👑', title: 'Legend', description: 'Played 50 different games' },
  { id: 'collector', emoji: '💎', title: 'Collector', description: 'Favorited 20 games' },
  { id: 'daily-hero', emoji: '🎯', title: 'Daily Hero', description: '7 days in a row' },
] as const;

export interface EarnedBadge {
  id: string;
  at: number;
}

interface EvaluateContext {
  /** Slugs played this *current* tab session — only valid while tab open. */
  sessionPlays: Set<string>;
  /** Force-set when an achievement-relevant non-storage event happens. */
  championships?: number;
}

function emit(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

/**
 * Cache the parsed array against the raw string so successive reads
 * return the same reference — required for useSyncExternalStore.
 */
const EMPTY: EarnedBadge[] = [];
let cacheRaw: string | null | undefined = undefined;
let cacheParsed: EarnedBadge[] = EMPTY;

function safeRead(): EarnedBadge[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (cacheRaw !== undefined && cacheRaw === raw) return cacheParsed;
    let parsed: EarnedBadge[] = EMPTY;
    if (raw) {
      const json = JSON.parse(raw);
      parsed = Array.isArray(json) ? json.filter(isEarned) : EMPTY;
    }
    cacheRaw = raw;
    cacheParsed = parsed;
    return parsed;
  } catch (err) {
    log.warn('achievements read failed', err);
    return EMPTY;
  }
}

function isEarned(x: unknown): x is EarnedBadge {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  return typeof e.id === 'string' && typeof e.at === 'number';
}

function safeWrite(value: EarnedBadge[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
    emit();
  } catch (err) {
    log.warn('achievements write failed', err);
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

export function getEarned(): EarnedBadge[] {
  return safeRead();
}

export function isEarnedId(id: string): boolean {
  return safeRead().some((b) => b.id === id);
}

/* ─────────────────────────── Snapshot helpers ──────────────────────────── */

function distinctPlayCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}counts`);
    if (!raw) return 0;
    const obj = JSON.parse(raw) as Record<string, number>;
    return Object.keys(obj).length;
  } catch {
    return 0;
  }
}

function currentStreak(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}streak`);
    if (!raw) return 0;
    const obj = JSON.parse(raw) as { count?: number };
    return obj?.count ?? 0;
  } catch {
    return 0;
  }
}

/* ─────────────────────────── Evaluation ──────────────────────────────────── */

/**
 * Run every check predicate and persist any newly earned badges. Fires
 * the `AWARDED_EVENT` (detail = Badge[]) so the toast component can react.
 *
 * Safe to call from any UI event — it's a no-op when nothing changed.
 */
export function evaluate(ctx?: Partial<EvaluateContext>): Badge[] {
  if (typeof window === 'undefined') return [];
  const already = new Set(safeRead().map((b) => b.id));
  const newly: Badge[] = [];
  const sessionPlays = ctx?.sessionPlays ?? new Set<string>();
  const championships = ctx?.championships ?? 0;

  const conditions: Record<string, () => boolean> = {
    'first-timer': () => distinctPlayCount() >= 1,
    'on-fire': () => currentStreak() >= 3,
    'speed-demon': () => sessionPlays.size >= 5,
    'champion': () => championships >= 1,
    'explorer': () => distinctPlayCount() >= 10,
    'legend': () => distinctPlayCount() >= 50,
    'collector': () => getFavorites().length >= 20,
    'daily-hero': () => currentStreak() >= 7,
  };

  for (const badge of BADGES) {
    if (already.has(badge.id)) continue;
    if (conditions[badge.id]?.()) newly.push(badge);
  }

  if (newly.length === 0) return [];

  const merged: EarnedBadge[] = [
    ...safeRead(),
    ...newly.map((b) => ({ id: b.id, at: Date.now() })),
  ];
  safeWrite(merged);
  window.dispatchEvent(new CustomEvent<Badge[]>(AWARDED_EVENT, { detail: newly }));
  return newly;
}

/** Subscribe to award events for toast UI. Returns unsubscribe. */
export function onAwarded(handler: (badges: Badge[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<Badge[]>).detail;
    if (detail?.length) handler(detail);
  };
  window.addEventListener(AWARDED_EVENT, listener);
  return () => window.removeEventListener(AWARDED_EVENT, listener);
}

export function useEarned(): EarnedBadge[] {
  return useSyncExternalStore(
    subscribe,
    () => safeRead(),
    () => EMPTY,
  );
}

/* ─────────────────────────── Per-tab session tracker ─────────────────────── */
/**
 * In-memory set of slugs played *this tab* — used for the speed-demon
 * badge. Module-level so any component / scene that imports this file
 * shares the same set.
 */
const sessionPlaySet = new Set<string>();

export function recordSessionPlay(slug: string): void {
  sessionPlaySet.add(slug);
}

export function getSessionPlays(): Set<string> {
  return sessionPlaySet;
}
