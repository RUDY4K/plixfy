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
