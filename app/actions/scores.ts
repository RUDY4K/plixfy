'use server';

import { revalidatePath } from 'next/cache';
import { requireDbUser } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

interface SubmitResult {
  ok: boolean;
  error?: string;
  /** Rank on the all-time top-100 after this score, or null if off the board. */
  rank?: number | null;
}

const MAX_REASONABLE_SCORE = 10_000_000;

/**
 * Submit a score to the global leaderboard. Sign-in required.
 *
 * Naïve cheat prevention:
 *   - Hard cap at MAX_REASONABLE_SCORE so a tampered client can't post
 *     `Number.MAX_SAFE_INTEGER`.
 *   - Score must be a positive finite integer.
 *
 * Real-world we'll layer in: server-side replay verification for custom
 * games (Match Quest, Slither Trail, ...) since those run in our own
 * codebase. Embed games stay client-trust-only.
 */
export async function submitScoreToServer(
  gameSlug: string,
  score: number,
): Promise<SubmitResult> {
  if (!gameSlug) return { ok: false, error: 'Missing game.' };
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0) {
    return { ok: false, error: 'Invalid score.' };
  }
  if (score > MAX_REASONABLE_SCORE) {
    log.warn('submitScoreToServer rejected absurd score', { gameSlug, score });
    return { ok: false, error: 'Score out of range.' };
  }

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Sign in to record your score on the global leaderboard.' };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('scores').insert({
    user_id: user.id,
    game_slug: gameSlug,
    score,
  });
  if (error) {
    log.warn('submitScoreToServer insert failed', error.message);
    return { ok: false, error: 'Could not save score.' };
  }

  // Activity row for the homepage feed.
  await supabase.from('activity').insert({
    user_id: user.id,
    verb: 'scored',
    game_slug: gameSlug,
    payload: { score },
  });

  // Look up the new rank (1-indexed; null if off top-100).
  const { data: betterRows } = await supabase
    .from('scores')
    .select('user_id, score')
    .eq('game_slug', gameSlug)
    .gt('score', score);
  const uniqueBetterUsers = new Set((betterRows ?? []).map((r) => r.user_id));
  const rank = uniqueBetterUsers.size + 1;

  revalidatePath(`/games/${gameSlug}`);
  return { ok: true, rank: rank <= 100 ? rank : null };
}
