import Link from 'next/link';
import { LIGHT_GAMES } from '@/games/registry';
import StreakWidget from './StreakWidget';
import RandomGameLink from './RandomGameLink';
import ProfileChip from './ProfileChip';

// Cached at module-eval time — recomputed once per server boot, not per
// request. Just the slugs of live games; full game objects stay server-side.
const LIVE_SLUGS: readonly string[] = LIGHT_GAMES.filter((g) => g.status === 'live').map((g) => g.slug);

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-600" />
          Plixfy
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
          <ProfileChip />
        </nav>
      </div>
    </header>
  );
}
