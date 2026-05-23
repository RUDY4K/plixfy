import type { NextRequest } from 'next/server';
import { LIGHT_GAMES } from '@/games/registry';
import { findTopic, gamesForTopic, TOPIC_BATCH_SIZE } from '@/lib/topics';

/**
 * GET /api/play/{topic}?offset=50&limit=50
 *
 * Returns a paginated slice of LightGameMeta for a topic, used by the
 * client-side "Load more" button on /play/{topic}. SSR ships only the
 * first 50 games to keep the static page payload under Vercel's 19MB
 * pre-rendered limit; this route serves the rest on demand.
 *
 * Response cached on Vercel's edge for 1h (immutable game set per topic).
 */
export const runtime = 'nodejs';

const MAX_LIMIT = 200;

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/play/[topic]'>,
): Promise<Response> {
  const { topic } = await ctx.params;
  const t = findTopic(topic);
  if (!t) {
    return Response.json({ error: 'not_found', topic }, { status: 404 });
  }

  const url = new URL(req.url);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
  const limitRaw = Number.parseInt(url.searchParams.get('limit') ?? String(TOPIC_BATCH_SIZE), 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : TOPIC_BATCH_SIZE));

  const all = gamesForTopic(t, LIGHT_GAMES);
  const slice = all.slice(offset, offset + limit);

  return Response.json(
    {
      games: slice,
      total: all.length,
      offset,
      limit,
      hasMore: offset + slice.length < all.length,
    },
    {
      headers: {
        // 1h on Vercel's edge + 24h SWR. The game registry only changes
        // when we ship new harvest commits, so this can be very cacheable.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
