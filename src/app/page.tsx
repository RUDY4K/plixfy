import type { Metadata } from "next";
import HeroTile from "@/components/HeroTile";
import CategoryStrip from "@/components/CategoryStrip";
import {
  getFeaturedGame,
  getTrendingGames,
  getTopPicks,
  getGamesByCategory,
} from "@/lib/games";
import type { Game } from "@/lib/games";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const featured = getFeaturedGame();

  const used = new Set<string>([featured.slug]);
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

  return (
    <main className="max-w-7xl mx-auto py-6 md:py-8 md:px-6">
      <HeroTile
        title={featured.title}
        slug={featured.slug}
        thumbnail={featured.thumbnailWide}
        category={featured.category}
        description={featured.description}
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

      <div className="text-center text-sm text-text-secondary px-4 pt-8 pb-12">
        <p>الإصدار التجريبي • المرحلة 5: Home Page</p>
      </div>
    </main>
  );
}
