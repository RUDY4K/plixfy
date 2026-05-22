/* Plixfy service worker — v1
 *
 * Strategy
 *   • Precache the shell: /, /offline.html, manifest, icons.
 *   • Static assets (/_next/static, /assets, /icons): cache-first.
 *   • HTML navigations: network-first with offline.html fallback.
 *   • Everything else: pass through to network.
 *
 * Bump CACHE_VERSION whenever we change cached file shapes so old
 * caches are cleared on activation.
 */

const CACHE_VERSION = 'plixfy-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    // Only cache successful, basic-CORS responses to avoid poisoning the
    // cache with opaque cross-origin redirects.
    if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return hit || Response.error();
  }
}

async function networkFirstHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept cross-origin requests (AdSense, GameDistribution,
  // Clerk, Supabase, etc.) — let the browser handle them directly so
  // we don't risk breaking auth headers or third-party CSP.
  if (url.origin !== self.location.origin) return;

  // Never intercept API or auth routes — they must hit the network so
  // login/server-actions stay correct.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-up')
  ) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHtml(request));
  }
});
