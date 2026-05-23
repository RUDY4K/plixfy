'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { LightGameMeta, GameCategory } from '@/types/game';
import GameCard from './GameCard';
import AdPlacement from './AdPlacement';
import { CATEGORY_META } from './CategoryCards';
import { compareMostLiked } from '@/lib/ratings';
import { isStrictlyMobile, isVisibleOnMobile } from '@/lib/platform';
import { useIsMobile } from '@/lib/useIsMobile';

interface HomeGridProps {
  games: readonly LightGameMeta[];
}

type Filter = 'all' | GameCategory;
type Sort = 'default' | 'most-liked';

/**
 * Platform filter state.
 *   'auto'    — default. On mobile, hide platform==='desktop'; on
 *               desktop, show everything.
 *   'mobile'  — strict mobile-only (hide 'desktop' AND 'unknown').
 *   'desktop' — desktop-best only (show only games flagged 'desktop').
 *   'off'     — show everything regardless of platform.
 */
type PlatformFilter = 'auto' | 'mobile' | 'desktop' | 'off';

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
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('auto');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const isMobile = useIsMobile();

  // Reset pagination whenever the filter / search / sort narrows results.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filter, sort, deferredQuery, platformFilter, isMobile]);

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
    const byPlatform = byQuery.filter((g) => {
      if (platformFilter === 'mobile') return isStrictlyMobile(g.platform);
      if (platformFilter === 'desktop') return g.platform === 'desktop';
      if (platformFilter === 'off') return true;
      // 'auto' — mobile hides desktop-only, desktop shows everything.
      return isMobile ? isVisibleOnMobile(g.platform) : true;
    });
    const baseSorted = sortGames(byPlatform);
    if (sort === 'most-liked') {
      return [...baseSorted].sort((a, b) => compareMostLiked(a.slug, b.slug));
    }
    return baseSorted;
  }, [games, filter, deferredQuery, sort, platformFilter, isMobile]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <section id="games" className="mt-12 scroll-mt-20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[0.04em] sm:text-3xl">
          <span className="neon-text-gradient">All games</span>
        </h2>
        <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
          {filtered.length.toLocaleString()} of {games.length.toLocaleString()}{' '}
          {isMobile && platformFilter !== 'off' ? 'playable on your device' : 'titles'}
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
            className="glass w-full rounded-full px-5 py-3 pr-12 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--neon-cyan) 60%, transparent)';
              e.currentTarget.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--neon-cyan) 18%, transparent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
              e.currentTarget.style.boxShadow = '';
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--neon-cyan)' }}
          >
            ⌕
          </span>
        </div>

        <div className="flex items-center justify-end">
          <label className="inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="glass rounded-full px-3 py-1 text-xs text-white focus:outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <option value="default">Featured</option>
              <option value="most-liked">Most liked 👍</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <NeonPill
            active={platformFilter === 'mobile'}
            color="var(--neon-cyan)"
            onClick={() => setPlatformFilter(platformFilter === 'mobile' ? 'auto' : 'mobile')}
          >
            📱 Mobile only
          </NeonPill>
          <NeonPill
            active={platformFilter === 'desktop'}
            color="var(--neon-amber)"
            onClick={() => setPlatformFilter(platformFilter === 'desktop' ? 'auto' : 'desktop')}
          >
            🖥️ Desktop best
          </NeonPill>
          {PRIMARY_FILTERS.map((f) => (
            <NeonPill
              key={f.id}
              active={filter === f.id}
              color="var(--neon-purple)"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </NeonPill>
          ))}
          {filter !== 'all' && !PRIMARY_FILTERS.some((f) => f.id === filter) && (
            <NeonPill active color="var(--neon-magenta)" onClick={() => setFilter('all')}>
              {CATEGORY_META[filter as GameCategory]?.label ?? filter} ×
            </NeonPill>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center font-display text-sm uppercase tracking-[0.16em] text-neutral-500">
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
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
                className="glass rounded-full px-7 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:scale-[1.03] active:scale-95"
                style={{
                  border: '1px solid color-mix(in srgb, var(--neon-cyan) 35%, transparent)',
                  boxShadow:
                    '0 0 24px -8px color-mix(in srgb, var(--neon-cyan) 60%, transparent)',
                }}
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
 * Filter chip with neon glow when active, glass surface when not.
 */
function NeonPill({
  children,
  active,
  color,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] transition active:scale-95"
      style={
        active
          ? {
              background: `linear-gradient(120deg, ${color}, color-mix(in srgb, ${color} 60%, white))`,
              color: '#04101A',
              boxShadow: `0 0 18px -2px ${color}`,
              border: '1px solid rgba(255,255,255,0.30)',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(8px)',
            }
      }
    >
      {children}
    </button>
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
