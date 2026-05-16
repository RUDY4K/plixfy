'use client';

import { useIsFavorite } from '@/lib/userStateClient';

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
 */
export default function FavoriteButton({ slug, size = 'sm', stopPropagation = true }: FavoriteButtonProps) {
  const [fav, toggle] = useIsFavorite(slug);

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
      }}
      className={`flex shrink-0 items-center justify-center rounded-full border backdrop-blur transition ${dims} ${
        fav
          ? 'border-rose-500/60 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
          : 'border-neutral-700/70 bg-neutral-950/70 text-neutral-400 hover:border-neutral-500 hover:text-rose-400'
      }`}
    >
      <span aria-hidden="true">{fav ? '♥' : '♡'}</span>
    </button>
  );
}
