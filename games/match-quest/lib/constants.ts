export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  cols: number;
  rows: number;
  /** Number of unique emoji pairs. Always equals cols*rows / 2. */
  pairs: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', cols: 4, rows: 3, pairs: 6 },
  medium: { id: 'medium', label: 'Medium', cols: 4, rows: 4, pairs: 8 },
  hard: { id: 'hard', label: 'Hard', cols: 6, rows: 5, pairs: 15 },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export const EMOJI_POOL = [
  '🎮', '🎲', '🎯', '🏆', '⭐', '🔥', '💎', '🎵',
  '🌟', '🎪', '🎭', '🎨', '🎸', '🎺', '🎻',
] as const;

export const MISMATCH_HIDE_MS = 1000;
export const MATCH_LOCK_MS = 350;

/** Score formula from prompt: pairs*100 − moves*10 + max(0, (120−seconds)*5) */
export function calcScore(pairs: number, moves: number, seconds: number): number {
  return pairs * 100 - moves * 10 + Math.max(0, (120 - seconds) * 5);
}

export function calcStars(pairs: number, score: number): 1 | 2 | 3 {
  if (score >= pairs * 130) return 3;
  if (score >= pairs * 90) return 2;
  return 1;
}
