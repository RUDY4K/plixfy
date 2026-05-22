import { NextResponse } from 'next/server';
import { getRecentActivity } from '@/lib/activity-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/activity?limit=20 — polled every 15s by the ActivityFeed
 * component for the homepage "🔥 Recent Activity" panel. Public read,
 * no auth required (RLS already allows anon SELECT on activity).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(50, Math.floor(limitRaw)) : 20;
  const items = await getRecentActivity(limit).catch(() => []);
  return NextResponse.json({ items }, {
    headers: {
      // Browser caches for 5s — but our poll cadence is 15s so users get fresh data.
      // Edge / CDN caches for 5s to dampen request volume during traffic spikes.
      'Cache-Control': 'public, s-maxage=5, max-age=5',
    },
  });
}
