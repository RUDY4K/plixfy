'use server';

import { revalidatePath } from 'next/cache';
import { requireDbUser } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

interface Result {
  ok: boolean;
  error?: string;
}

const MAX_SYNC = 200;

/**
 * Toggle / add / remove / bulk-sync favorites for the signed-in user.
 *
 * The `toggleFavorite` action mirrors what the FavoriteButton needs in
 * the common path; bulk-sync is used once on first sign-in to copy any
 * localStorage favorites the user accumulated as anonymous over to their
 * account.
 */
export async function toggleFavorite(slug: string): Promise<Result & { isFavorite?: boolean }> {
  if (!slug) return { ok: false, error: 'Missing game.' };

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Sign in to save favorites across devices.' };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('game_slug', slug)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('game_slug', slug);
    if (error) {
      log.warn('toggleFavorite delete failed', error.message);
      return { ok: false, error: 'Could not update favorite.' };
    }
    revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
    return { ok: true, isFavorite: false };
  }

  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    game_slug: slug,
  });
  if (error) {
    log.warn('toggleFavorite insert failed', error.message);
    return { ok: false, error: 'Could not update favorite.' };
  }

  await supabase.from('activity').insert({
    user_id: user.id,
    verb: 'favorited',
    game_slug: slug,
  });

  revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
  return { ok: true, isFavorite: true };
}

/**
 * Sync a list of localStorage-only favorites to the user's Supabase row.
 * Idempotent via ON CONFLICT DO NOTHING (upsert with ignoreDuplicates).
 */
export async function syncLocalFavorites(slugs: string[]): Promise<Result> {
  if (!Array.isArray(slugs) || slugs.length === 0) return { ok: true };
  const cleaned = [...new Set(slugs.filter((s) => typeof s === 'string' && s.length > 0))].slice(
    0,
    MAX_SYNC,
  );
  if (cleaned.length === 0) return { ok: true };

  let user;
  try {
    user = await requireDbUser();
  } catch {
    return { ok: false, error: 'Not signed in.' };
  }

  const supabase = getSupabaseAdmin();
  const rows = cleaned.map((game_slug) => ({ user_id: user.id, game_slug }));
  const { error } = await supabase
    .from('favorites')
    .upsert(rows, { onConflict: 'user_id,game_slug', ignoreDuplicates: true });
  if (error) {
    log.warn('syncLocalFavorites failed', error.message);
    return { ok: false, error: 'Could not sync favorites.' };
  }

  revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
  return { ok: true };
}
