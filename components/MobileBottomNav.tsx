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
      className="fixed inset-x-0 bottom-0 z-30 glass-strong border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{
        background: 'color-mix(in srgb, var(--mesh-1) 70%, transparent)',
        borderColor: 'rgba(255,255,255,0.10)',
        boxShadow: '0 -8px 24px -8px rgba(0,0,0,0.6)',
      }}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="contents">
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] transition active:scale-95 ${
                it.active ? 'text-[color:var(--neon-cyan)]' : 'text-neutral-500 hover:text-white'
              }`}
              style={{
                textShadow: it.active
                  ? '0 0 10px color-mix(in srgb, var(--neon-cyan) 55%, transparent)'
                  : undefined,
              }}
            >
              {it.active && (
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full"
                  style={{
                    background: 'var(--neon-cyan)',
                    boxShadow: '0 0 12px var(--neon-cyan)',
                  }}
                />
              )}
              <span
                aria-hidden="true"
                className={`text-xl leading-none transition ${it.active ? 'scale-110' : ''}`}
                style={
                  it.active
                    ? { filter: 'drop-shadow(0 0 10px color-mix(in srgb, var(--neon-cyan) 70%, transparent))' }
                    : undefined
                }
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
