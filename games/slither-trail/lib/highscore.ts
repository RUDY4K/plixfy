import { getHighScore, setHighScore } from '@/lib/storage';
import { countChampionships, submitScore } from '@/lib/leaderboard';
import { evaluate, getSessionPlays } from '@/lib/achievements';

const KEY = 'slither-trail';

export function loadBest(): number {
  return getHighScore(KEY);
}

/** Returns the new best (unchanged if score didn't beat it). */
export function recordScore(score: number): number {
  const newBest = setHighScore(KEY, score);
  submitScore(KEY, score, 'higher-better');
  evaluate({
    sessionPlays: getSessionPlays(),
    championships: countChampionships(),
  });
  return newBest;
}
