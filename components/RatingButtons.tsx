'use client';

import { setMyVote, useMyVote, useRating } from '@/lib/ratings';

interface RatingButtonsProps {
  slug: string;
  /** compact = small chip for cards; default = full bar on game-detail. */
  variant?: 'default' | 'compact';
}

/**
 * Thumb-up / thumb-down toggle pair + "N% liked" copy. The synthetic
 * baseline means the percentage is non-zero on day one even before
 * anyone votes; clicking a thumb nudges the user's own vote and the
 * summary updates immediately.
 */
export default function RatingButtons({ slug, variant = 'default' }: RatingButtonsProps) {
  const vote = useMyVote(slug);
  const { percentLiked, total } = useRating(slug);

  const upActive = vote === 'up';
  const downActive = vote === 'down';

  if (variant === 'compact') {
    return (
      <span
        title={percentLiked != null ? `${percentLiked}% liked · ${total.toLocaleString()} votes` : 'New game'}
        className="inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur"
      >
        <span aria-hidden="true">👍</span>
        <span>{percentLiked != null ? `${percentLiked}%` : 'NEW'}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setMyVote(slug, 'up');
        }}
        aria-pressed={upActive}
        aria-label={upActive ? 'Remove thumbs up' : 'Thumbs up'}
        className={`flex h-9 items-center gap-1 rounded-md px-3 text-sm font-semibold transition ${
          upActive
            ? 'bg-emerald-500 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
        }`}
      >
        <span aria-hidden="true">👍</span>
        <span>Like</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setMyVote(slug, 'down');
        }}
        aria-pressed={downActive}
        aria-label={downActive ? 'Remove thumbs down' : 'Thumbs down'}
        className={`flex h-9 items-center gap-1 rounded-md px-3 text-sm font-semibold transition ${
          downActive
            ? 'bg-rose-500 text-neutral-950'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
        }`}
      >
        <span aria-hidden="true">👎</span>
      </button>
      <span className="ml-1 text-xs text-neutral-400">
        {percentLiked != null ? (
          <>
            <span className="font-bold text-white">{percentLiked}%</span> liked
            <span className="ml-1 text-neutral-500">· {total.toLocaleString()} votes</span>
          </>
        ) : (
          <span className="text-neutral-500">Be the first to rate</span>
        )}
      </span>
    </div>
  );
}
