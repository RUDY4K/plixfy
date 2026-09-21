import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import TrackOnMount from "@/components/TrackOnMount";
import { hasLocale, localeHref, pageAlternates } from "@/lib/i18n";
import { paginateSearchResults } from "@/lib/searchPagination.mjs";

const copyByLocale = {
  ar: {
    title: "بحث | بليكسفاي",
    description: "ابحث في مكتبة ألعاب بليكسفاي.",
    h1: "بحث",
    placeholder: "دور على لعبتك المفضلة...",
    searchAria: "بحث",
    results: (n: number, q: string) => `${n} نتيجة لـ "${q}"`,
    noResults: (q: string) => `لا توجد نتائج لـ "${q}"`,
    emptyPrompt: "اكتب لتبدأ البحث",
    previous: "السابق",
    next: "التالي",
    page: (current: number, total: number) => `صفحة ${current} من ${total}`,
  },
  en: {
    title: "Search | Plixfy",
    description: "Search the Plixfy games library.",
    h1: "Search",
    placeholder: "Find your favorite game...",
    searchAria: "Search",
    results: (n: number, q: string) => `${n} results for "${q}"`,
    noResults: (q: string) => `No results for "${q}"`,
    emptyPrompt: "Start typing to search",
    previous: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} of ${total}`,
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/search"),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  const { q = "", page = "1" } = await searchParams;
  const query = q.slice(0, 200).trim();
  const needle = query.toLowerCase();

  const results = needle
    ? allGames.filter(
        (g) =>
          g.title.toLowerCase().includes(needle) ||
          g.category.toLowerCase().includes(needle),
      )
    : [];
  const requestedPage = Number(page);
  const pagedResults = paginateSearchResults(results, requestedPage);
  if (!pagedResults) notFound();
  const pageHref = (targetPage: number) =>
    localeHref(locale, `/search?q=${encodeURIComponent(query)}&page=${targetPage}`);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        {copy.h1}
      </h1>

      <form
        action={localeHref(locale, "/search")}
        role="search"
        className="bg-surface rounded-2xl p-4 mb-6"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={copy.placeholder}
          className="w-full bg-surface-elevated text-text-primary placeholder:text-text-secondary rounded-xl px-4 py-3 min-h-12 outline-none focus:ring-2 focus:ring-primary"
          aria-label={copy.searchAria}
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
              ? copy.results(results.length, query)
              : copy.noResults(query)}
          </p>
          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {pagedResults.items.map((game) => (
                  <GameCard key={game.slug} {...game} locale={locale} />
                ))}
              </div>
              {pagedResults.totalPages > 1 ? (
                <nav
                  className="mt-10 flex items-center justify-center gap-4"
                  aria-label={copy.page(pagedResults.currentPage, pagedResults.totalPages)}
                >
                  {pagedResults.currentPage > 1 ? (
                    <Link
                      href={pageHref(pagedResults.currentPage - 1)}
                      className="rounded-full border border-white/10 bg-surface px-5 py-3 text-sm font-bold text-text-primary hover:border-primary/40"
                    >
                      {copy.previous}
                    </Link>
                  ) : null}
                  <span className="text-sm text-text-secondary">
                    {copy.page(pagedResults.currentPage, pagedResults.totalPages)}
                  </span>
                  {pagedResults.currentPage < pagedResults.totalPages ? (
                    <Link
                      href={pageHref(pagedResults.currentPage + 1)}
                      className="rounded-full border border-white/10 bg-surface px-5 py-3 text-sm font-bold text-text-primary hover:border-primary/40"
                    >
                      {copy.next}
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <div className="text-center text-text-secondary py-12">
          <p className="text-base md:text-lg">{copy.emptyPrompt}</p>
        </div>
      )}
    </main>
  );
}
