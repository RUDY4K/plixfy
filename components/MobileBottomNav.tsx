'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Mobile-only sticky bottom nav. Four destinations: Home, Search (deep-link
 * to the homepage search box), Favorites, Profile.
 *
 * Hidden on viewports ≥ md (the header nav covers desktop), on game pages
 * (player wants the canvas), and we honor safe-area-inset-bottom so the
 * nav sits above the iOS home indicator when running as an installed PWA.
 */
export default function MobileBottomNav() {
  const pathname = usePathname() ?? '/';

  if (pathname.startsWith('/games/')) {
    return null;
  }

  const items = [
    { href: '/', icon: '🏠', label: 'Home', active: pathname === '/' },
    { href: '/#games', icon: '🔍', label: 'Search', active: false },
    { href: '/favorites', icon: '♥', label: 'Favorites', active: pathname.startsWith('/favorites') },
    { href: '/profile', icon: '👤', label: 'Profile', active: pathname.startsWith('/profile') },
  ] as const;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="contents">
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition active:scale-95 ${
                it.active
                  ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,200,255,0.45)]'
                  : 'text-neutral-600 hover:text-cyan-300'
              }`}
            >
              <span
                aria-hidden="true"
                className={`text-lg leading-none transition ${it.active ? 'scale-110' : ''}`}
              >
                {it.icon}
              </span>
              <span>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
