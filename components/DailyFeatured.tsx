'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LightGameMeta } from '@/types/game';
import { dailyIndex, msUntilUtcMidnight } from '@/lib/userState';
import FavoriteButton from './FavoriteButton';

interface DailyFeaturedProps {
  games: readonly LightGameMeta[];
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
    <section
      className="daily-pulse mt-10 overflow-hidden rounded-2xl border bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-950"
      style={{
        borderColor: 'color-mix(in srgb, var(--accent-creative) 35%, transparent)',
      }}
    >
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
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ background: 'var(--accent-creative)' }}
          >
            ✨ Today
          </span>
        </Link>

        <div className="flex flex-col justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'color-mix(in srgb, var(--accent-creative) 70%, white)' }}
            >
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
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-110"
              style={{ background: 'var(--accent-creative)' }}
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
