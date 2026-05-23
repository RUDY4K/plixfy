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
    <section className="mt-10" style={sectionStyle}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            {icon && (
              <span aria-hidden="true" className="section-icon-glow text-2xl sm:text-3xl">
                {icon}
              </span>
            )}
            <span>{title}</span>
          </h2>
          <span aria-hidden="true" className="section-divider mt-1 block" />
          {subtitle && <p className="mt-1.5 text-xs text-neutral-500">{subtitle}</p>}
        </div>
        {href && (
          <a
            href={href}
            className="text-xs font-semibold text-neutral-400 transition hover:text-cyan-300"
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
