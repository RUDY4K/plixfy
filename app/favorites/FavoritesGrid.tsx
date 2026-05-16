'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { GameMeta } from '@/types/game';
import GameCard from '@/components/GameCard';
import { useFavorites } from '@/lib/userStateClient';

interface FavoritesGridProps {
  allGames: readonly GameMeta[];
}

export default function FavoritesGrid({ allGames }: FavoritesGridProps) {
  const slugs = useFavorites();

  // Preserve insertion order so the most-recently-favorited shows up last
  // (matches what most portal favorites do). Empty during SSR.
  const games = useMemo(() => {
    const by = new Map(allGames.map((g) => [g.slug, g] as const));
    return slugs.map((s) => by.get(s)).filter((g): g is GameMeta => Boolean(g));
  }, [slugs, allGames]);

  if (games.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center">
        <p className="text-lg font-semibold text-white">No favorites yet</p>
        <p className="mt-1 text-sm text-neutral-400">
          Browse the catalog and tap the heart on any card to save it here.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
        >
          Browse games →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((g) => (
        <GameCard key={g.slug} game={g} />
      ))}
    </div>
  );
}
