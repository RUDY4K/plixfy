import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { categories, getCategoryGames } from "@/lib/games";
import type { CategorySlug } from "@/lib/games";
import { categoryContent } from "@/lib/categoryContent";
import { getLocalizedCategoryMeta } from "@/lib/categoryI18n";
import { getPostsByCategory } from "@/lib/blog";
import { getPostsEnByCategory } from "@/lib/blogEn";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrackOnMount from "@/components/TrackOnMount";
import AgeGate from "@/components/AgeGate";
import {
  locales,
  hasLocale,
  localeHref,
  getDict,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

// trending و top صفحات ديناميكية إضافية إلى جانب التصنيفات الثابتة
const extraSlugs = ["trending", "top"] as const;

export async function generateStaticParams() {
  const slugs = [...categories.map((c) => c.slug), ...extraSlugs];
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

function buildCategoryDescription(
  locale: Locale,
  name: string,
  count: number,
  tagline: string
): string {
  if (locale === "en") {
    return (
      name +
      " - " +
      count +
      " free online games on Plixfy. " +
      tagline +
      ". No download needed — play right in your browser!"
    );
  }
  return (
    "فئة " +
    name +
    " - " +
    count +
    " لعبة مجانية أونلاين على بليكسفاي. " +
    tagline +
    " بدون تحميل، من متصفحك مباشرة. العب الآن!"
  );
}

const uiCopy = {
  ar: {
    notFoundTitle: "الفئة غير موجودة | بليكسفاي",
    metaTitle: (name: string, count: number) =>
      name + " - " + count + " لعبة مجاناً | بليكسفاي",
    gamesCount: (n: number) => n + " لعبة",
    backAria: "العودة إلى الفئات",
    back: "العودة",
    bestIn: (name: string) => "🏆 أفضل " + name + " في 2026",
    relatedCats: "تصنيفات ذات صلة",
  },
  en: {
    notFoundTitle: "Category Not Found | Plixfy",
    metaTitle: (name: string, count: number) =>
      name + " - " + count + " Free Games | Plixfy",
    gamesCount: (n: number) => n + " games",
    backAria: "Back to categories",
    back: "Back",
    bestIn: (name: string) => "🏆 Best " + name + " in 2026",
    relatedCats: "Related Categories",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/category/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = uiCopy[locale];
  const meta = getLocalizedCategoryMeta(slug, locale);
  if (!meta) {
    return {
      title: copy.notFoundTitle,
      alternates: { canonical: localeHref(locale, "/categories") },
    };
  }
  const games = getCategoryGames(slug);
  const title = copy.metaTitle(meta.name, games.length);
  const description = buildCategoryDescription(
    locale,
    meta.name,
    games.length,
    meta.description
  );
  const path = "/category/" + slug;
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/[locale]/category/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const copy = uiCopy[locale];
  const href = (path: string) => localeHref(locale, path);
  const meta = getLocalizedCategoryMeta(slug, locale);
  const games = getCategoryGames(slug);

  if (!meta || games.length === 0) {
    notFound();
  }

  const url = SITE + href("/category/" + slug);
  const description = buildCategoryDescription(
    locale,
    meta.name,
    games.length,
    meta.description
  );
  const top10 = games.slice(0, 10);
  // المحتوى التحريري العربي يُعرض في النسخة العربية فقط
  const content = locale === "ar" ? categoryContent[slug as CategorySlug] ?? null : null;
  const relatedForLinks = categoryContent[slug as CategorySlug]?.related ?? [];
  const relatedPosts =
    locale === "en"
      ? getPostsEnByCategory(slug as CategorySlug)
      : getPostsByCategory(slug as CategorySlug);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.name,
    description,
    url,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Plixfy",
      url: SITE,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: top10.map((g, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: SITE + href("/play/" + g.slug),
        name: g.title,
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t.nav.home,
        item: SITE + href("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.name,
        item: url,
      },
    ],
  };

  const requiresAgeGate = slug === "shooting";

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {requiresAgeGate ? <AgeGate category={meta.name}>{null}</AgeGate> : null}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <TrackOnMount
        eventName="category_view"
        dedupKey={`category_view:${slug}`}
        params={{ category: slug, category_name: meta.name, game_count: games.length }}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: t.nav.home, href: href("/") },
          { label: meta.name },
        ]}
      />

      <Link
        href={href("/categories")}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary min-h-12 text-sm mb-2"
        aria-label={copy.backAria}
      >
        <ArrowRight className="w-4 h-4 ltr:rotate-180" aria-hidden="true" />
        <span>{copy.back}</span>
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="text-4xl md:text-5xl mb-2" aria-hidden="true">
          {meta.icon}
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          {meta.name}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-1">
          {copy.gamesCount(games.length)}
        </p>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-2xl">
          {meta.description}
        </p>
        {content ? (
          <div className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl">
            {content.intro}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          {slug !== "trending" && slug !== "top" ? (
            <Link
              href={href("/best/" + slug)}
              className="inline-flex items-center min-h-12 px-4 rounded-xl bg-primary/15 text-primary text-sm font-bold hover:bg-primary/25 transition"
            >
              {copy.bestIn(meta.name)}
            </Link>
          ) : null}
          {relatedPosts.map((post) => (
            <Link
              key={post.slug}
              href={href("/blog/" + post.slug)}
              className="inline-flex items-center min-h-12 px-4 rounded-xl bg-surface-secondary text-text-primary text-sm font-bold hover:bg-primary/15 hover:text-primary transition"
            >
              📖 {post.h1}
            </Link>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
        {games.map((game, idx) => (
          <GameCard
            key={game.slug}
            {...game}
            locale={locale}
            position={idx + 1}
            placement={"category-" + slug}
            showStats
          />
        ))}
      </div>

      {relatedForLinks.length > 0 ? (
        <section
          className="mt-12 pt-8 border-t border-border"
          aria-labelledby="related-cats"
        >
          <h2
            id="related-cats"
            className="text-lg md:text-xl font-bold text-text-primary mb-4"
          >
            {copy.relatedCats}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedForLinks.map((relSlug) => {
              const rel = getLocalizedCategoryMeta(relSlug, locale);
              if (!rel) return null;
              return (
                <Link
                  key={relSlug}
                  href={href("/category/" + relSlug)}
                  className="px-4 py-2 rounded-full bg-surface-secondary text-text-primary hover:bg-primary/15 hover:text-primary transition-colors"
                >
                  {rel.name}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
