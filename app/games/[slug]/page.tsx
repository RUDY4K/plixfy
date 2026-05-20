import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GAMES, findGame, relatedGames } from '@/games/registry';
import GameCard from '@/components/GameCard';
import AdPlacement from '@/components/AdPlacement';
import FavoriteButton from '@/components/FavoriteButton';
import PlayTracker from '@/components/PlayTracker';
import PlayTimer from '@/components/PlayTimer';
import Leaderboard from '@/components/Leaderboard';
import ChallengeBanner from '@/components/ChallengeBanner';
import ShareGameActions from '@/components/ShareGameActions';
import RatingButtons from '@/components/RatingButtons';
import { baseCount, formatPlayCount } from '@/lib/userState';
import GameStage from './GameStage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';

interface Params {
  slug: string;
}

/**
 * Build a 150-160 char meta description. Logic:
 *   1. Start with the game's short description (≤ 140 chars in our
 *      registry).
 *   2. If too short, splice in category context + the canonical CTA
 *      tail until we land in 150-160. We prefer one clean concatenation
 *      over keyword stuffing.
 *   3. Hard-cap at 160 chars — Google truncates beyond that and adds
 *      its own ellipsis we don't control.
 */
function makeMetaDescription(game: ReturnType<typeof findGame>): string {
  if (!game) return '';
  const base = (game.description || `${game.title} — free online game.`).trim().replace(/\.+$/, '');
  const cat = game.category.charAt(0).toUpperCase() + game.category.slice(1);
  // Tail variants of increasing length — we pick the shortest one that
  // pushes us into the 150-160 target window.
  const tails = [
    ` Play ${game.title} free on Plixfy — no download.`,
    ` Play ${game.title} free in your browser on Plixfy — no download, no signup.`,
    ` Play ${game.title} free on Plixfy — instant ${cat} game in your browser, no download required.`,
  ];
  let out = base + '.';
  for (const tail of tails) {
    const candidate = base + '.' + tail;
    if (candidate.length >= 150 && candidate.length <= 160) {
      return candidate;
    }
    if (candidate.length > out.length && candidate.length <= 160) {
      out = candidate;
    }
  }
  // If the longest tail still leaves us short, fall through; if any
  // candidate overshoots 160, truncate at a word boundary.
  if (out.length > 160) {
    const slice = out.slice(0, 157);
    const lastSpace = slice.lastIndexOf(' ');
    out = (lastSpace > 100 ? slice.slice(0, lastSpace) : slice) + '…';
  }
  return out;
}

/**
 * Mapping from registry category to the canonical SEO landing-page slug
 * (when we have one). Falls back to the catalog filter URL otherwise.
 */
const CATEGORY_TO_TOPIC: Record<string, string> = {
  io: 'io-games',
  multiplayer: 'multiplayer-games',
  shooting: 'shooting-games',
  racing: 'racing-games',
  puzzle: 'puzzle-games',
  action: 'action-games',
  sports: 'sports-games',
  stickman: 'stickman-games',
  zombie: 'zombie-games',
  cooking: 'cooking-games',
};

function categoryHref(category: string): string {
  const topic = CATEGORY_TO_TOPIC[category];
  return topic ? `/play/${topic}` : `/#games?category=${category}`;
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
  // Title format matches the SEO spec exactly: hyphen + pipe, no em-dash.
  // The `template` in app/layout.tsx auto-appends ` | Plixfy`.
  const title = `${game.title} - Play Free Online`;
  const description = makeMetaDescription(game);
  // Thumbnails on the home grid live at /assets/thumbnails/... — those
  // paths are relative to the site root, which is exactly what OG needs.
  const ogImage = game.thumbnail || '/og-default.svg';
  return {
    title,
    description,
    keywords: game.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: `${game.title} - Plixfy`,
      description,
      type: 'website',
      url: path,
      images: [{ url: ogImage, alt: `${game.title} screenshot` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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
  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  // Combined JSON-LD: VideoGame metadata + BreadcrumbList. Using @graph
  // lets us emit both in a single <script> tag — cleaner and lets
  // Google's parser deduplicate references.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        '@id': `${SITE_URL}/games/${game.slug}#game`,
        name: game.title,
        description: game.longDescription,
        url: `${SITE_URL}/games/${game.slug}`,
        image: game.thumbnail.startsWith('http') ? game.thumbnail : `${SITE_URL}${game.thumbnail}`,
        genre: game.category,
        gamePlatform: 'Web Browser',
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        inLanguage: 'en',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE_URL}#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryLabel,
            item: `${SITE_URL}${categoryHref(game.category)}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: game.title,
            item: `${SITE_URL}/games/${game.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlayTracker slug={game.slug} />
      <PlayTimer slug={game.slug} />

      {/* Semantic breadcrumb — Home › Category › Game */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-white">Home</Link>
          </li>
          <li aria-hidden="true" className="text-neutral-700">›</li>
          <li>
            <Link href={categoryHref(game.category)} className="hover:text-white">
              {categoryLabel}
            </Link>
          </li>
          <li aria-hidden="true" className="text-neutral-700">›</li>
          <li aria-current="page" className="line-clamp-1 max-w-[16rem] text-neutral-300">
            {game.title}
          </li>
        </ol>
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

          {game.status === 'live' && (
            <ChallengeBanner gameTitle={game.title} />
          )}

          <GameStage game={game} />

          <div className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
            <strong className="text-white">Controls:</strong> {game.controls}
          </div>

          {game.status === 'live' && (
            <div className="mt-4 flex flex-col gap-3">
              <RatingButtons slug={game.slug} />
              <ShareGameActions slug={game.slug} title={game.title} />
            </div>
          )}

          {game.kind === 'custom' && game.status === 'live' && (
            <div className="mt-6">
              <Leaderboard slug={game.slug} unit="pts" />
            </div>
          )}

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
              This game is provided by a third-party publisher. Plixfy does not control its
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
