const NEWS_IMAGE_HOSTS = new Set([
  "assetsio.gnwcdn.com",
  "blog.playstation.com",
  "cdn.mos.cms.futurecdn.net",
  "i.ytimg.com",
  "www.gamespot.com",
  "www.gematsu.com",
  "www.videogameschronicle.com",
]);

export {
  MAX_NEWS_IMAGE_BYTES,
  readNewsImageBytes,
} from "@/lib/newsImageStream.mjs";

export function newsImageHref(slug: string): string {
  return `/api/news-image/${encodeURIComponent(slug)}`;
}

export function parseAllowedNewsImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      !NEWS_IMAGE_HOSTS.has(url.hostname.toLowerCase())
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function isAllowedNewsImageUrl(value: string): boolean {
  return parseAllowedNewsImageUrl(value) !== null;
}

export function newsImageFallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="Plixfy">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070712"/>
      <stop offset="0.55" stop-color="#271044"/>
      <stop offset="1" stop-color="#101b38"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#7657ff" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#7657ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <g transform="translate(510 232)">
    <rect width="180" height="180" rx="52" fill="#121225" stroke="#ffffff" stroke-opacity="0.14" stroke-width="4"/>
    <path d="M50 110c10-42 30-62 40-62s30 20 40 62" fill="none" stroke="#00e5ff" stroke-width="18" stroke-linecap="round"/>
    <circle cx="67" cy="92" r="10" fill="#ff2d8b"/>
    <circle cx="113" cy="82" r="10" fill="#7657ff"/>
  </g>
  <text x="600" y="480" text-anchor="middle" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="58" font-weight="900" letter-spacing="5">PLIXFY</text>
  <text x="600" y="530" text-anchor="middle" fill="#a9a7bd" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" letter-spacing="3">GAMING NEWS</text>
</svg>`;
}
