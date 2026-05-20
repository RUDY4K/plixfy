'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { getRecent } from '@/lib/userStateClient';

interface RandomGameLinkProps {
  /**
   * Slugs of all live games. We keep just the strings here (vs. full
   * LightGameMeta) so the Header — which is in the root layout — doesn't
   * ship the entire catalog with every page render. Drops the per-page
   * RSC payload by ~1 MB at 3000+ games.
   */
  liveSlugs: readonly string[];
  /** Header pill vs. floating action. */
  variant?: 'pill' | 'fab';
}

/**
 * Curiosity-loop button: picks an unplayed live game first, falls back
 * to any live game if every catalog entry has been played. Pushing via
 * next/router so we get client-side nav.
 */
export default function RandomGameLink({ liveSlugs, variant = 'pill' }: RandomGameLinkProps) {
  const router = useRouter();

  const pick = useCallback(() => {
    if (liveSlugs.length === 0) return;
    const playedSlugs = new Set(getRecent().map((r) => r.slug));
    const unplayed = liveSlugs.filter((s) => !playedSlugs.has(s));
    const pool = unplayed.length > 0 ? unplayed : liveSlugs;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/games/${picked}`);
  }, [liveSlugs, router]);

  if (variant === 'fab') {
    return (
      <button
        type="button"
        onClick={pick}
        aria-label="Pick a random game"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-xl text-white shadow-lg backdrop-blur transition hover:scale-110 hover:bg-emerald-500 hover:text-neutral-950"
      >
        🎲
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={pick}
      aria-label="Quick Play — load a random game"
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-neutral-950 shadow-md transition hover:scale-[1.03] hover:from-amber-300 hover:to-orange-400 sm:px-4 sm:py-1.5 sm:text-sm"
    >
      <span aria-hidden="true">🎲</span>
      <span>Quick Play</span>
    </button>
  );
}
