import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Grid2X2 } from "lucide-react";
import {
  categories,
  getCategoryGames,
} from "@/lib/games";
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
      `استكشف ${name} - مجموعة من المكتبة | بليكسفاي`,
    metaDescription: (name: string) =>
      `مجموعة من ${name} بترتيب الكتالوج. اقرأ معلومات الأجهزة واللغات والتحكم قبل تشغيل اللعبة.`,
    h1: (name: string) => `استكشف ${name}`,
    bestN: "مجموعة من المكتبة",
    ldName: (name: string) => `استكشف ${name}`,
    ldDescription: (n: number, name: string) =>
      `مجموعة من ${n} لعبة في ${name} من كتالوج بليكسفاي`,
    ldItemDescription: (title: string) =>
      `${title} — من كتالوج الألعاب`,
    intro: (n: number, name: string) =>
      `${n} لعبة من فئة ${name} بترتيب الكتالوج، وليست ترتيبًا للشعبية أو نتيجة مراجعة لعب لكل عنوان. افتح صفحة اللعبة لقراءة الأجهزة واللغات والتحكم بحسب المصدر قبل التشغيل.`,
    exploreMore: "استكشف المزيد",
    viewAll: (name: string, n: number) => `عرض كل ${name} (${n}) ←`,
  },
  en: {
    notFoundTitle: "Category Not Found | Plixfy",
    metaTitle: (name: string) =>
      `Explore ${name} - A Library Collection | Plixfy`,
    metaDescription: (name: string) =>
      `A ${name} collection in catalog order. Read device, language, and control information before playing.`,
    h1: (name: string) => `Explore ${name}`,
    bestN: "Library collection",
    ldName: (name: string) => `Explore ${name}`,
    ldDescription: (n: number, name: string) =>
      `A collection of ${n} ${name} games from the Plixfy catalog`,
    ldItemDescription: (title: string) =>
      `${title} — from the game catalog`,
    intro: (n: number, name: string) =>
      `${n} ${name} games in catalog order. This is not a popularity ranking or a first-hand review of every title. Open a game page to read source-declared device, language, and control information before playing.`,
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
    robots: { index: false, follow: true },
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

  // Display order follows the catalog; list positions do not indicate quality.
  const ranked = allInCat.slice(0, TOP_N);

  const url = SITE + href("/best/" + category);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.ldName(meta.name),
    description: copy.ldDescription(ranked.length, meta.name),
    url,
    numberOfItems: ranked.length,
    itemListElement: ranked.map((game, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + href("/play/" + game.slug),
      name: game.title,
      image: game.thumbnail,
      description: copy.ldItemDescription(game.title),
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
      ? uiCopy.ar.intro(ranked.length, meta.name)
      : uiCopy.en.intro(ranked.length, meta.name);

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemListLd, breadcrumbLd]).replace(/</g, "\\u003c"),
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
            <Grid2X2 className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
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
        {ranked.map((game, idx) => (
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
