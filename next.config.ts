import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://ep2.adtrafficquality.google",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://*.playgama.com https://playgama.com https://picsum.photos https://fastly.picsum.photos https://*.google-analytics.com https://www.googletagmanager.com",
  "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://ep1.adtrafficquality.google",
  "frame-src 'self' https://playgama.com https://*.playgama.com https://html5.gamedistribution.com https://html5.gamemonetize.co https://html5.gamemonetize.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    qualities: [60, 70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "playgama.com",
      },
      {
        protocol: "https",
        hostname: "**.playgama.com",
      },
      {
        protocol: "https",
        hostname: "img.gamedistribution.com",
      },
      {
        protocol: "https",
        hostname: "img.gamemonetize.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "^plixfy\\.com$" }],
        destination: "https://www.plixfy.com/:path*",
        statusCode: 301,
      },
      // بنية الموقع القديم كانت /games/<slug> — لا شيء منها موجود في الكتالوج الحالي
      {
        source: "/games/:path*",
        destination: "/all-games",
        statusCode: 301,
      },
      {
        source: "/play/car-games",
        destination: "/category/racing",
        statusCode: 301,
      },
      // slugs أخبار قديمة كانت تحتوي أحرفاً عربية بالخطأ — استُبدلت بـ slugs إنجليزية نظيفة
      {
        source: "/news/halo-campaign-evolved-العودة-المنتظرة",
        destination: "/news/halo-campaign-evolved-returns-after-25-years",
        statusCode: 301,
      },
      {
        source: "/en/news/halo-campaign-evolved-العودة-المنتظرة",
        destination: "/en/news/halo-campaign-evolved-returns-after-25-years",
        statusCode: 301,
      },
      {
        source: "/news/فضيحة-blizzard-مدير-مباراة-يخالف-القوانين",
        destination: "/news/blizzard-investigates-warcraft-game-master-abuse",
        statusCode: 301,
      },
      {
        source: "/en/news/فضيحة-blizzard-مدير-مباراة-يخالف-القوانين",
        destination: "/en/news/blizzard-investigates-warcraft-game-master-abuse",
        statusCode: 301,
      },
      {
        source: "/news/zelda-ocarina-time-يعود-switch-2-الريميك",
        destination: "/news/zelda-ocarina-of-time-remake-switch-2",
        statusCode: 301,
      },
      {
        source: "/en/news/zelda-ocarina-time-يعود-switch-2-الريميك",
        destination: "/en/news/zelda-ocarina-of-time-remake-switch-2",
        statusCode: 301,
      },
      {
        source: "/news/xbox-يحضر-ألعاب-جنة-الأصلية-للكمبيوتر",
        destination: "/news/xbox-brings-classic-games-to-pc",
        statusCode: 301,
      },
      {
        source: "/en/news/xbox-يحضر-ألعاب-جنة-الأصلية-للكمبيوتر",
        destination: "/en/news/xbox-brings-classic-games-to-pc",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
