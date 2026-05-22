'use client';

import { useSyncExternalStore } from 'react';
import { log } from './logger';

/**
 * Player profile (nickname + avatar) and play-time tracking — localStorage
 * only, no backend, no PII collected. Designed to be COPPA-safe: nicknames
 * are display-only and never validated against real names.
 *
 * Reactivity piggybacks on the same `plixfy:state` event used by
 * userStateClient so a single subscribe channel covers all UI state.
 */

const PREFIX = 'plixfy:';
const EVENT = 'plixfy:state';

const KEYS = {
  profile: `${PREFIX}profile`,
  playTime: `${PREFIX}playtime`,
} as const;

/** 20 preset avatars — emoji glyphs that render consistently cross-platform. */
export const AVATARS: readonly string[] = [
  '🦊', '🐱', '🐶', '🐼', '🐯',
  '🦁', '🐸', '🐵', '🐧', '🦄',
  '🐉', '🦖', '👾', '🤖', '👻',
  '🎃', '🧙', '🦸', '🥷', '🐲',
] as const;

const NAME_PREFIXES = [
  'Cosmic', 'Pixel', 'Turbo', 'Lucky', 'Neon',
  'Cyber', 'Mega', 'Stellar', 'Rocket', 'Frost',
] as const;
const NAME_SUFFIXES = [
  'Hero', 'Ninja', 'Wizard', 'Panda', 'Tiger',
  'Phoenix', 'Falcon', 'Knight', 'Rider', 'Wolf',
] as const;

export interface Profile {
  nickname: string;
  avatar: string;
  createdAt: number;
}

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

/* ─────────────────────────── Profile read/write ─────────────────────────── */

export function getProfile(): Profile | null {
  return safeRead<Profile | null>(KEYS.profile, null);
}

export function sanitizeNickname(input: string): string {
  return input.normalize('NFC').replace(/[\s ]+/g, ' ').trim().slice(0, 15);
}

export function saveProfile(input: { nickname: string; avatar: string }): Profile | null {
  const nickname = sanitizeNickname(input.nickname);
  if (nickname.length < 2) return null;
  if (!AVATARS.includes(input.avatar)) return null;
  const prev = getProfile();
  const next: Profile = {
    nickname,
    avatar: input.avatar,
    createdAt: prev?.createdAt ?? Date.now(),
  };
  safeWrite(KEYS.profile, next);
  return next;
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEYS.profile);
    emit();
  } catch (err) {
    log.warn('profile clear failed', err);
  }
}

export function randomNickname(): string {
  const pre = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suf = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${pre}${suf}${num}`;
}

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

const EMPTY_PROFILE: Profile | null = null;

export function useProfile(): Profile | null {
  return useSyncExternalStore(
    subscribe,
    () => safeRead<Profile | null>(KEYS.profile, EMPTY_PROFILE),
    () => EMPTY_PROFILE,
  );
}

/* ─────────────────────────── Play-time tracking ──────────────────────────── */

interface PlayTimeState {
  totalMs: number;
}

const EMPTY_PT: PlayTimeState = { totalMs: 0 };

export function getTotalPlayMs(): number {
  return safeRead<PlayTimeState>(KEYS.playTime, EMPTY_PT).totalMs;
}

export function addPlayMs(ms: number): void {
  if (!Number.isFinite(ms) || ms <= 0) return;
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
