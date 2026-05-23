#!/usr/bin/env node
// Crawl the live site and report every internal link's HTTP status.
//
// Strategy:
//   1. Seed the queue with /, /sitemap.xml, and every top-level static page.
//   2. For each HTML page fetched, extract every <a href> and <link rel="canonical">
//      that resolves to the same origin. Push unseen ones onto the queue.
//   3. Cap crawl depth — we don't want to walk all 5,000 /games/[slug] pages,
//      so we sample a handful of them via the homepage links and call it good
//      (game pages are validated separately by the sitemap audit pass).
//   4. Fetch sitemap.xml directly and HEAD every URL in it so we catch any
//      route in the sitemap that nothing on the homepage links to.
//   5. Print a categorized report: 2xx counts, 3xx redirects, 4xx broken, 5xx crashed.
//
// Usage: node scripts/audit-links.mjs [origin]
//   origin defaults to https://www.plixfy.com
//
// Output: writes scripts/audit-links.report.json next to this script.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.argv[2] ?? 'https://plixfy.com';
const REPORT_PATH = join(__dirname, 'audit-links.report.json');

// Treat apex (plixfy.com) and www (www.plixfy.com) as the same site. The
// sitemap emits apex URLs; the production deploy serves both. Without this
// the audit silently drops every sitemap URL when ORIGIN is www.
function rootHost(h) {
  return h.replace(/^www\./, '');
}
const ORIGIN_ROOT_HOST = rootHost(new URL(ORIGIN).host);

// Cap how many crawl steps we do. The homepage links to a few dozen pages and
// the topic pages each link to ~50 games — without a cap we'd hit thousands.
const MAX_CRAWL_PAGES = 30;
// Cap how many sitemap URLs we probe. The sitemap has 5,000+ game pages; we
// sample uniformly so we still catch a representative slice of /games/[slug]s.
const SITEMAP_SAMPLE_LIMIT = 80;
// Parallel request budget — Vercel handles bursts fine, but stay polite.
const CONCURRENCY = 12;

/** @type {Map<string, { status: number; via: 'crawl'|'sitemap'; from?: string }>} */
const results = new Map();

/** Same-origin URL string, normalized: strips hash, sorts query. */
function normalize(raw, base) {
  try {
    const u = new URL(raw, base);
    if (rootHost(u.host) !== ORIGIN_ROOT_HOST) return null;
    u.hash = '';
    // Sort query so /play?a=1&b=2 and /play?b=2&a=1 collapse to the same entry.
    const params = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    u.search = '';
    for (const [k, v] of params) u.searchParams.append(k, v);
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchStatus(url, { method = 'GET' } = {}) {
  // Use GET (not HEAD) — some Vercel edges return 405 for HEAD on prerendered
  // pages, and we want to read the HTML body for crawl candidates anyway.
  // `redirect: 'follow'` so apex→www and any other same-host hops collapse
  // into one final status — we care whether the link works end-to-end, not
  // about counting the redirect chain.
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'user-agent': 'plixfy-audit-bot/1.0' },
  });
  return {
    status: res.status,
    contentType: res.headers.get('content-type') ?? '',
    finalUrl: res.url,
    res,
  };
}

function extractLinks(html, baseUrl) {
  const out = new Set();
  // <a href="...">  — quote-tolerant, attribute order-tolerant.
  const aRe = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = aRe.exec(html)) !== null) {
    const n = normalize(m[1], baseUrl);
    if (n) out.add(n);
  }
  return [...out];
}

