'use server';

import { revalidatePath } from 'next/cache';
import { requireDbUser } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

interface ActionResult {
  ok: boolean;
  error?: string;
  newVote?: 'up' | 'down' | null;
}

/**
 * Server-action toggle: same vote clears, different vote replaces.
 * Returns the new vote state so the client can reconcile without a refetch.
 */
export async function setGameVote(
  gameSlug: string,
  vote: 'up' | 'down',
): Promise<ActionResult> {
  if (!gameSlug) return { ok: false, error: 'Missing game.' };

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Please sign in to vote.' };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('likes')
    .select('vote')
    .eq('user_id', user.id)
    .eq('game_slug', gameSlug)
    .maybeSingle();

  let newVote: 'up' | 'down' | null;
  if (existing && existing.vote === vote) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('game_slug', gameSlug);
    if (error) {
      log.warn('setGameVote delete failed', error.message);
      return { ok: false, error: 'Could not update vote.' };
    }
    newVote = null;
  } else {
    const { error } = await supabase
      .from('likes')
      .upsert(
        { user_id: user.id, game_slug: gameSlug, vote },
        { onConflict: 'user_id,game_slug' },
      );
    if (error) {
      log.warn('setGameVote upsert failed', error.message);
      return { ok: false, error: 'Could not update vote.' };
    }
    newVote = vote;
  }

  // Activity row only on the affirmative toggle (not when clearing).
  if (newVote === 'up') {
    await supabase.from('activity').insert({
      user_id: user.id,
      verb: 'liked',
      game_slug: gameSlug,
    });
  }

  revalidatePath(`/games/${gameSlug}`);
  return { ok: true, newVote };
}
