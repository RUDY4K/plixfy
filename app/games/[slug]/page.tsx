import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GAMES, findGame } from '@/games/registry';
import GameCard from '@/components/GameCard';
import AdPlacement from '@/components/AdPlacement';
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
  return {
    title: `${game.title} — Play Free Online`,
    description: game.longDescription,
    keywords: game.keywords,
    openGraph: {
      title: `${game.title} — PlayHub`,
      description: game.description,
      type: 'website',
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

  const related = GAMES.filter((g) => g.slug !== game.slug && g.category === game.category).slice(
    0,
    3
  );

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

      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">← All games</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <article>
          <header className="mb-4">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
              style={{ background: `${game.color}22`, color: game.color }}
            >
              {game.category}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{game.title}</h1>
            <p className="mt-2 max-w-2xl text-neutral-400">{game.longDescription}</p>
          </header>

          <GameStage game={game} />

          <div className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
            <strong className="text-white">Controls:</strong> {game.controls}
          </div>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-bold">More {game.category} games</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <GameCard key={r.slug} game={r} />
                ))}
              </div>
            </section>
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
