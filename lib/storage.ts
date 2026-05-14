import { log } from './logger';

const PREFIX = 'playhub:';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    log.warn('storage failed', err);
    return fallback;
  }
}

export function getHighScore(game: string): number {
  if (typeof window === 'undefined') return 0;
  return safe(() => {
    const raw = window.localStorage.getItem(`${PREFIX}highscore:${game}`);
    return raw ? Number(raw) || 0 : 0;
  }, 0);
}

export function setHighScore(game: string, score: number): number {
  if (typeof window === 'undefined') return score;
  return safe(() => {
    const current = getHighScore(game);
    if (score <= current) return current;
    window.localStorage.setItem(`${PREFIX}highscore:${game}`, String(score));
    return score;
  }, score);
}

export function getPlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  return safe(() => window.localStorage.getItem(`${PREFIX}name`), null);
}

export function setPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim().slice(0, 15);
  if (trimmed.length < 3) return;
  safe(() => window.localStorage.setItem(`${PREFIX}name`, trimmed), undefined);
}
