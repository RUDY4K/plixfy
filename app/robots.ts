import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

/**
 * robots.txt rules.
 *
 * - `/profile` and `/favorites` are per-user views with no SEO value
 *   (also marked `robots: { index: false }` in their metadata as belt
 *   AND braces).
 * - `/api/` and the dev-only `/test-phaser` page are blocked outright.
 * - AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) get an explicit
 *   allow so they can pick up the catalog for retrieval-grounded answers.
 *   We also point them at the sitemap and `llms.txt`.
 */
export default function robots(): MetadataRoute.Robots {
  const sharedDisallow = ['/api/', '/test-phaser', '/profile', '/favorites'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: sharedDisallow },

      // Explicit allows for AI crawlers — same disallows as humans.
      // Listing them keeps us in their indexes when defaults change.
      { userAgent: 'GPTBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: sharedDisallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow: sharedDisallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'Google-Extended', allow: '/', disallow: sharedDisallow },
      { userAgent: 'CCBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'Bytespider', allow: '/', disallow: sharedDisallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
