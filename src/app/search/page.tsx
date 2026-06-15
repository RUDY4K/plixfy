import type { Metadata } from "next";
import { allGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import TrackOnMount from "@/components/TrackOnMount";
import MonetagAds from "@/components/MonetagAds";

export const metadata: Metadata = {
  title: "بحث | بليكسفاي",
  description: "ابحث في مكتبة ألعاب بليكسفاي.",
  alternates: {
    canonical: "/search",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const needle = query.toLowerCase();

  const results = needle
    ? allGames.filter(
        (g) =>
          g.title.toLowerCase().includes(needle) ||
          g.category.toLowerCase().includes(needle),
      )
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        بحث
      </h1>

      <div className="mb-6">
        <MonetagAds type="banner" />
      </div>

      <form action="/search" role="search" className="bg-surface rounded-2xl p-4 mb-6">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="دور على لعبتك المفضلة..."
          className="w-full bg-surface-elevated text-text-primary placeholder:text-text-secondary rounded-xl px-4 py-3 min-h-12 outline-none focus:ring-2 focus:ring-primary"
          aria-label="بحث"
        />
      </form>

      {query ? (
        <>
          <TrackOnMount
            eventName="search_submit"
            dedupKey={`search:${query}`}
            params={{ query, results_count: results.length }}
          />
          <p className="text-sm md:text-base text-text-secondary mb-4">
            {results.length > 0
              ? `${results.length} نتيجة لـ "${query}"`
              : `لا توجد نتائج لـ "${query}"`}
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
              {results.map((game) => (
                <GameCard key={game.slug} {...game} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-center text-text-secondary py-12">
          <p className="text-base md:text-lg">اكتب لتبدأ البحث</p>
        </div>
      )}
    </main>
  );
}
