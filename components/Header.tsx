import Link from 'next/link';
import { LIGHT_GAMES } from '@/games/registry';
import StreakWidget from './StreakWidget';
import RandomGameLink from './RandomGameLink';

const LIVE_SLUGS: readonly string[] = LIGHT_GAMES.filter((g) => g.status === 'live').map((g) => g.slug);

export default function Header() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--mesh-1) 70%, transparent)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 24px 60px -40px rgba(0,0,0,0.6)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          aria-label="Plixfy home"
          className="group flex items-center gap-2.5 transition active:scale-95"
        >
          {/* Cyan-glowing icon glyph */}
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl transition group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
              boxShadow: '0 0 20px -2px color-mix(in srgb, var(--neon-cyan) 60%, transparent)',
            }}
          >
            <svg viewBox="0 0 64 64" className="h-6 w-6">
              <path d="M18 12h18a12 12 0 0 1 0 24H26v16h-8V12z" fill="#04101A" />
              <path d="M28 21.5 L34 24 L28 26.5 Z" fill="#FF2DAA" />
            </svg>
          </span>
          {/* Wordmark in Orbitron with cyan glow */}
          <span
            className="font-display text-xl font-black uppercase tracking-[0.06em] text-white sm:text-2xl"
            style={{
              textShadow:
                '0 0 12px color-mix(in srgb, var(--neon-cyan) 60%, transparent), 0 0 30px color-mix(in srgb, var(--neon-cyan) 25%, transparent)',
            }}
          >
            Plixfy
          </span>
        </Link>

        <nav
          className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.12em] text-neutral-300 sm:gap-5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <RandomGameLink liveSlugs={LIVE_SLUGS} />
          <Link
            href="/favorites"
            className="flex items-center gap-1 transition hover:text-[color:var(--neon-magenta)]"
          >
            <span aria-hidden="true">♥</span>
            <span className="hidden sm:inline">Favorites</span>
          </Link>
          <Link
            href="/"
            className="hidden transition hover:text-[color:var(--neon-cyan)] sm:inline"
          >
            Games
          </Link>
          <Link
            href="/about"
            className="hidden transition hover:text-[color:var(--neon-cyan)] sm:inline"
          >
            About
          </Link>
          <StreakWidget />
        </nav>
      </div>
    </header>
  );
}
