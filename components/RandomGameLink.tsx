'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { GameMeta } from '@/types/game';
import { getRecent } from '@/lib/userStateClient';

interface RandomGameLinkProps {
  games: readonly GameMeta[];
  /** Header pill vs. floating action. */
  variant?: 'pill' | 'fab';
}

/**
 * Curiosity-loop button: picks an unplayed live game first, falls back
 * to any live game if every catalog entry has been played. Pushing via
 * next/router so we get client-side nav.
 */
export default function RandomGameLink({ games, variant = 'pill' }: RandomGameLinkProps) {
  const router = useRouter();

  const pick = useCallback(() => {
    const live = games.filter((g) => g.status === 'live');
    if (live.length === 0) return;
    const playedSlugs = new Set(getRecent().map((r) => r.slug));
    const unplayed = live.filter((g) => !playedSlugs.has(g.slug));
    const pool = unplayed.length > 0 ? unplayed : live;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/games/${picked.slug}`);
  }, [games, router]);

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
      aria-label="Random game"
      className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-300 transition hover:border-emerald-500 hover:text-emerald-400"
    >
      <span aria-hidden="true">🎲</span>
      Random
    </button>
  );
}
