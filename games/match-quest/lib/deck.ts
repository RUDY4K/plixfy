import { EMOJI_POOL, type Difficulty, DIFFICULTIES } from './constants';

export interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildDeck(difficulty: Difficulty): Card[] {
  const { pairs } = DIFFICULTIES[difficulty];
  const chosen = shuffle(EMOJI_POOL).slice(0, pairs);
  const doubled = chosen.flatMap((emoji) => [emoji, emoji]);
  return shuffle(doubled).map((emoji, idx) => ({
    id: idx,
    emoji,
    flipped: false,
    matched: false,
  }));
}
