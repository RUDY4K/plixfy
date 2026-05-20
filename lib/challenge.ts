'use client';

/**
 * Friend-challenge links: encode `{ score, nickname, avatar }` into the
 * URL query of a game-detail page so a friend opening the link sees the
 * challenge without any backend. The challenger's identity stays local
 * — only the score + display name + avatar travel over the wire.
 *
 * Format: /games/<slug>?c=<base64url(JSON)>
 */

import { log } from './logger';

export interface Challenge {
  score: number;
  nickname: string;
  avatar: string;
}

const PARAM = 'c';

function b64encode(input: string): string {
  if (typeof window === 'undefined') return '';
  // btoa expects latin-1; encodeURIComponent → percent-escape lets us
  // round-trip arbitrary unicode (emoji avatars) safely.
  const utf8 = encodeURIComponent(input).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16)),
  );
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(input: string): string {
  if (typeof window === 'undefined') return '';
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  // Reverse of the encoder.
  let percent = '';
  for (let i = 0; i < binary.length; i++) {
    const c = binary.charCodeAt(i).toString(16).padStart(2, '0');
    percent += `%${c}`;
  }
  return decodeURIComponent(percent);
}

export function encodeChallenge(c: Challenge): string {
  return b64encode(JSON.stringify(c));
}

export function decodeChallenge(token: string): Challenge | null {
  try {
    const obj = JSON.parse(b64decode(token));
    if (typeof obj?.score === 'number' && Number.isFinite(obj.score)
      && typeof obj?.nickname === 'string'
      && typeof obj?.avatar === 'string') {
      return { score: obj.score, nickname: obj.nickname.slice(0, 24), avatar: obj.avatar.slice(0, 8) };
    }
  } catch (err) {
    log.warn('challenge decode failed', err);
  }
  return null;
}

export function buildChallengeUrl(origin: string, slug: string, c: Challenge): string {
  const token = encodeChallenge(c);
  return `${origin}/games/${slug}?${PARAM}=${token}`;
}

/** Read challenge from window.location.search (client-only). */
export function readChallengeFromUrl(): Challenge | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get(PARAM);
  if (!token) return null;
  return decodeChallenge(token);
}
