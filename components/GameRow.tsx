'use client';

import { useRef } from 'react';
import type { LightGameMeta } from '@/types/game';
import GameCard from './GameCard';

interface GameRowProps {
  title: string;
  subtitle?: string;
  icon?: string;
  games: readonly LightGameMeta[];
  /** Optional "see all" link target, e.g. "?category=racing" */
  href?: string;
  /**
   * Section accent color (CSS color). Drives the icon glow and the
   * gradient divider under the title. Default: brand cyan.
   */
  accent?: string;
}

/**
 * Horizontal-scroll row of compact game cards. Includes hidden scroll-arrow
 * buttons that appear on hover (desktop) — touch devices get native momentum
 * scrolling without the chrome.
 */
export default function GameRow({ title, subtitle, icon, games, href, accent }: GameRowProps) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * (el.clientWidth * 0.85), behavior: 'smooth' });
  }

  if (games.length === 0) return null;

  // Bind the section accent via a CSS var so .section-icon-glow and
  // .section-divider inherit it without bespoke styles per row.
  const sectionStyle = accent
    ? ({ ['--section-accent' as string]: accent } as React.CSSProperties)
    : undefined;

  return (
    <section className="mt-12" style={sectionStyle}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase tracking-[0.04em] sm:text-3xl">
            {icon && (
              <span
                aria-hidden="true"
                className="section-icon-glow grid h-10 w-10 place-items-center rounded-xl text-2xl sm:h-12 sm:w-12 sm:text-3xl"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--section-accent, var(--neon-cyan)) 22%, transparent), color-mix(in srgb, var(--section-accent, var(--neon-cyan)) 6%, transparent))',
                  border:
                    '1px solid color-mix(in srgb, var(--section-accent, var(--neon-cyan)) 35%, transparent)',
                }}
              >
                {icon}
              </span>
            )}
            <span className="text-white">{title}</span>
          </h2>
          <span aria-hidden="true" className="section-divider mt-2 block" />
          {subtitle && <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>}
        </div>
        {href && (
          <a
            href={href}
            className="font-display text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 transition hover:text-white"
            style={{ color: 'color-mix(in srgb, var(--section-accent, var(--neon-cyan)) 80%, white)' }}
          >
            See all →
          </a>
        )}
      </div>

      <div className="group relative">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-2 -translate-y-1/2 rounded-full border border-neutral-700 bg-neutral-900/95 px-2.5 py-1.5 text-sm shadow-lg backdrop-blur opacity-0 transition group-hover:opacity-100 sm:block hover:bg-neutral-800"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 z-10 hidden translate-x-2 -translate-y-1/2 rounded-full border border-neutral-700 bg-neutral-900/95 px-2.5 py-1.5 text-sm shadow-lg backdrop-blur opacity-0 transition group-hover:opacity-100 sm:block hover:bg-neutral-800"
        >
          ›
        </button>

        <div
          ref={scroller}
          className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 scrollbar-thin"
          style={{ scrollbarWidth: 'none' }}
        >
          {games.map((g) => (
            <div key={g.slug} className="snap-start">
              <GameCard game={g} variant="compact" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
