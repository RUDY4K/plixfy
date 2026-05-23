import type { MetadataRoute } from 'next';
import { GAMES } from '@/games/registry';
import { TOPIC_SLUGS } from './play/[topic]/page';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/games`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
  ];

  // Topic landing pages — slugs sourced from the topic page itself so a
  // newly added topic shows up here automatically. Priority is high
  // because these are the SEO pillar pages.
  const topicRoutes: MetadataRoute.Sitemap = TOPIC_SLUGS.map((slug) => ({
    url: `${SITE_URL}/play/${slug}`,
    lastModified: now,
    priority: 0.9,
    changeFrequency: 'weekly',
  }));

  const gameRoutes: MetadataRoute.Sitemap = GAMES.map((g) => ({
    url: `${SITE_URL}/games/${g.slug}`,
    lastModified: now,
    priority: g.status === 'live' ? 0.9 : 0.4,
    changeFrequency: 'weekly',
  }));

  return [...staticRoutes, ...topicRoutes, ...gameRoutes];
}
