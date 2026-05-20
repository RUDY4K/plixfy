'use client';

import { useEffect, useState } from 'react';
import { readChallengeFromUrl, type Challenge } from '@/lib/challenge';

interface ChallengeBannerProps {
  gameTitle: string;
}

/**
 * If the URL contains a `?c=...` challenge token, decode it and show a
 * banner above the game telling the player who challenged them and the
 * score to beat. Client-only — runs once on mount.
 */
export default function ChallengeBanner({ gameTitle }: ChallengeBannerProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setChallenge(readChallengeFromUrl());
  }, []);

  if (!challenge || dismissed) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-3 sm:p-4"
    >
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-2xl ring-2 ring-amber-400/40">
        {challenge.avatar || '👾'}
      </span>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          You’ve been challenged
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">
          {challenge.nickname} scored {challenge.score.toLocaleString()} in {gameTitle}.
        </p>
        <p className="text-xs text-amber-200/80">Can you beat it?</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss challenge"
        className="rounded-full p-2 text-amber-300/70 hover:bg-amber-500/10 hover:text-amber-200"
      >
        ×
      </button>
    </div>
  );
}
