'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LightGameMeta } from '@/types/game';
import { useRecent } from '@/lib/userStateClient';
import GameRow from './GameRow';

interface RecentlyPlayedRowProps {
  allGames: readonly LightGameMeta[];
}

/**
 * Personalized row — renders only after hydration and only when the user
 * has at least one entry. We avoid showing on SSR to prevent a layout
 * flash for first-time visitors who'd see an empty section briefly.
 */
export default function RecentlyPlayedRow({ allGames }: RecentlyPlayedRowProps) {
  const recent = useRecent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const games = useMemo(() => {
    if (!mounted) return [];
    const by = new Map(allGames.map((g) => [g.slug, g] as const));
    return recent.map((r) => by.get(r.slug)).filter((g): g is LightGameMeta => Boolean(g));
  }, [recent, allGames, mounted]);

  if (!mounted || games.length === 0) return null;

  return (
    <GameRow
      title="Continue Playing"
      icon="↻"
      subtitle="Pick up where you left off"
      games={games}
      href="/favorites"
    />
  );
}
