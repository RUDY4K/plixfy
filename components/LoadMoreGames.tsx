'use client';

import { useState } from 'react';
import type { LightGameMeta } from '@/types/game';
import GameCard from './GameCard';

interface LoadMoreGamesProps {
  topic: string;
  /** Offset where the SSR initial batch ends — first request starts here. */
  initialOffset: number;
  /** Total games in the topic (used to render "N remaining"). */
  total: number;
  /** Per-click batch size; defaults to 50 to match the API default. */
  batchSize?: number;
}

/**
 * Client-side pagination tail for /play/[topic]. The server renders the
 * first N cards directly so the page is fully SEO-indexable; this
 * component takes over for any further games via /api/play/[topic].
 *
 * Keeping the catalog out of the SSR payload is how we stay under
 * Vercel's 19MB pre-rendered-page limit on big topics like
 * `unblocked-games` (5,300+ live titles).
 */
export default function LoadMoreGames({
  topic,
  initialOffset,
  total,
  batchSize = 50,
}: LoadMoreGamesProps) {
  const [games, setGames] = useState<LightGameMeta[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, total - offset);
  const hasMore = remaining > 0;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/play/${encodeURIComponent(topic)}?offset=${offset}&limit=${batchSize}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { games: LightGameMeta[]; total: number; hasMore: boolean } = await res.json();
      if (!Array.isArray(data.games)) throw new Error('bad payload');
      setGames((prev) => [...prev, ...data.games]);
      setOffset((prev) => prev + data.games.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {games.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            aria-busy={loading}
            className="glass rounded-full px-7 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:scale-[1.03] active:scale-95 disabled:cursor-progress disabled:opacity-70 disabled:hover:scale-100"
            style={{
              border: '1px solid color-mix(in srgb, var(--neon-cyan) 35%, transparent)',
              boxShadow:
                '0 0 24px -8px color-mix(in srgb, var(--neon-cyan) 60%, transparent)',
            }}
          >
            {loading ? 'Loading…' : `Load more (${remaining.toLocaleString()} remaining)`}
          </button>
          {error && (
            <p className="text-xs text-[color:var(--neon-magenta)]">
              Couldn’t load more games ({error}). Try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
