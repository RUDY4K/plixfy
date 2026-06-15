import Link from "next/link";
import type { Metadata } from "next";
import { categories, allGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

const TOTAL = allGames.length;

export const metadata: Metadata = {
  title: `جميع الألعاب - ${BRAND_AR} | ${TOTAL}+ لعبة مجانية`,
  description: `تصفّح كل ${TOTAL} لعبة على ${BRAND_AR} مرتّبة حسب التصنيف: سباق، أكشن، ألغاز، رياضة، تصويب، بنات، آيو، وخفيف. كلها مجانية وتعمل من المتصفح بدون تحميل.`,
  alternates: { canonical: "/all-games" },
  openGraph: {
    type: "website",
    title: `جميع الألعاب - ${BRAND_AR}`,
    description: `كل الألعاب على ${BRAND_AR} في صفحة واحدة، مرتّبة حسب التصنيف.`,
    url: SITE + "/all-games",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: `جميع الألعاب - ${BRAND_AR}`,
    description: `كل ${TOTAL} لعبة على ${BRAND_AR} في صفحة واحدة.`,
  },
};

export default function AllGamesPage() {
  const sections = categories.map((c) => ({
    cat: c,
    games: allGames.filter((g) => g.categorySlug === c.slug),
  }));

  const perCategoryItemLists = sections.map(({ cat, games }) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": SITE + "/all-games#" + cat.slug,
    name: cat.labelAr + " - بليكسفاي",
    description: `${games.length} لعبة ${cat.labelAr} مجانية أونلاين على بليكسفاي`,
    url: SITE + "/all-games#" + cat.slug,
    numberOfItems: games.length,
    itemListElement: games.map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + "/play/" + g.slug,
      name: g.title,
      image: g.thumbnail,
    })),
  }));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "جميع الألعاب", item: SITE + "/all-games" },
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
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "جميع الألعاب" },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          جميع الألعاب
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-3xl">
          {TOTAL} لعبة مجانية أونلاين على {BRAND_AR}، مرتّبة حسب التصنيف. كل
          الألعاب تعمل من المتصفح مباشرة بدون تحميل، ومتوافقة مع الجوال
          والحاسوب. اختر تصنيفك المفضّل من القائمة أدناه أو تصفّح القائمة كاملة.
        </p>
      </header>

      <nav
        aria-label="تنقّل سريع للتصنيفات"
        className="mb-8 flex flex-wrap gap-2"
      >
        {sections.map(({ cat, games }) => (
          <a
            key={cat.slug}
            href={`#${cat.slug}`}
            className="min-h-12 inline-flex items-center px-4 py-2.5 rounded-full bg-surface-secondary text-sm text-text-primary hover:bg-primary/15 hover:text-primary transition-colors"
          >
            {cat.labelAr}
            <span className="text-text-faint mr-1">({games.length})</span>
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
              {cat.labelAr}
              <span className="text-text-secondary text-sm font-normal mr-2">
                ({games.length} لعبة)
              </span>
            </h2>
            <Link
              href={`/category/${cat.slug}`}
              className="text-sm text-primary hover:underline"
            >
              عرض الفئة ←
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
            {games.map((g, idx) => (
              <GameCard
                key={g.slug}
                {...g}
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
