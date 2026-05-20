import { log } from './logger';
import { trackAd } from './analytics';

/**
 * Provider-agnostic ad layer. Picks a provider at first call based on
 * env + consent state — stub when either is missing, AdSense otherwise.
 *
 * Throttling rules (per spec):
 *   - max 1 interstitial per 60s
 *   - max 3 impressions (interstitial OR rewarded) per session
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
  lastInterstitialAt: number;
  shownThisSession: number;
}

const INTERSTITIAL_COOLDOWN_MS = 60_000;
const MAX_PER_SESSION = 3;
const CONSENT_KEY = 'plixfy:ad-consent';

const state: AdState = {
  provider: null,
  initialized: false,
  lastInterstitialAt: 0,
  shownThisSession: 0,
};

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

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
    trackAd('rewarded_complete', placement, game);
    return { rewarded: true };
  },
};

/**
 * AdSense provider — uses Google's H5 Games Ads APIs (`adBreak` / `adConfig`)
 * when the loader script has populated `window.adsbygoogle`. Falls back to
 * the stub if the SDK never becomes available (ad blocker, network error).
 */
function adsenseProvider(clientId: string): AdProvider {
  return {
    name: 'adsense',
    init: async () => {
      log.info('ads(adsense) init', clientId);
      if (typeof window === 'undefined') return;
      const w = window as unknown as {
        adsbygoogle?: unknown[];
        adConfig?: (cfg: Record<string, unknown>) => void;
      };
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adConfig?.({ preloadAdBreaks: 'on', sound: 'off' });
    },
    showInterstitial: (placement, game) =>
      new Promise<void>((resolve) => {
        const w = window as unknown as {
          adBreak?: (opts: Record<string, unknown>) => void;
        };
        if (!w.adBreak) {
          log.warn('ads(adsense) adBreak unavailable — falling back to stub');
          trackAd('error', placement, game);
          resolve();
          return;
        }
        trackAd('impression', placement, game);
        w.adBreak({
          type: 'next',
          name: `${placement}-${game ?? 'unknown'}`,
          adBreakDone: (info: { breakStatus?: string }) => {
            if (info.breakStatus === 'viewed') {
              // Counted as impression already.
            } else if (info.breakStatus === 'dismissed') {
              trackAd('skipped', placement, game);
            } else if (info.breakStatus === 'error') {
              trackAd('error', placement, game);
            }
            resolve();
          },
        });
      }),
    showRewarded: (placement, game) =>
      new Promise<{ rewarded: boolean }>((resolve) => {
        const w = window as unknown as {
          adBreak?: (opts: Record<string, unknown>) => void;
        };
        if (!w.adBreak) {
          trackAd('error', placement, game);
          resolve({ rewarded: false });
          return;
        }
        let granted = false;
        trackAd('impression', placement, game);
        w.adBreak({
          type: 'reward',
          name: `reward-${game ?? 'unknown'}`,
          beforeReward: (showAdFn: () => void) => showAdFn(),
          adViewed: () => {
            granted = true;
            trackAd('rewarded_complete', placement, game);
          },
          adDismissed: () => trackAd('skipped', placement, game),
          adBreakDone: () => resolve({ rewarded: granted }),
        });
      }),
  };
}

function selectProvider(): AdProvider {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (clientId && hasConsent()) {
    return adsenseProvider(clientId);
  }
  return stubProvider;
}

export function registerAdProvider(provider: AdProvider): void {
  state.provider = provider;
}

export async function initAds(): Promise<void> {
  if (state.initialized) return;
  if (!state.provider) state.provider = selectProvider();
  await state.provider.init();
  state.initialized = true;
}

/**
 * Reset cached provider — call after consent state changes so a future
 * impression picks up the new provider on next initAds().
 */
export function resetAdProvider(): void {
  state.provider = null;
  state.initialized = false;
}

function canShowInterstitial(): boolean {
  if (state.shownThisSession >= MAX_PER_SESSION) return false;
  if (Date.now() - state.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
  return true;
}

function canShowAny(): boolean {
  return state.shownThisSession < MAX_PER_SESSION;
}

export async function showInterstitial(
  placement: AdPlacement,
  game?: string
): Promise<void> {
  await initAds();
  if (!canShowInterstitial()) {
    log.debug('ads: throttled', placement);
    return;
  }
  state.lastInterstitialAt = Date.now();
  state.shownThisSession += 1;
  await state.provider!.showInterstitial(placement, game);
}

export async function showRewarded(
  placement: AdPlacement,
  game?: string
): Promise<{ rewarded: boolean }> {
  await initAds();
  if (!canShowAny()) {
    log.debug('ads: session cap hit', placement);
    return { rewarded: false };
  }
  state.shownThisSession += 1;
  return state.provider!.showRewarded(placement, game);
}
