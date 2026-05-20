import { log } from '@/lib/logger';
import { countChampionships, submitScore } from '@/lib/leaderboard';
import { evaluate, getSessionPlays } from '@/lib/achievements';
import type { Difficulty } from './constants';

const KEY_PREFIX = 'plixfy:match-quest:best:';
const SLUG = 'match-quest';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    log.warn('match-quest storage failed', err);
    return fallback;
  }
}

export function loadBest(difficulty: Difficulty): number {
  if (typeof window === 'undefined') return 0;
  return safe(() => {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${difficulty}`);
    return raw ? Number(raw) || 0 : 0;
  }, 0);
}

/** Returns the new best (unchanged if score didn't beat it). */
export function recordBest(difficulty: Difficulty, score: number): number {
  if (typeof window === 'undefined') return score;
  const result = safe(() => {
    const current = loadBest(difficulty);
    if (score <= current) return current;
    window.localStorage.setItem(`${KEY_PREFIX}${difficulty}`, String(score));
    return score;
  }, score);
  // Submit to the global leaderboard regardless of whether the score beat
  // the user's per-difficulty best — top-10 has its own ranking.
  submitScore(SLUG, score, 'higher-better');
  evaluate({
    sessionPlays: getSessionPlays(),
    championships: countChampionships(),
  });
  return result;
}
