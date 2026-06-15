import HeroTile from "@/components/HeroTile";
import CategoryStrip from "@/components/CategoryStrip";
import MonetagAds from "@/components/MonetagAds";
import TrackOnMount from "@/components/TrackOnMount";
import {
  getTrendingGames,
  getTopPicks,
  getGamesByCategory,
} from "@/lib/games";
import type { Game } from "@/lib/games";
import { getTopGame } from "@/lib/gameStats";

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

  return (
    <main className="max-w-7xl mx-auto py-6 md:py-8 md:px-6">
      <div className="px-4 md:px-0 mb-6">
        <MonetagAds type="banner" />
      </div>

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

    </main>
  );
}
