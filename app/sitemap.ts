import type { MetadataRoute } from 'next';
import { GAMES } from '@/games/registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playhub.example';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
  ];

  const gameRoutes: MetadataRoute.Sitemap = GAMES.map((g) => ({
    url: `${SITE_URL}/games/${g.slug}`,
    lastModified: now,
    priority: g.status === 'live' ? 0.9 : 0.4,
    changeFrequency: 'weekly',
  }));

  return [...staticRoutes, ...gameRoutes];
}
