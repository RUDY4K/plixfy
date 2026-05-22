'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { getFavorites } from '@/lib/userStateClient';
import { syncLocalFavorites } from '@/app/actions/favorites';
import { log } from '@/lib/logger';

const MIGRATION_FLAG = 'plixfy:favs:synced';

/**
 * Headless component mounted once in the root layout. On the first render
 * where the user is signed in, it copies any localStorage favorites the
 * user accumulated while anonymous into their Supabase favorites row.
 *
 * Safe to mount on every page — the migration flag guarantees we only
 * run the upload once per logged-in session per device.
 */
export default function FavoritesSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || ranRef.current) return;
    ranRef.current = true;

    // Per-user migration flag — survives re-logins on the same device.
    const flag = `${MIGRATION_FLAG}:${user.id}`;
    try {
      if (window.localStorage.getItem(flag) === '1') return;
    } catch {
      return;
    }

    const slugs = getFavorites();
    if (slugs.length === 0) {
      window.localStorage.setItem(flag, '1');
      return;
    }

    syncLocalFavorites(slugs)
      .then((r) => {
        if (r.ok) {
          try {
            window.localStorage.setItem(flag, '1');
          } catch {
            // Ignore — best-effort.
          }
        } else {
          log.warn('FavoritesSync upload failed', r.error);
        }
      })
      .catch((err) => log.warn('FavoritesSync threw', err));
  }, [isLoaded, isSignedIn, user]);

  return null;
}
