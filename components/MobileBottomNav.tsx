'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

/**
 * Mobile-only sticky bottom nav. Four destinations: Home, Search
 * (deep-link to the homepage search box), Favorites, Profile (routes
 * to /sign-in for anonymous visitors so the tab is always functional).
 *
 * Hidden on viewports ≥ md (the header nav covers everything bigger
 * than a phone). The active route is highlighted via pathname match.
 *
 * We honor `safe-area-inset-bottom` so the nav sits above the iOS
 * home indicator when running as an installed PWA.
 */
export default function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const { isLoaded, isSignedIn, user } = useUser();

  // Hide on the sign-in/sign-up flows so we don't compete with Clerk's
  // own UI, and on individual game pages where vertical space is
  // critical (the player wants a clean canvas, not chrome).
  if (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/games/')
  ) {
    return null;
  }

  const profileHref = isLoaded && !isSignedIn ? '/sign-in' : '/profile';
  const profileAvatar = isLoaded && isSignedIn ? user?.imageUrl ?? null : null;

  const items = [
    { href: '/', icon: '🏠', label: 'Home', active: pathname === '/' },
    { href: '/#games', icon: '🔍', label: 'Search', active: false },
    { href: '/favorites', icon: '♥', label: 'Favorites', active: pathname.startsWith('/favorites') },
    {
      href: profileHref,
      icon: '👤',
      label: isLoaded && isSignedIn ? 'Profile' : 'Sign in',
      active: pathname.startsWith('/profile'),
      avatar: profileAvatar,
    },
  ] as const;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="contents">
            <Link
              href={it.href}
              aria-current={it.active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                it.active ? 'text-cyan-300' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {'avatar' in it && it.avatar ? (
                <span className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-neutral-700">
                  <Image
                    src={it.avatar}
                    alt=""
                    fill
                    sizes="24px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
              ) : (
                <span aria-hidden="true" className="text-lg leading-none">
                  {it.icon}
                </span>
              )}
              <span>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
