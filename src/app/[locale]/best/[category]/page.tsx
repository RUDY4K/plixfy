import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trophy, Star } from "lucide-react";
import {
  categories,
  getCategoryGames,
  type CategorySlug,
} from "@/lib/games";
import { getGameStats } from "@/lib/gameStats";
import { categoryContent } from "@/lib/categoryContent";
import { getLocalizedCategoryMeta } from "@/lib/categoryI18n";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  locales,
  hasLocale,
  localeHref,
  getDict,
  ogLocaleFor,
  pageAlternates,
} from "@/lib/i18n";

const SITE = "https://www.plixfy.com";
const YEAR = new Date().getFullYear();
const TOP_N = 15;

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    categories.map((c) => ({ locale, category: c.slug }))
  );
}

const uiCopy = {
  ar: {
    notFoundTitle: "الفئة غير موجودة | بليكسفاي",
    metaTitle: (name: string) =>
      `أفضل ${name} ${YEAR} - أعلى ${TOP_N} لعبة | بليكسفاي`,
    metaDescription: (name: string) =>
      `قائمة أفضل ${name} على بليكسفاي لسنة ${YEAR} — مرتّبة حسب الشعبية وعدد اللاعبين. كلها مجانية وتعمل من المتصفح بدون تحميل.`,
    h1: (name: string) => `أفضل ${name} ${YEAR}`,
    bestN: `أفضل ${TOP_N}`,
    ldName: (name: string) => `أفضل ${name} ${YEAR}`,
    ldDescription: (n: number, name: string) =>
      `قائمة أفضل ${n} لعبة في ${name} على بليكسفاي`,
    ldItemDescription: (title: string, plays: string) =>
      `${title} — ${plays} مرة لعب على بليكسفاي`,
    intro: (n: number, name: string, hook: string) =>
      `أعلى ${n} لعبة في ${name} على بليكسفاي، مرتّبة حسب الشعبية وعدد اللاعبين. ${hook}. كلها مجانية وتعمل من المتصفح بدون تحميل.`,
    playsSuffix: "مرة لعب",
    exploreMore: "استكشف المزيد",
    viewAll: (name: string, n: number) => `عرض كل ${name} (${n}) ←`,
  },
  en: {
    notFoundTitle: "Category Not Found | Plixfy",
    metaTitle: (name: string) =>
      `Best ${name} ${YEAR} - Top ${TOP_N} Games | Plixfy`,
    metaDescription: (name: string) =>
      `The best ${name} on Plixfy for ${YEAR} — ranked by popularity and player count. All free, playable in your browser with no download.`,
    h1: (name: string) => `Best ${name} ${YEAR}`,
    bestN: `Top ${TOP_N}`,
    ldName: (name: string) => `Best ${name} ${YEAR}`,
    ldDescription: (n: number, name: string) =>
      `The top ${n} games in ${name} on Plixfy`,
    ldItemDescription: (title: string, plays: string) =>
      `${title} — ${plays} plays on Plixfy`,
    intro: (n: number, name: string) =>
      `The top ${n} games in ${name} on Plixfy, ranked by popularity and player count. All free — play right in your browser with no download.`,
    playsSuffix: "plays",
    exploreMore: "Explore More",
    viewAll: (name: string, n: number) => `View all ${name} (${n}) →`,
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/best/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = uiCopy[locale];
  const meta = getLocalizedCategoryMeta(category, locale);
  if (!meta) {
    return {
      title: copy.notFoundTitle,
      alternates: { canonical: localeHref(locale, "/categories") },
    };
  }
  const title = copy.metaTitle(meta.name);
  const description = copy.metaDescription(meta.name);
  const path = "/best/" + category;
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "website",
      title,
      description,
      url: SITE + localeHref(locale, path),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const revalidate = 86400;

export default async function BestCategoryPage({
  params,
}: PageProps<"/[locale]/best/[category]">) {
  const { locale, category } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const copy = uiCopy[locale];
  const href = (path: string) => localeHref(locale, path);
  const meta = getLocalizedCategoryMeta(category, locale);
  if (!meta) notFound();

  const allInCat = getCategoryGames(category);
  if (allInCat.length === 0) notFound();

  // Rank by deterministic gameStats playsCount (acts as popularity score)
  const ranked = [...allInCat]
    .map((g) => ({ game: g, stats: getGameStats(g.slug) }))
    .sort((a, b) => b.stats.playsCount - a.stats.playsCount)
    .slice(0, TOP_N);

  const content = locale === "ar" ? categoryContent[category as CategorySlug] : undefined;
  const url = SITE + href("/best/" + category);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.ldName(meta.name),
    description: copy.ldDescription(ranked.length, meta.name),
    url,
    numberOfItems: ranked.length,
    itemListElement: ranked.map(({ game, stats }, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + href("/play/" + game.slug),
      name: game.title,
      image: game.thumbnail,
      description: copy.ldItemDescription(game.title, stats.playsDisplay),
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.nav.home, item: SITE + href("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.name,
        item: SITE + href("/category/" + category),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: copy.bestN,
        item: url,
      },
    ],
  };

  const intro =
    locale === "ar"
      ? uiCopy.ar.intro(ranked.length, meta.name, content?.metaHooks?.[0] ?? "")
      : uiCopy.en.intro(ranked.length, meta.name);

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemListLd, breadcrumbLd]),
        }}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: t.nav.home, href: href("/") },
          { label: meta.name, href: href("/category/" + category) },
          { label: copy.bestN },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-primary/15 text-primary">
            <Trophy className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
            {copy.h1(meta.name)}
          </h1>
        </div>
        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          {intro}
        </p>
      </header>

      <ol className="space-y-3 md:space-y-4 mb-10">
        {ranked.map(({ game, stats }, idx) => (
          <li
            key={game.slug}
            className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-surface border border-surface-elevated hover:border-primary/30 transition-colors"
          >
            <div className="shrink-0 w-10 md:w-12 inline-flex flex-col items-center justify-center text-primary font-extrabold text-xl md:text-2xl">
              #{idx + 1}
            </div>
            <Link
              href={href("/play/" + game.slug)}
              className="flex-1 min-w-0 flex items-center gap-3"
              data-game-slug={game.slug}
              data-placement={"best-" + category}
              data-position={idx + 1}
            >
              <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-sm md:text-lg font-bold text-text-primary truncate font-latin"
                  dir="ltr"
                >
                  {game.title}
                </h2>
                <p className="text-xs md:text-sm text-text-secondary mt-0.5">
                  {meta.name}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-2 text-xs text-text-faint">
                  <span className="inline-flex items-center gap-1">
                    <Star
                      className="w-3 h-3 fill-current text-amber-400"
                      aria-hidden="true"
                    />
                    {stats.ratingDisplay}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{stats.playsDisplay} {copy.playsSuffix}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-10 pt-8 border-t border-surface-elevated">
        <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">
          {copy.exploreMore}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
          {allInCat.slice(TOP_N, TOP_N + 6).map((g, idx) => (
            <GameCard
              key={g.slug}
              {...g}
              locale={locale}
              position={idx + 1}
              placement={"best-extra-" + category}
            />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href={href("/category/" + category)}
            className="inline-flex items-center min-h-12 px-5 text-primary hover:underline"
          >
            {copy.viewAll(meta.name, allInCat.length)}
          </Link>
        </div>
      </section>
    </main>
  );
}
