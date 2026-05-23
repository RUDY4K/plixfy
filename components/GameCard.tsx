'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LightGameMeta } from '@/types/game';
import { baseCount, formatPlayCount } from '@/lib/userState';
import { useIsMobile } from '@/lib/useIsMobile';
import FavoriteButton from './FavoriteButton';
import RatingButtons from './RatingButtons';

interface GameCardProps {
  game: LightGameMeta;
  /** compact = horizontal-row card; default = main-grid card. */
  variant?: 'default' | 'compact';
  /** Override the auto-derived badge ("New", "Hot", "Top"). */
  badge?: 'new' | 'hot' | 'top' | 'daily' | null;
}

const difficultyDots: Record<LightGameMeta['difficulty'], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function Thumbnail({ game }: { game: LightGameMeta }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${game.color}33, #0a0a0a)` }}
      >
        <span className="px-3 text-center text-lg font-bold text-white drop-shadow-md font-display">
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
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
    />
  );
}

// Neon badge palette — same intent as before, restyled with the arcade
// gradient/glow language.
const BADGE_STYLES: Record<NonNullable<GameCardProps['badge']>, { label: string; bg: string; color: string; glow: string }> = {
  hot: {
    label: '🔥 HOT',
    bg: 'linear-gradient(120deg, #FF2DAA, #FF6B35)',
    color: '#FFFFFF',
    glow: 'var(--neon-magenta)',
  },
  top: {
    label: '★ TOP',
    bg: 'linear-gradient(135deg, #FFE57A 0%, #FFB300 55%, #C77700 100%)',
    color: '#1A0F00',
    glow: '#FFB300',
  },
  new: {
    label: 'NEW',
    bg: 'linear-gradient(120deg, var(--neon-green), #00C8FF)',
    color: '#04101A',
    glow: 'var(--neon-green)',
  },
  daily: {
    label: '✨ TODAY',
    bg: 'linear-gradient(120deg, var(--neon-purple), var(--neon-magenta))',
    color: '#FFFFFF',
    glow: 'var(--neon-purple)',
  },
};

function autoBadge(game: LightGameMeta): GameCardProps['badge'] {
  if (game.kind === 'custom') return null;
  const c = baseCount(game.slug);
  if (c >= 2_000_000) return 'top';
  if (c >= 500_000) return 'hot';
  return null;
}

function NeonBadge({ kind, compact = false }: { kind: NonNullable<GameCardProps['badge']>; compact?: boolean }) {
  const s = BADGE_STYLES[kind];
  return (
    <span
      className={`absolute left-2 top-2 inline-flex items-center rounded-full font-display font-bold uppercase tracking-[0.14em] ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${s.glow} 40%, transparent), 0 6px 18px -6px ${s.glow}`,
      }}
    >
      {s.label}
    </span>
  );
}

function OriginalBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`absolute left-2 top-2 inline-flex items-center rounded-full font-display font-bold uppercase tracking-[0.14em] text-white ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{
        background: 'linear-gradient(120deg, var(--neon-purple), var(--neon-magenta))',
        boxShadow:
          '0 0 0 1px color-mix(in srgb, var(--neon-purple) 40%, transparent), 0 6px 18px -6px var(--neon-purple)',
      }}
    >
      ORIGINAL
    </span>
  );
}

export default function GameCard({ game, variant = 'default', badge }: GameCardProps) {
  const isLive = game.status === 'live';
  const dots = difficultyDots[game.difficulty];
  const resolvedBadge = badge === undefined ? autoBadge(game) : badge;
  const playCount = baseCount(game.slug);
  const isMobile = useIsMobile();
  const showDesktopHint = isMobile && (game.platform === 'desktop' || game.platform === 'unknown');

  if (variant === 'compact') {
    return (
      <Link
        href={isLive ? `/games/${game.slug}` : '#'}
        aria-disabled={!isLive}
        style={{ ['--card-glow' as string]: game.color }}
        className={`group glass relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl touch-manipulation sm:w-48 ${
          isLive ? 'card-hover card-tap' : 'opacity-60'
        }`}
      >
        <div className="relative aspect-video overflow-hidden">
          <Thumbnail game={game} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          {game.kind === 'custom' && <OriginalBadge compact />}
          {resolvedBadge && game.kind !== 'custom' && <NeonBadge kind={resolvedBadge} compact />}
          {!isLive && (
            <span className="absolute right-2 top-2 rounded-full bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-300 backdrop-blur">
              Soon
            </span>
          )}
          <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between gap-2">
            <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-white drop-shadow">
              {game.title}
            </p>
          </div>
          {showDesktopHint && (
            <span
              title="Best on desktop"
              className="absolute right-1 top-1 rounded-md bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur"
            >
              🖥️
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={isLive ? `/games/${game.slug}` : '#'}
      aria-disabled={!isLive}
      style={{ ['--card-glow' as string]: game.color }}
      className={`group glass relative flex flex-col overflow-hidden rounded-2xl touch-manipulation ${
        isLive ? 'card-hover card-tap' : 'opacity-60'
      }`}
    >
      <div className="relative aspect-video overflow-hidden">
        <Thumbnail game={game} />
        {/* Dark gradient base for text legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        {/* Hover-only color wash so the category color reads on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-60"
          style={{ background: `linear-gradient(135deg, ${game.color}66, transparent 60%)` }}
        />

        {game.kind === 'custom' && <OriginalBadge />}
        {resolvedBadge && game.kind !== 'custom' && <NeonBadge kind={resolvedBadge} />}

        {/* Favorite (top-right) */}
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton slug={game.slug} size="sm" />
        </div>

        {!isLive && (
          <span className="absolute bottom-2 right-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-300 backdrop-blur">
            Coming soon
          </span>
        )}

        {/* Play-count chip */}
        {isLive && game.kind !== 'custom' && (
          <span
            className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
          >
            ▶ {formatPlayCount(playCount)}
          </span>
        )}
        {isLive && (
          <span className="absolute bottom-2 right-2">
            <RatingButtons slug={game.slug} variant="compact" />
          </span>
        )}

        {/* Hover-fade Play button — centered, glowing */}
        {isLive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span
              className="rounded-full px-5 py-2 font-display text-xs font-black uppercase tracking-[0.16em] text-[#04101A]"
              style={{
                background: 'linear-gradient(120deg, var(--neon-cyan), #6BE9FF)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.25), 0 0 28px -2px color-mix(in srgb, var(--neon-cyan) 70%, transparent)',
              }}
            >
              ▶ Play
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-sm font-bold uppercase tracking-wide text-white">
            {game.title}
            {showDesktopHint && (
              <span
                title="Best on desktop"
                aria-label="Best on desktop"
                className="ml-1.5 inline-flex items-center rounded-md bg-amber-400/20 px-1 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-amber-300"
              >
                🖥️
              </span>
            )}
          </h3>
          <span className="flex shrink-0 items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: i < dots ? game.color : 'rgba(255,255,255,0.12)',
                  boxShadow: i < dots ? `0 0 6px ${game.color}` : undefined,
                }}
              />
            ))}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span
            className="neon-pill"
            style={{ ['--pill-color' as string]: game.color }}
          >
            {game.category}
          </span>
          <span
            className="rounded-md px-3 py-1 font-display text-xs font-bold uppercase tracking-[0.12em] text-[#04101A] transition group-hover:scale-105"
            style={{
              background: game.color,
              boxShadow: `0 0 18px -6px ${game.color}`,
            }}
          >
            {isLive ? 'Play →' : 'Soon'}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-neutral-400">{game.description}</p>
      </div>
    </Link>
  );
}