async function extractSitemapUrls() {
  try {
    const { res, status } = await fetchStatus(`${ORIGIN}/sitemap.xml`);
    if (status !== 200) return [];
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    // Accept apex + www variants so the audit still works regardless of which
    // host the sitemap emits vs which the audit was invoked against.
    return urls.filter((u) => {
      try {
        return rootHost(new URL(u).host) === ORIGIN_ROOT_HOST;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

async function runQueue(queue, label) {
  const inFlight = new Set();
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < queue.length) {
      const idx = nextIdx++;
      const item = queue[idx];
      if (results.has(item.url)) continue;
      try {
        const { status, contentType, res } = await fetchStatus(item.url);
        results.set(item.url, { status, via: label, from: item.from });
        // Only crawl deeper if (a) we still have budget, (b) the response is
        // HTML, and (c) the page came back 2xx so the body is meaningful.
        if (
          label === 'crawl' &&
          item.depth < 2 &&
          status >= 200 &&
          status < 300 &&
          contentType.includes('text/html') &&
          queue.length < MAX_CRAWL_PAGES
        ) {
          const body = await res.text();
          for (const link of extractLinks(body, item.url)) {
            if (results.has(link)) continue;
            if (queue.find((q) => q.url === link)) continue;
            queue.push({ url: link, depth: item.depth + 1, from: item.url });
            if (queue.length >= MAX_CRAWL_PAGES) break;
          }
        } else {
          // Drain the response body to free the connection.
          await res.text().catch(() => undefined);
        }
      } catch {
        results.set(item.url, { status: 0, via: label, from: item.from });
      }
    }
  }
  for (let i = 0; i < CONCURRENCY; i++) inFlight.add(worker());
  await Promise.all(inFlight);
}

function bucketize() {
  const buckets = { ok: [], redirect: [], notFound: [], serverErr: [], network: [], other: [] };
  for (const [url, info] of results) {
    const row = { url, ...info };
    if (info.status === 0) buckets.network.push(row);
    else if (info.status >= 500) buckets.serverErr.push(row);
    else if (info.status === 404) buckets.notFound.push(row);
    else if (info.status >= 400) buckets.other.push(row);
    else if (info.status >= 300) buckets.redirect.push(row);
    else if (info.status >= 200) buckets.ok.push(row);
    else buckets.other.push(row);
  }
  return buckets;
}

function print(buckets) {
  console.log(`\n=== Plixfy link audit — ${ORIGIN} ===`);
  console.log(`Crawled ${results.size} unique URLs\n`);
  console.log(`  OK (2xx):       ${buckets.ok.length}`);
  console.log(`  Redirect (3xx): ${buckets.redirect.length}`);
  console.log(`  Not found (404):${buckets.notFound.length}`);
  console.log(`  Server err (5xx):${buckets.serverErr.length}`);
  console.log(`  Other 4xx:      ${buckets.other.length}`);
  console.log(`  Network errors: ${buckets.network.length}`);

  function dump(title, rows) {
    if (rows.length === 0) return;
    console.log(`\n--- ${title} ---`);
    for (const r of rows) {
      console.log(`  ${r.status}  ${r.url}` + (r.from ? `   (from ${r.from})` : ''));
    }
  }
  dump('404 Not Found', buckets.notFound);
  dump('5xx Server Error', buckets.serverErr);
  dump('Other 4xx', buckets.other);
  dump('Network errors', buckets.network);
  dump('Redirects', buckets.redirect);
}

async function main() {
  // Seed the queue with the homepage + every known static landing page. Topic
  // pages are seeded explicitly so we get them even if no homepage card links to them.
  const seeds = [
    '/',
    '/games',
    '/favorites',
    '/about',
    '/privacy',
    '/terms',
    '/profile',
    '/play/io-games',
    '/play/multiplayer-games',
    '/play/unblocked-games',
    '/play/shooting-games',
    '/play/racing-games',
    '/play/car-games',
    '/play/puzzle-games',
    '/play/action-games',
    '/play/sports-games',
    '/play/stickman-games',
    '/play/zombie-games',
    '/play/cooking-games',
  ];

  const crawlQueue = seeds.map((p) => ({ url: `${ORIGIN}${p}`, depth: 0 }));
  await runQueue(crawlQueue, 'crawl');

  // Now probe the sitemap so we catch any route we wouldn't otherwise reach.
  // Sample game URLs uniformly to keep the run quick — full 5k probes are
  // overkill, what matters is "does the /games/[slug] route exist".
  const sitemapUrls = await extractSitemapUrls();
  const gameUrls = sitemapUrls.filter((u) => u.includes('/games/'));
  const nonGameUrls = sitemapUrls.filter((u) => !u.includes('/games/'));
  const step = Math.max(1, Math.floor(gameUrls.length / SITEMAP_SAMPLE_LIMIT));
  const sampledGames = gameUrls.filter((_, i) => i % step === 0).slice(0, SITEMAP_SAMPLE_LIMIT);

  const sitemapQueue = [...nonGameUrls, ...sampledGames].map((u) => ({ url: u, depth: 99 }));
  await runQueue(sitemapQueue, 'sitemap');

  const buckets = bucketize();
  print(buckets);

  const report = {
    origin: ORIGIN,
    generatedAt: new Date().toISOString(),
    totals: {
      crawled: results.size,
      ok: buckets.ok.length,
      redirect: buckets.redirect.length,
      notFound: buckets.notFound.length,
      serverErr: buckets.serverErr.length,
      other4xx: buckets.other.length,
      network: buckets.network.length,
    },
    notFound: buckets.notFound,
    serverErr: buckets.serverErr,
    other4xx: buckets.other,
    network: buckets.network,
    redirects: buckets.redirect,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${REPORT_PATH}`);

  // Non-zero exit if anything is broken so CI can gate on this.
  const hasBreakage =
    buckets.notFound.length + buckets.serverErr.length + buckets.other.length + buckets.network.length > 0;
  process.exit(hasBreakage ? 1 : 0);
}

main().catch((err) => {
  console.error('audit-links failed:', err);
  process.exit(2);
});
