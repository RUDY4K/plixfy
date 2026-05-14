import { log } from './logger';

type GtagArgs =
  | ['event', string, Record<string, unknown>]
  | ['config', string, Record<string, unknown>]
  | ['js', Date];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (!GA_ID) {
    log.debug('analytics (no GA_ID)', event, params);
    return;
  }
  window.gtag?.('event', event, params);
}

export function trackGameStart(game: string, difficulty?: string): void {
  track('game_start', { game_name: game, difficulty });
}

export function trackGameEnd(
  game: string,
  score: number,
  durationSec: number,
  reason: 'complete' | 'died' | 'quit' = 'died'
): void {
  track('game_end', {
    game_name: game,
    score,
    duration_sec: durationSec,
    reason,
  });
}

export function trackHighScore(game: string, score: number): void {
  track('high_score', { game_name: game, score });
}

export function trackShare(game: string, method: string): void {
  track('game_share', { game_name: game, method });
}

export function trackAd(
  type: 'impression' | 'click' | 'reward' | 'skip' | 'error',
  placement: string,
  game?: string
): void {
  track('ad_interaction', { ad_type: type, placement, game_name: game });
}
