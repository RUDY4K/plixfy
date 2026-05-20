import { getHighScore, setHighScore } from '@/lib/storage';
import { countChampionships, submitScore } from '@/lib/leaderboard';
import { evaluate, getSessionPlays } from '@/lib/achievements';

const KEY = 'flap-hero';

export function loadBest(): number {
  return getHighScore(KEY);
}

/**
 * Returns the new best (unchanged if score didn't beat it).
 *
 * Also submits to the global leaderboard and runs achievement evaluation.
 * Both calls are side-effect-only — neither can change the high-score
 * value returned to the caller — so the Phaser scenes don't need to know
 * the leaderboard system exists.
 */
export function recordScore(score: number): number {
  const newBest = setHighScore(KEY, score);
  submitScore(KEY, score, 'higher-better');
  evaluate({
    sessionPlays: getSessionPlays(),
    championships: countChampionships(),
  });
  return newBest;
}
