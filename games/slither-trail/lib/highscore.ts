import { getHighScore, setHighScore } from '@/lib/storage';

const KEY = 'slither-trail';

export function loadBest(): number {
  return getHighScore(KEY);
}

/** Returns the new best (unchanged if score didn't beat it). */
export function recordScore(score: number): number {
  return setHighScore(KEY, score);
}
