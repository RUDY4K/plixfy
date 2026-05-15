'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { GameMeta, GameCategory } from '@/types/game';
import GameCard from './GameCard';
import AdPlacement from './AdPlacement';

interface HomeGridProps {
  games: readonly GameMeta[];
}

type Filter = 'all' | GameCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'sports', label: 'Sports' },
  { id: 'racing', label: 'Racing' },
];

/**
 * Sort: custom games first (preserves their authored order), then embed games.
 * Within each group: live before coming-soon.
 */
function sortGames(games: readonly GameMeta[]): GameMeta[] {
  const kindRank = (g: GameMeta) => (g.kind === 'custom' ? 0 : 1);
  const statusRank = (g: GameMeta) => (g.status === 'live' ? 0 : 1);
  return [...games].sort((a, b) => kindRank(a) - kindRank(b) || statusRank(a) - statusRank(b));
}

function matchesQuery(game: GameMeta, q: string): boolean {
  if (!q) return true;
  const hay = `${game.title} ${game.description} ${game.keywords.join(' ')}`.toLowerCase();
  return hay.includes(q);
}

export default function HomeGrid({ games }: HomeGridProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const byCategory = filter === 'all' ? games : games.filter((g) => g.category === filter);
    const byQuery = byCategory.filter((g) => matchesQuery(g, deferredQuery));
    return sortGames(byQuery);
  }, [games, filter, deferredQuery]);

  return (
    <section id="games" className="mt-12">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Browse games</h2>
        <span className="text-sm text-neutral-400">
          {filtered.length} of {games.length} titles
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="relative sm:ml-auto sm:w-64">
          <input
            type="search"
            placeholder="Search games…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search games"
            className="w-full rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1.5 pr-9 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
          />
          <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600">
            ⌕
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-500">
          No games match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((game, idx) => (
            <div key={game.slug} className="contents">
              <LazyCard>
                <GameCard game={game} />
              </LazyCard>
              {(idx + 1) % 8 === 0 && idx < filtered.length - 1 && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <AdPlacement slot="between" label="Ad · between games" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * CSS-only lazy rendering: `content-visibility: auto` lets the browser skip
 * paint/layout for off-screen cards. `contain-intrinsic-size` reserves space
 * so scrollbar geometry stays stable.
 *
 * Cheaper than IntersectionObserver, no flicker on filter changes.
 */
function LazyCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '320px 280px',
      }}
    >
      {children}
    </div>
  );
}
