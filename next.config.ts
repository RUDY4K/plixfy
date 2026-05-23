import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Canonical-host redirect: apex (plixfy.com) → www.plixfy.com.
      //
      // Google was indexing both hosts (e.g. `https://plixfy.com/games/uphill-truck`
      // showed up in SERP) which causes duplicate-content dilution and splits
      // link equity. A 301 tells crawlers "this is permanent — consolidate
      // signals on the destination" so they drop the apex from the index.
      //
      // `has` host matcher must be anchored — without ^…$ the regex would
      // also match `www.plixfy.com` as a substring of itself, producing
      // an infinite redirect loop. The `\\.` escapes the dot so it doesn't
      // accept other chars.
      //
      // IMPORTANT: this only fires when the apex domain actually serves
      // the Next.js app. If the Vercel dashboard has `plixfy.com` set as
      // "Redirect to www.plixfy.com" at the platform level, that 307 fires
      // first and this rule never runs. To make this 301 take effect:
      //   Vercel → Project → Settings → Domains → plixfy.com →
      //   change to "No redirect" (or "Serve to this domain"). The Next.js
      //   redirect below then handles apex → www at our chosen status code.
      {
        source: "/:path*",
        has: [{ type: "host", value: "^plixfy\\.com$" }],
        destination: "https://www.plixfy.com/:path*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
