'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GameMeta } from '@/types/game';
import { dailyIndex, msUntilUtcMidnight } from '@/lib/userState';
import FavoriteButton from './FavoriteButton';

interface DailyFeaturedProps {
  games: readonly GameMeta[];
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * "Game of the Day" — deterministic pick that rotates at UTC midnight.
 * Heavy visual treatment matches the Coolmath / Poki featured hero so
 * users get a single confident recommendation on visit.
 */
export default function DailyFeatured({ games }: DailyFeaturedProps) {
  const live = games.filter((g) => g.status === 'live');
  const featured = live[dailyIndex(live.length)] ?? live[0];
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setCountdown(formatCountdown(msUntilUtcMidnight()));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!featured) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/60 via-neutral-950 to-neutral-950">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_2fr] sm:p-6">
        <Link
          href={`/games/${featured.slug}`}
          className="group relative aspect-video overflow-hidden rounded-xl bg-neutral-900"
        >
          <img
            src={featured.thumbnail}
            alt={featured.title}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute left-2 top-2 rounded-full bg-fuchsia-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-950">
            ✨ Today
          </span>
        </Link>

        <div className="flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              Game of the Day
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-400 line-clamp-3">{featured.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/games/${featured.slug}`}
              className="rounded-lg bg-fuchsia-500 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-fuchsia-400"
            >
              Play now →
            </Link>
            <FavoriteButton slug={featured.slug} size="lg" stopPropagation={false} />
            <span className="ml-auto text-xs text-neutral-500" suppressHydrationWarning>
              {countdown ? `Next pick in ${countdown}` : ' '}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
