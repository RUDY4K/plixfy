'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GameMeta } from '@/types/game';
import { baseCount, formatPlayCount } from '@/lib/userState';
import FavoriteButton from './FavoriteButton';

interface GameCardProps {
  game: GameMeta;
  /** compact = horizontal-row card; default = main-grid card. */
  variant?: 'default' | 'compact';
  /** Override the auto-derived badge ("New", "Hot", "Top"). */
  badge?: 'new' | 'hot' | 'top' | 'daily' | null;
}

const difficultyDots: Record<GameMeta['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function Thumbnail({ game }: { game: GameMeta }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${game.color}33, #0a0a0a)` }}
      >
        <span className="px-3 text-center text-lg font-bold text-white drop-shadow-md">
          {game.title}
        </span>
      </div>
    );
  }
  return (
    <img
      src={game.thumbnail}
      alt={game.title}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

const BADGE_STYLES: Record<NonNullable<GameCardProps['badge']>, { label: string; cls: string }> = {
  hot: { label: '🔥 Hot', cls: 'bg-orange-500/95 text-neutral-950' },
  top: { label: '★ Top', cls: 'bg-amber-400/95 text-neutral-950' },
  new: { label: 'New', cls: 'bg-sky-500/95 text-neutral-950' },
  daily: { label: '✨ Today', cls: 'bg-fuchsia-500/95 text-neutral-950' },
};

/**
 * Auto-pick a tier badge from baseCount when the caller didn't specify.
 * Thresholds: 2M+ → top, 500K+ → hot. Below that → no badge.
 */
function autoBadge(game: GameMeta): GameCardProps['badge'] {
  if (game.kind === 'custom') return null;
  const c = baseCount(game.slug);
  if (c >= 2_000_000) return 'top';
  if (c >= 500_000) return 'hot';
  return null;
}

export default function GameCard({ game, variant = 'default', badge }: GameCardProps) {
  const isLive = game.status === 'live';
  const dots = difficultyDots[game.difficulty];
  const resolvedBadge = badge === undefined ? autoBadge(game) : badge;
  const playCount = baseCount(game.slug);

  if (variant === 'compact') {
    return (
      <Link
        href={isLive ? `/games/${game.slug}` : '#'}
        aria-disabled={!isLive}
        className={`group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition sm:w-48 ${
          isLive ? 'hover:border-neutral-600' : 'opacity-60'
        }`}
      >
        <div className="relative aspect-video overflow-hidden bg-neutral-950">
          <Thumbnail game={game} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {game.kind === 'custom' && (
            <span className="absolute left-2 top-2 rounded-full bg-emerald-500/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-950">
              Original
            </span>
          )}
          {resolvedBadge && game.kind !== 'custom' && (
            <span
              className={`absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${BADGE_STYLES[resolvedBadge].cls}`}
            >
              {BADGE_STYLES[resolvedBadge].label}
            </span>
          )}
          {!isLive && (
            <span className="absolute right-2 top-2 rounded-full bg-neutral-800/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-300">
              Soon
            </span>
          )}
          <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white drop-shadow">{game.title}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={isLive ? `/games/${game.slug}` : '#'}
      aria-disabled={!isLive}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition ${
        isLive ? 'hover:border-neutral-600 hover:shadow-[0_0_24px_rgba(255,255,255,0.06)]' : 'opacity-60'
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-950">
        <Thumbnail game={game} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top-left: kind/tier badge */}
        {game.kind === 'custom' && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-950">
            Original
          </span>
        )}
        {resolvedBadge && game.kind !== 'custom' && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLES[resolvedBadge].cls}`}
          >
            {BADGE_STYLES[resolvedBadge].label}
          </span>
        )}

        {/* Top-right: favorite */}
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton slug={game.slug} size="sm" />
        </div>

        {!isLive && (
          <span className="absolute bottom-2 right-2 rounded-full bg-neutral-800/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
            Coming soon
          </span>
        )}

        {/* Play-count chip — bottom-left over the gradient */}
        {isLive && game.kind !== 'custom' && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            ▶ {formatPlayCount(playCount)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{game.title}</h3>
          <span className="flex shrink-0 items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i < dots ? 'bg-neutral-300' : 'bg-neutral-700'}`}
              />
            ))}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider"
            style={{ background: `${game.color}22`, color: game.color }}
          >
            {game.category}
          </span>
          <span
            className="rounded-md px-3 py-1 text-xs font-semibold text-neutral-950 transition group-hover:scale-105"
            style={{ background: game.color }}
          >
            {isLive ? 'Play →' : 'Soon'}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-neutral-400">{game.description}</p>
      </div>
    </Link>
  );
}
