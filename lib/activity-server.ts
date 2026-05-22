import 'server-only';
import { getSupabaseAdmin } from './supabase/admin';
import { log } from './logger';

export interface ActivityItem {
  id: number;
  verb: 'scored' | 'commented' | 'liked' | 'favorited';
  gameSlug: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
}

type RawActivityRow = {
  id: number;
  verb: string;
  game_slug: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  users: { username: string; avatar_url: string | null } | Array<{ username: string; avatar_url: string | null }> | null;
};

/**
 * Recent global activity feed. Pulls the last N rows across all users.
 *
 * Designed to be cheap: index on (created_at DESC) means the query is a
 * pure index-walk. We keep limit small (defaults to 20) — the feed is
 * for "happening now" vibe, not history.
 */
export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('activity')
    .select('id, verb, game_slug, payload, created_at, users:users(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    log.warn('getRecentActivity failed', error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as RawActivityRow[];
  return rows.map((r) => {
    const user = Array.isArray(r.users) ? (r.users[0] ?? null) : (r.users ?? null);
    return {
      id: r.id,
      verb: r.verb as ActivityItem['verb'],
      gameSlug: r.game_slug,
      payload: r.payload ?? null,
      createdAt: r.created_at,
      username: user?.username ?? 'unknown',
      avatarUrl: user?.avatar_url ?? null,
    };
  });
}
