'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { useIsFavorite } from '@/lib/userStateClient';
import { toggleFavorite as toggleFavoriteServer } from '@/app/actions/favorites';
import { evaluate, getSessionPlays } from '@/lib/achievements';
import { log } from '@/lib/logger';

interface FavoriteButtonProps {
  slug: string;
  /** small for cards, large for detail page header. */
  size?: 'sm' | 'lg';
  /** Stops propagation so clicking the heart inside a GameCard link doesn't navigate. */
  stopPropagation?: boolean;
}

/**
 * Heart toggle backed by localStorage. SSR-safe (renders the empty state
 * during hydration; populates on mount). When placed inside an <a> we
 * intercept the click so the user can favorite without navigating.
 *
 * On every click we re-trigger the .heart-pop spring animation by toggling
 * the class via key change — restartAnim flips each click, forcing React
 * to remount the inner glyph so the keyframe replays.
 */
export default function FavoriteButton({ slug, size = 'sm', stopPropagation = true }: FavoriteButtonProps) {
  const [fav, toggle] = useIsFavorite(slug);
  const { isSignedIn } = useUser();
  const [popKey, setPopKey] = useState(0);
  const firstRender = useRef(true);
  const [, startTransition] = useTransition();

  // Don't play the animation on initial hydration — only when the user
  // actually clicks. We use a ref instead of mount state because we want
  // popKey to advance every click after that.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPopKey((k) => k + 1);
  }, [fav]);

  const dims = size === 'lg' ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-sm';

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggle();
        evaluate({ sessionPlays: getSessionPlays() });
        if (isSignedIn) {
          // Fire-and-forget cross-device sync. localStorage is the source
          // of truth in the UI; this just mirrors to Supabase in the
          // background so other devices and the public profile page see it.
          startTransition(() => {
            toggleFavoriteServer(slug).catch((err) =>
              log.warn('FavoriteButton server sync failed', err),
            );
          });
        }
      }}
      className={`flex shrink-0 items-center justify-center rounded-full border backdrop-blur ${dims} ${
        fav
          ? 'border-rose-500/60 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
          : 'border-neutral-700/70 bg-neutral-950/70 text-neutral-400 hover:border-neutral-500 hover:text-rose-400'
      }`}
    >
      <span key={popKey} aria-hidden="true" className={popKey > 0 ? 'heart-pop' : undefined}>
        {fav ? '♥' : '♡'}
      </span>
    </button>
  );
}
