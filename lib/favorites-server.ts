import 'server-only';
import { getSupabaseAdmin } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';
import { log } from './logger';

/**
 * Fetch the signed-in user's favorited game slugs. Used by SSR-rendered
 * surfaces that need to render the heart-filled state without flashing.
 */
export async function getFavoriteSlugsForUser(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('favorites')
    .select('game_slug')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    log.warn('getFavoriteSlugsForUser failed', { userId, error: error.message });
    return [];
  }
  return (data ?? []).map((r) => r.game_slug as string);
}
