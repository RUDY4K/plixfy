import Link from "next/link";
import HeroTile from "@/components/HeroTile";
import CategoryStrip from "@/components/CategoryStrip";
import TrackOnMount from "@/components/TrackOnMount";
import {
  getTrendingGames,
  getTopPicks,
  getGamesByCategory,
  allGames,
} from "@/lib/games";
import type { Game } from "@/lib/games";
import { getTopGame } from "@/lib/gameStats";
import { getAllPosts } from "@/lib/blog";
import { getAllNews, formatNewsDate } from "@/lib/news";
import { HOME_H1, HOME_INTRO } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "بليكسفاي",
  url: SITE,
  inLanguage: "ar",
  potentialAction: {
    "@type": "SearchAction",
    target: SITE + "/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "بليكسفاي",
  url: SITE,
  logo: SITE + "/opengraph-image.png",
};

export const revalidate = 86400;

export default function Home() {
  const topGame = getTopGame();

  const used = new Set<string>([topGame.slug]);
  const take = <T extends readonly Game[]>(list: T): T => {
    list.forEach((g) => used.add(g.slug));
    return list;
  };

  const trending = take(getTrendingGames(used));
  const topPicks = take(getTopPicks(used));
  const racing = take(getGamesByCategory("racing", used));
  const action = take(getGamesByCategory("action", used));
  const puzzle = take(getGamesByCategory("puzzle", used));
  const io = take(getGamesByCategory("io", used));
  const girls = take(getGamesByCategory("girls", used));
  const casual = take(getGamesByCategory("casual", used));

  const MIN_STRIP = 10;

  const buildItemListLd = (name: string, games: readonly Game[]) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: Math.min(games.length, 10),
    itemListElement: games.slice(0, 10).map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + "/play/" + g.slug,
      name: g.title,
      image: g.thumbnail,
    })),
  });

  const trendingLd =
    trending.length >= MIN_STRIP ? buildItemListLd("ألعاب رائجة الآن", trending) : null;
  const topPicksLd =
    topPicks.length >= MIN_STRIP ? buildItemListLd("ترشيحات بليكسفاي", topPicks) : null;

  const allLd = [
    websiteLd,
    organizationLd,
    ...(trendingLd ? [trendingLd] : []),
    ...(topPicksLd ? [topPicksLd] : []),
  ];

  return (
    <main className="max-w-7xl mx-auto py-6 md:py-8 md:px-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allLd),
        }}
      />

      <header className="px-4 md:px-0 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
          {HOME_H1}
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          {HOME_INTRO}
        </p>
      </header>

      <TrackOnMount
        eventName="hero_top_game_viewed"
        dedupKey={`hero:${topGame.slug}`}
        params={{ game_slug: topGame.slug, plays: topGame.plays ?? 0 }}
      />
      <HeroTile
        title={topGame.title}
        slug={topGame.slug}
        thumbnail={topGame.thumbnail}
        category={topGame.category}
        description={topGame.description}
        isTopGame
      />

      {trending.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألعاب رائجة الآن"
          viewAllHref="/category/trending"
          games={trending}
        />
      )}

      {topPicks.length >= MIN_STRIP && (
        <CategoryStrip
          title="ترشيحات بليكسفاي"
          viewAllHref="/category/top"
          games={topPicks}
        />
      )}

      {racing.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألعاب السباق"
          viewAllHref="/category/racing"
          games={racing}
        />
      )}

      {action.length >= MIN_STRIP && (
        <CategoryStrip
          title="أكشن وقتال"
          viewAllHref="/category/action"
          games={action}
        />
      )}

      {puzzle.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألغاز ومخ"
          viewAllHref="/category/puzzle"
          games={puzzle}
        />
      )}

      {io.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألعاب آيو"
          viewAllHref="/category/io"
          games={io}
        />
      )}

      {girls.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألعاب البنات"
          viewAllHref="/category/girls"
          games={girls}
        />
      )}

      {casual.length >= MIN_STRIP && (
        <CategoryStrip
          title="ألعاب خفيفة"
          viewAllHref="/category/casual"
          games={casual}
        />
      )}

      <section className="mt-12 px-4 md:px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            من المدونة
          </h2>
          <Link
            href="/blog"
            className="text-sm text-primary hover:underline"
          >
            كل المقالات ←
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getAllPosts()
            .slice(0, 4)
            .map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-primary/20 bg-surface/60 p-4 hover:border-primary/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-text-primary mb-2 leading-snug">
                  {post.h1}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </Link>
            ))}
        </div>
      </section>

      <section className="mt-10 px-4 md:px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            آخر أخبار الألعاب
          </h2>
          <Link
            href="/news"
            className="text-sm text-primary hover:underline"
          >
            كل الأخبار ←
          </Link>
        </div>
        <ul className="space-y-2">
          {getAllNews()
            .slice(0, 3)
            .map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/news/${item.slug}`}
                  className="flex items-baseline gap-3 rounded-xl border border-primary/10 bg-surface/40 px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <span className="text-xs text-text-secondary shrink-0">
                    {formatNewsDate(item.publishedAt)}
                  </span>
                  <span className="text-sm text-text-primary leading-snug">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <div className="mt-12 px-4 md:px-0">
        <Link
          href="/all-games"
          className="block rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8 text-center hover:from-primary/30 hover:to-accent/30 transition-colors border border-primary/30"
        >
          <p className="text-xl md:text-2xl font-bold text-text-primary mb-1">
            تصفّح كل {allGames.length} لعبة
          </p>
          <p className="text-sm text-text-secondary">
            مرتّبة حسب التصنيف، بدون تحميل
          </p>
        </Link>
      </div>
    </main>
  );
}
