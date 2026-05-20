import type { NextRequest } from 'next/server';

const CDN_HOST = 'img.gamedistribution.com';
const REFERER = 'https://html5.gamedistribution.com/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Matches: <32-hex-id>.<ext> OR <32-hex-id>-<W>x<H>.<ext>
// Rejects anything else (no traversal, no other hosts via crafted segment).
const FILE_RE = /^[a-f0-9]{32}(-\d{1,4}x\d{1,4})?\.(jpe?g|png|webp)$/i;

const CACHE_HEADERS: Record<string, string> = {
  // Hit browser cache 1 day; CDN/edge cache 7 days; safe to use immutable
  // because the upstream filename is content-addressed (hash + dimensions).
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
};

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/thumb/[file]'>,
): Promise<Response> {
  const { file } = await ctx.params;

  if (!FILE_RE.test(file)) {
    return new Response('Not found', { status: 404 });
  }

  const upstream = `https://${CDN_HOST}/${file}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        'User-Agent': UA,
        Referer: REFERER,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
  } catch {
    clearTimeout(timer);
    return new Response('Upstream timeout', { status: 504 });
  }
  clearTimeout(timer);

  if (!res.ok || !res.body) {
    return new Response('Upstream error', { status: res.status === 404 ? 404 : 502 });
  }

  const headers = new Headers(CACHE_HEADERS);
  const ct = res.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  const cl = res.headers.get('content-length');
  if (cl) headers.set('Content-Length', cl);

  return new Response(res.body, { status: 200, headers });
}
