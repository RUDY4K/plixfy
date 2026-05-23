import type { Metadata } from 'next';
import Link from 'next/link';
import GameCard from '@/components/GameCard';
import LoadMoreGames from '@/components/LoadMoreGames';
import { LIGHT_GAMES } from '@/games/registry';
import {
  findTopic,
  gamesForTopic,
  TOPICS,
  TOPIC_INITIAL_PAGE_SIZE,
  TOPIC_BATCH_SIZE,
} from '@/lib/topics';

/**
 * Master "All Games" catalog at /games. Plixfy's canonical hub for the
 * full live catalog — what Google Search Console was 404-ing on before
 * this page existed. SSR-renders the first 50 live games and hands off
 * to LoadMoreGames for the rest via /api/play/unblocked-games. The
 * `unblocked-games` topic matcher is `g.status === 'live'`, so its
 * universe is identical to "all live games on Plixfy" — same order on
 * both halves of the pagination, no gaps or duplicates.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

// We piggyback on the unblocked-games topic for pagination (its matcher
// covers every live game). Keeping this in one place makes the SSR slice
// and the /api/play/{topic} requests walk the same list.
const PAGINATION_TOPIC_SLUG = 'unblocked-games';

export const metadata: Metadata = {
  title: { absolute: 'All Games — Browse the Full Plixfy Catalog' },
  description:
    'Browse every free game on Plixfy in one place. IO, racing, shooting, puzzle, sports, multiplayer and more — instant play, no download, no signup.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'All Games — Browse the Full Plixfy Catalog',
    description:
      'Browse every free game on Plixfy — IO, racing, shooting, puzzle, sports, multiplayer and more. Instant play in your browser.',
    type: 'website',
    url: '/games',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Games — Browse the Full Plixfy Catalog',
    description:
      'Browse every free game on Plixfy — IO, racing, shooting, puzzle, sports, multiplayer and more.',
    images: ['/og-default.png'],
  },
};

export default function AllGamesPage() {
  const topic = findTopic(PAGINATION_TOPIC_SLUG);
  // Defensive: the topic is hard-coded above so this should never trip,
  // but we'd rather degrade than throw a 500 if someone renames the slug.
  const games = topic ? gamesForTopic(topic, LIGHT_GAMES) : LIGHT_GAMES.filter((g) => g.status === 'live');
  const initial = games.slice(0, TOPIC_INITIAL_PAGE_SIZE);
  const hasMore = games.length > TOPIC_INITIAL_PAGE_SIZE;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/games#page`,
        url: `${SITE_URL}/games`,
        name: 'All Games on Plixfy',
        description:
          'The full Plixfy catalog — every live game in the browser, sorted into one master grid.',
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'All Games', item: `${SITE_URL}/games` },
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
          <li aria-current="page" className="text-neutral-300">All Games</li>
        </ol>
      </nav>

      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
          🎮 Browse Plixfy
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
          All Games — {games.length.toLocaleString()} free games
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400 sm:text-base">
          The full Plixfy catalog in one place. Every game runs straight in your browser — no
          downloads, no logins, no waiting. Jump into anything from IO shooters and racing to
          puzzles, sports, and stickman classics.
        </p>
      </header>

      {initial.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-500">
          No games yet — check back soon.
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
          topic={PAGINATION_TOPIC_SLUG}
          initialOffset={TOPIC_INITIAL_PAGE_SIZE}
          total={games.length}
          batchSize={TOPIC_BATCH_SIZE}
        />
      )}

      <section className="mt-12 border-t border-neutral-900 pt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Browse by category
        </h2>
        <ul className="flex flex-wrap gap-2">
          {TOPICS.map((s) => (
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
