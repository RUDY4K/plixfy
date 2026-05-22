import 'server-only';
import { getSupabaseAdmin } from './supabase/admin';
import { log } from './logger';

export interface ServerRating {
  ups: number;
  downs: number;
  total: number;
  percentLiked: number | null;
  myVote: 'up' | 'down' | null;
}

const EMPTY: ServerRating = {
  ups: 0,
  downs: 0,
  total: 0,
  percentLiked: null,
  myVote: null,
};

/**
 * Fetch the real, DB-backed rating for a game. The component falls back
 * to the synthetic-baseline `useRating()` hook in `lib/ratings.ts` when
 * the server-rendered numbers are empty (cold-start games).
 */
export async function getGameRating(
  gameSlug: string,
  viewerUserId: string | null,
): Promise<ServerRating> {
  const supabase = getSupabaseAdmin();

  // Single query: select all likes for this slug. We tally in app code so
  // we get the viewer's own vote in the same round-trip.
  const { data, error } = await supabase
    .from('likes')
    .select('user_id, vote')
    .eq('game_slug', gameSlug);

  if (error) {
    log.warn('getGameRating failed', { gameSlug, error: error.message });
    return EMPTY;
  }
  if (!data || data.length === 0) return EMPTY;

  let ups = 0;
  let downs = 0;
  let myVote: 'up' | 'down' | null = null;
  for (const r of data) {
    if (r.vote === 'up') ups += 1;
    if (r.vote === 'down') downs += 1;
    if (viewerUserId && r.user_id === viewerUserId) {
      myVote = r.vote as 'up' | 'down';
    }
  }
  const total = ups + downs;
  const percentLiked = total >= 3 ? Math.round((100 * ups) / total) : null;
  return { ups, downs, total, percentLiked, myVote };
}

/**
 * Batch fetch ratings for many game slugs in one query. Used by the
 * homepage "Most liked" sort and the catalog grid.
 */
export async function getGameRatingsMap(
  gameSlugs: readonly string[],
): Promise<Map<string, { percentLiked: number | null; total: number }>> {
  const result = new Map<string, { percentLiked: number | null; total: number }>();
  if (gameSlugs.length === 0) return result;

  const supabase = getSupabaseAdmin();
  // `game_ratings` is a view — not declared in our hand-rolled Database
  // types — so the typed client returns `never[]`. Cast through unknown.
  const { data, error } = await (supabase as unknown as {
    from: (rel: string) => {
      select: (cols: string) => {
        in: (col: string, vals: string[]) => Promise<{ data: Array<{ game_slug: string; percent_liked: number | null; total: number | null }> | null; error: { message: string } | null }>;
      };
    };
  })
    .from('game_ratings')
    .select('game_slug, percent_liked, total')
    .in('game_slug', gameSlugs as string[]);

  if (error) {
    log.warn('getGameRatingsMap failed', error.message);
    return result;
  }
  for (const r of data ?? []) {
    result.set(r.game_slug, {
      percentLiked: r.percent_liked ?? null,
      total: r.total ?? 0,
    });
  }
  return result;
}
