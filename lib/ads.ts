import { log } from './logger';
import { trackAd } from './analytics';

/**
 * Provider-agnostic ad layer. Real provider wiring (AdSense H5 Games Ads,
 * AdinPlay/Venatus) gets added later; right now this is a no-op stub that
 * records intents so the rest of the app can be built and tested.
 */

export type AdPlacement = 'preroll' | 'start' | 'next' | 'reward' | 'browse';

export interface AdProvider {
  readonly name: string;
  init(): Promise<void>;
  showInterstitial(placement: AdPlacement, game?: string): Promise<void>;
  showRewarded(placement: AdPlacement, game?: string): Promise<{ rewarded: boolean }>;
}

interface AdState {
  provider: AdProvider | null;
  initialized: boolean;
  lastShownAt: number;
  shownThisSession: number;
}

const COOLDOWN_MS = 60_000;
const MAX_PER_SESSION = 8;

const state: AdState = {
  provider: null,
  initialized: false,
  lastShownAt: 0,
  shownThisSession: 0,
};

const stubProvider: AdProvider = {
  name: 'stub',
  init: async () => {
    log.info('ads(stub) init');
  },
  showInterstitial: async (placement, game) => {
    log.info('ads(stub) interstitial', placement, game);
    trackAd('impression', placement, game);
    await new Promise((r) => setTimeout(r, 250));
  },
  showRewarded: async (placement, game) => {
    log.info('ads(stub) rewarded', placement, game);
    trackAd('impression', placement, game);
    return { rewarded: true };
  },
};

export function registerAdProvider(provider: AdProvider): void {
  state.provider = provider;
}

export async function initAds(): Promise<void> {
  if (state.initialized) return;
  if (!state.provider) state.provider = stubProvider;
  await state.provider.init();
  state.initialized = true;
}

function canShow(): boolean {
  if (state.shownThisSession >= MAX_PER_SESSION) return false;
  if (Date.now() - state.lastShownAt < COOLDOWN_MS) return false;
  return true;
}

export async function showInterstitial(
  placement: AdPlacement,
  game?: string
): Promise<void> {
  await initAds();
  if (!canShow()) {
    log.debug('ads: throttled', placement);
    return;
  }
  state.lastShownAt = Date.now();
  state.shownThisSession += 1;
  await state.provider!.showInterstitial(placement, game);
}

export async function showRewarded(
  placement: AdPlacement,
  game?: string
): Promise<{ rewarded: boolean }> {
  await initAds();
  state.lastShownAt = Date.now();
  state.shownThisSession += 1;
  return state.provider!.showRewarded(placement, game);
}
