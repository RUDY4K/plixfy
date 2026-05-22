import 'server-only';
import { getSupabaseAdmin } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';
import { log } from './logger';

export interface PublicProfileData {
  gamesPlayed: number;
  bestScoresCount: number;
  commentsCount: number;
  favorites: string[];
  topScores: Array<{ gameSlug: string; score: number }>;
  activity: Array<{
    id: number;
    verb: 'scored' | 'commented' | 'liked' | 'favorited';
    gameSlug: string;
    payload: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

/**
 * Load everything we need for /profile/[username] in one trip.
 *
 * Five independent queries fanned out in parallel — they don't depend on
 * each other so Promise.all keeps wall-time at max(query_time) instead of
 * sum. Each falls back to an empty value if the table doesn't exist yet
 * (during local dev with placeholder Supabase keys).
 */
const EMPTY_PROFILE: PublicProfileData = {
  gamesPlayed: 0,
  bestScoresCount: 0,
  commentsCount: 0,
  favorites: [],
  topScores: [],
  activity: [],
};

export async function getUserPublicProfile(
  userId: string,
): Promise<PublicProfileData> {
  if (!isSupabaseConfigured()) return EMPTY_PROFILE;
  const supabase = getSupabaseAdmin();

  const [
    favoritesRes,
    scoresRes,
    commentsCountRes,
    activityRes,
    distinctGamesRes,
  ] = await Promise.all([
    supabase
      .from('favorites')
      .select('game_slug')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('scores')
      .select('game_slug, score')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(50),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('hidden', false),
    supabase
      .from('activity')
      .select('id, verb, game_slug, payload, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('scores')
      .select('game_slug')
      .eq('user_id', userId),
  ]);

  if (favoritesRes.error) log.warn('profile favorites failed', favoritesRes.error.message);
  if (scoresRes.error) log.warn('profile scores failed', scoresRes.error.message);
  if (commentsCountRes.error) log.warn('profile comments count failed', commentsCountRes.error.message);
  if (activityRes.error) log.warn('profile activity failed', activityRes.error.message);

  // Collapse all scores to one row per game (best per game). Done in app
  // code because Supabase's grouped aggregates over the REST API are
  // clunky and this scales fine to <1000 rows per user.
  const bestPerGame = new Map<string, number>();
  for (const r of scoresRes.data ?? []) {
    const slug = r.game_slug as string;
    const score = r.score as number;
    const cur = bestPerGame.get(slug);
    if (cur == null || score > cur) bestPerGame.set(slug, score);
  }
  const topScores = [...bestPerGame.entries()]
    .map(([gameSlug, score]) => ({ gameSlug, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const distinctGames = new Set(
    (distinctGamesRes.data ?? []).map((r) => r.game_slug as string),
  );

  return {
    gamesPlayed: distinctGames.size,
    bestScoresCount: bestPerGame.size,
    commentsCount: commentsCountRes.count ?? 0,
    favorites: (favoritesRes.data ?? []).map((r) => r.game_slug as string),
    topScores,
    activity: (activityRes.data ?? []).map((r) => ({
      id: r.id as number,
      verb: r.verb as 'scored' | 'commented' | 'liked' | 'favorited',
      gameSlug: r.game_slug as string,
      payload: (r.payload as Record<string, unknown> | null) ?? null,
      createdAt: r.created_at as string,
    })),
  };
}
