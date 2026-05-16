import Link from 'next/link';
import { GAMES } from '@/games/registry';
import StreakWidget from './StreakWidget';
import RandomGameLink from './RandomGameLink';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-600" />
          PlayHub
        </Link>
        <nav className="flex items-center gap-3 text-sm text-neutral-400 sm:gap-5">
          <RandomGameLink games={GAMES} />
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
        </nav>
      </div>
    </header>
  );
}
