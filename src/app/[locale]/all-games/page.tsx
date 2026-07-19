import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, allGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  hasLocale,
  localeHref,
  getDict,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

const TOTAL = allGames.length;

const copyByLocale = {
  ar: {
    metaTitle: `جميع الألعاب - بليكسفاي | ${TOTAL}+ لعبة مجانية`,
    metaDescription: `تصفّح كل ${TOTAL} لعبة على بليكسفاي مرتّبة حسب التصنيف: سباق، أكشن، ألغاز، رياضة، تصويب، بنات، آيو، وخفيف. كلها مجانية وتعمل من المتصفح بدون تحميل.`,
    ogTitle: "جميع الألعاب - بليكسفاي",
    ogDescription: "كل الألعاب على بليكسفاي في صفحة واحدة، مرتّبة حسب التصنيف.",
    h1: "جميع الألعاب",
    intro: `${TOTAL} لعبة مجانية أونلاين على بليكسفاي، مرتّبة حسب التصنيف. كل الألعاب تعمل من المتصفح مباشرة بدون تحميل، ومتوافقة مع الجوال والحاسوب. اختر تصنيفك المفضّل من القائمة أدناه أو تصفّح القائمة كاملة.`,
    quickNavAria: "تنقّل سريع للتصنيفات",
    gamesCount: (n: number) => `(${n} لعبة)`,
    viewCategory: "عرض الفئة ←",
    ldName: (label: string) => label + " - بليكسفاي",
    ldDescription: (n: number, label: string) =>
      `${n} لعبة ${label} مجانية أونلاين على بليكسفاي`,
  },
  en: {
    metaTitle: `All Games - Plixfy | ${TOTAL}+ Free Games`,
    metaDescription: `Browse all ${TOTAL} games on Plixfy sorted by category: racing, action, puzzle, sports, shooting, girls, .io and casual. All free, playable in your browser with no download.`,
    ogTitle: "All Games - Plixfy",
    ogDescription: "Every game on Plixfy on one page, sorted by category.",
    h1: "All Games",
    intro: `${TOTAL} free online games on Plixfy, sorted by category. Every game runs directly in your browser with no download, on both mobile and desktop. Pick your favorite category below or browse the full list.`,
    quickNavAria: "Quick category navigation",
    gamesCount: (n: number) => `(${n} games)`,
    viewCategory: "View category →",
    ldName: (label: string) => label + " - Plixfy",
    ldDescription: (n: number, label: string) =>
      `${n} free ${label} games online on Plixfy`,
  },
} as const;

function catLabel(locale: Locale, cat: (typeof categories)[number]): string {
  return locale === "en" ? cat.labelEn : cat.labelAr;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/all-games">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: pageAlternates(locale, "/all-games"),
    openGraph: {
      type: "website",
      title: copy.ogTitle,
      description: copy.ogDescription,
      url: SITE + localeHref(locale, "/all-games"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: copy.ogTitle,
      description: copy.ogDescription,
    },
  };
}

export default async function AllGamesPage({
  params,
}: PageProps<"/[locale]/all-games">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const copy = copyByLocale[locale];
  const href = (path: string) => localeHref(locale, path);

  const sections = categories.map((c) => ({
    cat: c,
    games: allGames.filter((g) => g.categorySlug === c.slug),
  }));

  const perCategoryItemLists = sections.map(({ cat, games }) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": SITE + href("/all-games") + "#" + cat.slug,
    name: copy.ldName(catLabel(locale, cat)),
    description: copy.ldDescription(games.length, catLabel(locale, cat)),
    url: SITE + href("/all-games") + "#" + cat.slug,
    numberOfItems: games.length,
    itemListElement: games.map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + href("/play/" + g.slug),
      name: g.title,
      image: g.thumbnail,
    })),
  }));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.nav.home, item: SITE + href("/") },
      { "@type": "ListItem", position: 2, name: copy.h1, item: SITE + href("/all-games") },
    ],
  };

  const allLd = [...perCategoryItemLists, breadcrumbLd];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(allLd) }}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: t.nav.home, href: href("/") },
          { label: copy.h1 },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          {copy.h1}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-3xl">
          {copy.intro}
        </p>
      </header>

      <nav
        aria-label={copy.quickNavAria}
        className="mb-8 flex flex-wrap gap-2"
      >
        {sections.map(({ cat, games }) => (
          <a
            key={cat.slug}
            href={`#${cat.slug}`}
            className="min-h-12 inline-flex items-center px-4 py-2.5 rounded-full bg-surface-secondary text-sm text-text-primary hover:bg-primary/15 hover:text-primary transition-colors"
          >
            {catLabel(locale, cat)}
            <span className="text-text-faint ms-1">({games.length})</span>
          </a>
        ))}
      </nav>

      {sections.map(({ cat, games }) => (
        <section
          key={cat.slug}
          id={cat.slug}
          className="mb-12 scroll-mt-24"
          aria-labelledby={`h2-${cat.slug}`}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2
              id={`h2-${cat.slug}`}
              className="text-xl md:text-2xl font-bold text-text-primary"
            >
              {catLabel(locale, cat)}
              <span className="text-text-secondary text-sm font-normal ms-2">
                {copy.gamesCount(games.length)}
              </span>
            </h2>
            <Link
              href={href(`/category/${cat.slug}`)}
              className="text-sm text-primary hover:underline"
            >
              {copy.viewCategory}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
            {games.map((g, idx) => (
              <GameCard
                key={g.slug}
                {...g}
                locale={locale}
                position={idx + 1}
                placement={`all-games-${cat.slug}`}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
