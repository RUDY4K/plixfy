'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { LightGameMeta, GameCategory } from '@/types/game';
import GameCard from './GameCard';
import AdPlacement from './AdPlacement';
import { CATEGORY_META } from './CategoryCards';
import { compareMostLiked } from '@/lib/ratings';

interface HomeGridProps {
  games: readonly LightGameMeta[];
}

type Filter = 'all' | GameCategory;
type Sort = 'default' | 'most-liked';

/**
 * Quick-filter pills (top-level genres). Less-popular categories are still
 * reachable via the CategoryCards grid above this section.
 */
const PRIMARY_FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'racing', label: 'Racing' },
  { id: 'shooting', label: 'Shooting' },
  { id: 'sports', label: 'Sports' },
  { id: 'action', label: 'Action' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'stickman', label: 'Stickman' },
  { id: 'zombie', label: 'Zombie' },
  { id: 'cooking', label: 'Cooking' },
];

const PAGE_SIZE = 48;

function sortGames(games: readonly LightGameMeta[]): LightGameMeta[] {
  const kindRank = (g: LightGameMeta) => (g.kind === 'custom' ? 0 : 1);
  const statusRank = (g: LightGameMeta) => (g.status === 'live' ? 0 : 1);
  return [...games].sort((a, b) => kindRank(a) - kindRank(b) || statusRank(a) - statusRank(b));
}

function matchesQuery(game: LightGameMeta, q: string): boolean {
  if (!q) return true;
  const hay = `${game.title} ${game.description} ${game.keywords.join(' ')} ${game.category}`.toLowerCase();
  return hay.includes(q);
}

export default function HomeGrid({ games }: HomeGridProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('default');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Reset pagination whenever the filter / search / sort narrows results.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filter, sort, deferredQuery]);

  // Wire up category-card "#games?category=X" anchors: when the URL hash
  // changes, jump to the matching filter. Lets us deep-link without
  // pulling in Next's router on a client-only homepage.
  useEffect(() => {
    function applyHash() {
      const m = /category=([a-z]+)/.exec(window.location.hash);
      if (!m) return;
      const cat = m[1] as Filter;
      if (PRIMARY_FILTERS.some((f) => f.id === cat) || cat in CATEGORY_META) {
        setFilter(cat);
      }
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const filtered = useMemo(() => {
    const byCategory = filter === 'all' ? games : games.filter((g) => g.category === filter);
    const byQuery = byCategory.filter((g) => matchesQuery(g, deferredQuery));
    const baseSorted = sortGames(byQuery);
    if (sort === 'most-liked') {
      return [...baseSorted].sort((a, b) => compareMostLiked(a.slug, b.slug));
    }
    return baseSorted;
  }, [games, filter, deferredQuery, sort]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <section id="games" className="mt-12 scroll-mt-20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">All games</h2>
        <span className="text-sm text-neutral-400">
          {filtered.length} of {games.length} titles
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <input
            type="search"
            placeholder="Search games…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search games"
            className="w-full rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 pr-10 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
          />
          <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600">
            ⌕
          </span>
        </div>

        <div className="flex items-center justify-end">
          <label className="inline-flex items-center gap-2 text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="default">Featured</option>
              <option value="most-liked">Most liked 👍</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRIMARY_FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
          {filter !== 'all' && !PRIMARY_FILTERS.some((f) => f.id === filter) && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-950"
            >
              {CATEGORY_META[filter as GameCategory]?.label ?? filter} ×
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-500">
          No games match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slice.map((game, idx) => (
              <div key={game.slug} className="contents">
                <LazyCard>
                  <GameCard game={game} />
                </LazyCard>
                {(idx + 1) % 12 === 0 && idx < slice.length - 1 && (
                  <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                    <AdPlacement slot="between" label="Ad · between games" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:border-emerald-500 hover:text-emerald-400"
              >
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/**
 * CSS-only lazy rendering: `content-visibility: auto` lets the browser skip
 * paint/layout for off-screen cards. `contain-intrinsic-size` reserves space
 * so scrollbar geometry stays stable.
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
