import { getHighScore, setHighScore } from '@/lib/storage';

const KEY = 'puzzle-2048';

export function loadBest(): number {
  return getHighScore(KEY);
}

export function recordScore(score: number): number {
  return setHighScore(KEY, score);
}
