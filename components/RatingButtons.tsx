'use client';

import { useState, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { setMyVote, useMyVote, useRating } from '@/lib/ratings';
import { setGameVote } from '@/app/actions/ratings';
import type { ServerRating } from '@/lib/ratings-server';

interface RatingButtonsProps {
  slug: string;
  /** compact = small chip for cards; default = full bar on game-detail. */
  variant?: 'default' | 'compact';
  /**
   * Server-rendered rating from Supabase. When provided + non-empty, we
   * prefer it over the localStorage/synthetic baseline. Optional so the
   * compact variant can stay zero-network on grid cards.
   */
  serverRating?: ServerRating;
}

/**
 * Thumb-up/thumb-down toggle pair + "N% liked" copy.
 *
 * Three vote sources blended in this order of preference:
 *   1. Signed-in user's vote in Supabase (passed via serverRating.myVote)
 *      with local optimistic overrides while the server action is pending.
 *   2. Anonymous user's vote in localStorage (legacy `useMyVote` hook).
 *
 * Aggregate "N% liked": real DB count when serverRating.total > 0, else
 * the synthetic baseline from `useRating()` so day-one games still read
 * "94% liked" instead of "no votes".
 */
export default function RatingButtons({ slug, variant = 'default', serverRating }: RatingButtonsProps) {
  const { isSignedIn } = useUser();
  const localVote = useMyVote(slug);
  const local = useRating(slug);
  const [optimistic, setOptimistic] = useState<{ vote: 'up' | 'down' | null; ups: number; downs: number } | null>(null);
  const [, startTransition] = useTransition();

  const hasServerData = !!serverRating && serverRating.total > 0;
  const effectiveServer = serverRating ?? { ups: 0, downs: 0, total: 0, percentLiked: null, myVote: null };

  // Pick which world we live in for the active vote display.
  const vote: 'up' | 'down' | null =
    optimistic?.vote !== undefined
      ? optimistic.vote
      : isSignedIn
        ? effectiveServer.myVote
        : localVote;

  // For the % display, prefer server numbers if any exist, else local.
  const display = (() => {
    if (hasServerData) {
      const ups = optimistic?.ups ?? effectiveServer.ups;
      const downs = optimistic?.downs ?? effectiveServer.downs;
      const total = ups + downs;
      const percentLiked = total >= 3 ? Math.round((100 * ups) / total) : null;
      return { percentLiked, total };
    }
    return { percentLiked: local.percentLiked, total: local.total };
  })();

  function flip(target: 'up' | 'down') {
    // Always update localStorage so anon users still see their vote
    // remembered next visit; harmless duplicate when signed in.
    setMyVote(slug, target);

    if (isSignedIn) {
      // Optimistic UI math against the *server-known* current state.
      const wasUp = (vote ?? null) === 'up';
      const wasDown = (vote ?? null) === 'down';
      const nextVote: 'up' | 'down' | null = vote === target ? null : target;
      const baseUps = optimistic?.ups ?? effectiveServer.ups;
      const baseDowns = optimistic?.downs ?? effectiveServer.downs;
      const nextUps = Math.max(
        0,
        baseUps - (wasUp ? 1 : 0) + (nextVote === 'up' ? 1 : 0),
      );
      const nextDowns = Math.max(
        0,
        baseDowns - (wasDown ? 1 : 0) + (nextVote === 'down' ? 1 : 0),
      );
      setOptimistic({ vote: nextVote, ups: nextUps, downs: nextDowns });
      startTransition(async () => {
        const r = await setGameVote(slug, target);
        // On error, clear optimistic so we fall back to server truth.
        if (!r.ok) setOptimistic(null);
      });
    }
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
          flip('down');
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
