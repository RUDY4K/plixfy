import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GameCard from '@/components/GameCard';
import LoadMoreGames from '@/components/LoadMoreGames';
import { LIGHT_GAMES } from '@/games/registry';
import {
  findTopic,
  gamesForTopic,
  TOPICS,
  TOPIC_INITIAL_PAGE_SIZE,
  TOPIC_BATCH_SIZE,
  TOPIC_SLUGS as TOPIC_SLUGS_FROM_LIB,
} from '@/lib/topics';

/**
 * Topic-driven SEO landing pages. Each page emits canonical OG/Twitter
 * metadata + JSON-LD CollectionPage + ItemList, a real `<nav>` breadcrumb,
 * and the GameCard grid.
 *
 * Pagination — the page SSR-renders only the first {@link TOPIC_INITIAL_PAGE_SIZE}
 * games. Anything beyond that is fetched lazily via the
 * `LoadMoreGames` client component (which calls /api/play/[topic]).
 * This keeps the pre-rendered HTML under Vercel's 19MB ISR cap on the
 * big topics — `unblocked-games` alone has 5,300+ live games and was
 * tipping over the limit at full SSR.
 */

export async function generateStaticParams(): Promise<{ topic: string }[]> {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const t = findTopic(topic);
  if (!t) return { title: 'Not found' };
  // `absolute` bypasses the `%s | Plixfy` template in app/layout.tsx —
  // metaTitle strings already include the brand suffix.
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDescription,
    alternates: { canonical: `/play/${t.slug}` },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      type: 'website',
      url: `/play/${t.slug}`,
      images: ['/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.metaTitle,
      description: t.metaDescription,
      images: ['/og-default.png'],
    },
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = findTopic(topic);
  if (!t) notFound();

  const games = gamesForTopic(t, LIGHT_GAMES);
  const initial = games.slice(0, TOPIC_INITIAL_PAGE_SIZE);
  const hasMore = games.length > TOPIC_INITIAL_PAGE_SIZE;

  // CollectionPage + ItemList tell crawlers "this is a curated set of N
  // related games". We cap ItemList at 30 items — Google ignores beyond
  // ~30 anyway and the payload stays compact.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/play/${t.slug}#page`,
        url: `${SITE_URL}/play/${t.slug}`,
        name: t.metaTitle,
        description: t.metaDescription,
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: t.title, item: `${SITE_URL}/play/${t.slug}` },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: games.length,
        itemListElement: games.slice(0, 30).map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/games/${g.slug}`,
          name: g.title,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-white">Home</Link>
          </li>
          <li aria-hidden="true" className="text-neutral-700">›</li>
          <li aria-current="page" className="text-neutral-300">{t.title}</li>
        </ol>
      </nav>

      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
          {t.emoji} Play on Plixfy
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
          {t.title} — {games.length.toLocaleString()} free games
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400 sm:text-base">
          {t.intro}
        </p>
      </header>

      {initial.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-500">
          No games in this category yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {initial.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      )}

      {hasMore && (
        <LoadMoreGames
          topic={t.slug}
          initialOffset={TOPIC_INITIAL_PAGE_SIZE}
          total={games.length}
          batchSize={TOPIC_BATCH_SIZE}
        />
      )}

      {/* Cross-link to sibling topics so crawlers can walk the network. */}
      <section className="mt-12 border-t border-neutral-900 pt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
          More categories
        </h2>
        <ul className="flex flex-wrap gap-2">
          {TOPICS.filter((s) => s.slug !== t.slug).map((s) => (
            <li key={s.slug}>
              <Link
                href={`/play/${s.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-300 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                <span aria-hidden="true">{s.emoji}</span>
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Re-export so existing consumers (`app/sitemap.ts`) keep working without
 * a path update. The canonical source is now `@/lib/topics`.
 */
export const TOPIC_SLUGS: readonly string[] = TOPIC_SLUGS_FROM_LIB;
