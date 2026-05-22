'use client';

import { useIsMobile } from '@/lib/useIsMobile';
import type { GamePlatform } from '@/types/game';

/**
 * Shown above GameStage when the user is on a mobile device and the
 * game is flagged desktop-only. Doesn't block playback — the player
 * can still tap-through and try; we just set expectations.
 *
 * SSR-safe: renders nothing on the server (useIsMobile returns false
 * there); the banner only appears post-hydration on actual phones.
 */
export default function DesktopOnlyBanner({ platform }: { platform: GamePlatform }) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  if (platform !== 'desktop' && platform !== 'unknown') return null;

  const isHard = platform === 'desktop';

  return (
    <div
      role="note"
      className={`mb-3 flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
        isHard
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
          : 'border-neutral-700 bg-neutral-900 text-neutral-300'
      }`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {isHard ? '⚠️' : '💡'}
      </span>
      <div className="flex-1">
        <p className="font-semibold">
          {isHard ? 'This game works best on desktop' : 'Might play better on desktop'}
        </p>
        <p className="text-xs opacity-80">
          {isHard
            ? 'Some keyboard or mouse-only controls may not work on a phone. Try it — many games still play.'
            : "We couldn't confirm mobile controls for this one. Tap through to try; switch to a laptop if it feels off."}
        </p>
      </div>
    </div>
  );
}
