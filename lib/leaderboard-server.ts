import 'server-only';
import { getSupabaseAdmin } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';
import { log } from './logger';

type RawScoreRow = {
  user_id: string;
  score: number;
  created_at: string;
  users:
    | { username: string; avatar_url: string | null }
    | Array<{ username: string; avatar_url: string | null }>
    | null;
};

export interface GlobalScoreEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  achievedAt: string;
}

export interface GlobalLeaderboardResult {
  weekly: GlobalScoreEntry[];
  allTime: GlobalScoreEntry[];
  /** Caller's best rank (1-indexed) on the all-time list, or null. */
  myRank: number | null;
  /** Caller's best score, or null. */
  myBest: number | null;
}

const TOP_N = 100;

function rankRows(
  rows: Array<{
    user_id: string;
    best_score: number;
    achieved_at: string;
    username: string;
    avatar_url: string | null;
  }>,
): GlobalScoreEntry[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    score: r.best_score,
    achievedAt: r.achieved_at,
  }));
}

/**
 * Get global top-100 for a game, split into weekly + all-time slices,
 * plus the viewer's own rank if signed in.
 *
 * Implementation: SELECT * FROM scores WHERE game_slug=... ORDER BY score DESC.
 * We then collapse to one row per user (their best) in app code. For 100
 * rows this is essentially free and avoids any window-function gymnastics
 * Supabase Postgres might surface poorly through the SDK.
 */
export async function getGlobalLeaderboard(
  gameSlug: string,
  viewerUserId: string | null,
): Promise<GlobalLeaderboardResult> {
  if (!isSupabaseConfigured()) {
    return { weekly: [], allTime: [], myRank: null, myBest: null };
  }
  const supabase = getSupabaseAdmin();

  // Pull more than TOP_N raw scores so we can collapse duplicates per user
  // and still end up with ~TOP_N unique users on the board.
  const RAW_LIMIT = TOP_N * 4;
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allRes, weeklyRes] = await Promise.all([
    supabase
      .from('scores')
      .select('user_id, score, created_at, users:users(username, avatar_url)')
      .eq('game_slug', gameSlug)
      .order('score', { ascending: false })
      .limit(RAW_LIMIT),
    supabase
      .from('scores')
      .select('user_id, score, created_at, users:users(username, avatar_url)')
      .eq('game_slug', gameSlug)
      .gte('created_at', weekAgoIso)
      .order('score', { ascending: false })
      .limit(RAW_LIMIT),
  ]);

  if (allRes.error) log.warn('getGlobalLeaderboard all failed', allRes.error.message);
  if (weeklyRes.error) log.warn('getGlobalLeaderboard weekly failed', weeklyRes.error.message);

  function flatten(rawData: unknown): GlobalScoreEntry[] {
    const rows = (rawData ?? []) as RawScoreRow[];
    if (rows.length === 0) return [];
    const best = new Map<
      string,
      {
        user_id: string;
        best_score: number;
        achieved_at: string;
        username: string;
        avatar_url: string | null;
      }
    >();
    for (const r of rows) {
      const user = Array.isArray(r.users) ? (r.users[0] ?? null) : (r.users ?? null);
      const username = user?.username ?? 'unknown';
      const avatarUrl = user?.avatar_url ?? null;
      const existing = best.get(r.user_id);
      if (!existing || r.score > existing.best_score) {
        best.set(r.user_id, {
          user_id: r.user_id,
          best_score: r.score,
          achieved_at: r.created_at,
          username,
          avatar_url: avatarUrl,
        });
      }
    }
    return rankRows([...best.values()].sort((a, b) => b.best_score - a.best_score).slice(0, TOP_N));
  }

  const allTime = flatten(allRes.data);
  const weekly = flatten(weeklyRes.data);

  let myRank: number | null = null;
  let myBest: number | null = null;
  if (viewerUserId) {
    const mine = allTime.find((e) => e.userId === viewerUserId);
    if (mine) {
      myRank = mine.rank;
      myBest = mine.score;
    } else {
      // Not in top 100 — fetch their personal best so we can show "Your best: X".
      const { data: mineRow } = await supabase
        .from('scores')
        .select('score')
        .eq('game_slug', gameSlug)
        .eq('user_id', viewerUserId)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mineRow) myBest = mineRow.score;
    }
  }

  return { weekly, allTime, myRank, myBest };
}
