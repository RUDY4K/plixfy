import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GAMES, findGame, relatedGames } from '@/games/registry';
import GameCard from '@/components/GameCard';
import AdPlacement from '@/components/AdPlacement';
import FavoriteButton from '@/components/FavoriteButton';
import PlayTracker from '@/components/PlayTracker';
import { baseCount, formatPlayCount } from '@/lib/userState';
import GameStage from './GameStage';

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = findGame(slug);
  if (!game) return { title: 'Not found' };
  const path = `/games/${game.slug}`;
  return {
    title: `${game.title} — Play Free Online`,
    description: game.longDescription,
    keywords: game.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: `${game.title} — PlayHub`,
      description: game.description,
      type: 'website',
      url: path,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.title} — Play Free Online`,
      description: game.description,
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const game = findGame(slug);
  if (!game) notFound();

  const related = relatedGames(game.slug, 8);
  const playCount = game.kind === 'embed' ? baseCount(game.slug) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.longDescription,
    genre: game.category,
    gamePlatform: 'Web Browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlayTracker slug={game.slug} />

      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">← All games</Link>
        <span className="px-2 text-neutral-700">/</span>
        <Link href={`/#games?category=${game.category}`} className="capitalize hover:text-white">
          {game.category}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <article>
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{ background: `${game.color}22`, color: game.color }}
              >
                {game.category}
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{game.title}</h1>
              <p className="mt-2 max-w-2xl text-neutral-400">{game.longDescription}</p>
              {playCount !== null && (
                <p className="mt-2 text-xs text-neutral-500">
                  <span aria-hidden="true">▶ </span>
                  {formatPlayCount(playCount)} plays · ★★★★☆
                </p>
              )}
            </div>
            <FavoriteButton slug={game.slug} size="lg" stopPropagation={false} />
          </header>

          {game.kind === 'embed' && game.status === 'live' && (
            <div className="mb-4">
              <AdPlacement slot="above-game" label="Ad · leaderboard 728×90" />
            </div>
          )}

          <GameStage game={game} />

          <div className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
            <strong className="text-white">Controls:</strong> {game.controls}
          </div>

          {game.kind === 'embed' && game.status === 'live' && (
            <div className="mt-6">
              <AdPlacement slot="below-game" label="Ad · 728×90 below game" />
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-bold">You might also like</h2>
              <p className="mb-4 text-xs text-neutral-500">
                Based on category and shared tags with {game.title}.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((r) => (
                  <GameCard key={r.slug} game={r} />
                ))}
              </div>
            </section>
          )}

          {game.kind === 'embed' && (
            <p className="mt-6 text-xs text-neutral-600">
              This game is provided by a third-party publisher. PlayHub does not control its
              content or in-game ads.
            </p>
          )}
        </article>

        <aside className="hidden lg:block">
          <AdPlacement slot="sidebar" label="Ad · sidebar 300×600" />
        </aside>
      </div>

      <div className="mt-6 lg:hidden">
        <AdPlacement slot="below-game" label="Ad · below game" />
      </div>
    </div>
  );
}
