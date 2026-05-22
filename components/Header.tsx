import Link from 'next/link';
import { LIGHT_GAMES } from '@/games/registry';
import StreakWidget from './StreakWidget';
import RandomGameLink from './RandomGameLink';
import AuthChip from './AuthChip';

// Cached at module-eval time — recomputed once per server boot, not per
// request. Just the slugs of live games; full game objects stay server-side.
const LIVE_SLUGS: readonly string[] = LIGHT_GAMES.filter((g) => g.status === 'live').map((g) => g.slug);

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="Plixfy home" className="flex items-center gap-2">
          {/* Inline SVG: icon + wordmark, brand-accurate, no network hop */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 340 80"
            className="h-7 w-auto"
            role="img"
            aria-label="Plixfy"
          >
            <g>
              <rect y="8" width="64" height="64" rx="14" fill="#0B0F1A" />
              <path d="M18 20h18a12 12 0 0 1 0 24H26v16h-8V20z" fill="#00C8FF" />
              <path d="M26 28h10a4 4 0 0 1 0 8H26z" fill="#0B0F1A" />
              <path d="M28 29.5 L34 32 L28 34.5 Z" fill="#FF3366" />
            </g>
            <g
              transform="translate(80,16)"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontWeight="800"
              fontSize="52"
              fill="#00C8FF"
              letterSpacing="-1.5"
            >
              <text x="0" y="48">Pl</text>
              <text x="48" y="48">xfy</text>
            </g>
            <rect x="134" y="38" width="8" height="26" fill="#00C8FF" />
            <rect x="134" y="26" width="8" height="8" fill="#FF3366" />
          </svg>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-neutral-400 sm:gap-5">
          <RandomGameLink liveSlugs={LIVE_SLUGS} />
          <Link href="/favorites" className="flex items-center gap-1 transition hover:text-white">
            <span aria-hidden="true">♥</span>
            <span className="hidden sm:inline">Favorites</span>
          </Link>
          <Link href="/" className="hidden transition hover:text-white sm:inline">
            Games
          </Link>
          <Link href="/about" className="hidden transition hover:text-white sm:inline">
            About
          </Link>
          <StreakWidget />
          <AuthChip />
        </nav>
      </div>
    </header>
  );
}
