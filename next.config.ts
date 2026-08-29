import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://ep2.adtrafficquality.google",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://*.playgama.com https://playgama.com https://picsum.photos https://fastly.picsum.photos https://*.google-analytics.com https://www.googletagmanager.com https://*.googleusercontent.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://ep1.adtrafficquality.google",
  "frame-src 'self' https://playgama.com https://*.playgama.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google",
  "media-src 'self' blob: https://static.playgama.com https://*.playgama.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
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
        hostname: "static.playgama.com",
        pathname: "/p-img/**",
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
      // ملاحظة: تحويلات الأخبار ذات الـ slugs العربية القديمة تُعالَج في src/proxy.ts
      // وليس هنا — next.config.ts redirects لا تطابق صحيح مع أحرف عربية في المسار
      // (يسبب TypeError: Invalid character in header content على مستوى ISR cache tags).
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
