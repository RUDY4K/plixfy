'use client';

import { setMyVote, useMyVote, useRating } from '@/lib/ratings';

interface RatingButtonsProps {
  slug: string;
  /** compact = small chip for cards; default = full bar on game-detail. */
  variant?: 'default' | 'compact';
}

/**
 * Thumb-up/thumb-down toggle pair + "N% liked" copy. LocalStorage-only —
 * each visitor's vote stays on their device, and the displayed percentage
 * blends their vote with a synthetic baseline from `useRating()` so
 * day-one games still read "94% liked" instead of "no votes".
 */
export default function RatingButtons({ slug, variant = 'default' }: RatingButtonsProps) {
  const vote = useMyVote(slug);
  const display = useRating(slug);

  function flip(target: 'up' | 'down') {
    setMyVote(slug, target);
  }

  const upActive = vote === 'up';
  const downActive = vote === 'down';

  if (variant === 'compact') {
    return (
      <span
        title={
          display.percentLiked != null
            ? `${display.percentLiked}% liked · ${display.total.toLocaleString()} votes`
            : 'New game'
        }
        className="inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur"
      >
        <span aria-hidden="true">👍</span>
        <span>{display.percentLiked != null ? `${display.percentLiked}%` : 'NEW'}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          flip('up');
        }}
        aria-pressed={upActive}
        aria-label={upActive ? 'Remove thumbs up' : 'Thumbs up'}
        className={`flex h-9 items-center gap-1 rounded-md px-3 text-sm font-semibold transition ${
          upActive
            ? 'bg-emerald-500 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-cyan-300'
        }`}
      >
        <span aria-hidden="true">👍</span>
        <span>Like</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          flip('down');
        }}
        aria-pressed={downActive}
        aria-label={downActive ? 'Remove thumbs down' : 'Thumbs down'}
        className={`flex h-9 items-center gap-1 rounded-md px-3 text-sm font-semibold transition ${
          downActive
            ? 'bg-rose-500 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-cyan-300'
        }`}
      >
        <span aria-hidden="true">👎</span>
      </button>
      <span className="ml-1 text-xs text-neutral-400">
        {display.percentLiked != null ? (
          <>
            <span className="font-bold text-white">{display.percentLiked}%</span> liked
            <span className="ml-1 text-neutral-500">· {display.total.toLocaleString()} votes</span>
          </>
        ) : (
          <span className="text-neutral-500">Be the first to rate</span>
        )}
      </span>
    </div>
  );
}
