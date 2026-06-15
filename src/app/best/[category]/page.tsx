import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Trophy, Star } from "lucide-react";
import {
  categories,
  getCategoryMeta,
  getCategoryGames,
  type CategorySlug,
} from "@/lib/games";
import { getGameStats } from "@/lib/gameStats";
import { categoryContent } from "@/lib/categoryContent";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://www.plixfy.com";
const YEAR = new Date().getFullYear();
const TOP_N = 15;

interface PageParams {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategoryMeta(category);
  if (!meta) {
    return {
      title: "الفئة غير موجودة | بليكسفاي",
      alternates: { canonical: "/categories" },
    };
  }
  const title = `أفضل ${meta.name} ${YEAR} - أعلى ${TOP_N} لعبة | بليكسفاي`;
  const description = `قائمة أفضل ${meta.name} على بليكسفاي لسنة ${YEAR} — مرتّبة حسب الشعبية وعدد اللاعبين. كلها مجانية وتعمل من المتصفح بدون تحميل.`;
  return {
    title,
    description,
    alternates: { canonical: "/best/" + category },
    openGraph: {
      type: "website",
      title,
      description,
      url: SITE + "/best/" + category,
      siteName: "Plixfy",
      locale: "ar_SA",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const revalidate = 86400;

export default async function BestCategoryPage({ params }: PageParams) {
  const { category } = await params;
  const meta = getCategoryMeta(category);
  if (!meta) notFound();

  const allInCat = getCategoryGames(category);
  if (allInCat.length === 0) notFound();

  // Rank by deterministic gameStats playsCount (acts as popularity score)
  const ranked = [...allInCat]
    .map((g) => ({ game: g, stats: getGameStats(g.slug) }))
    .sort((a, b) => b.stats.playsCount - a.stats.playsCount)
    .slice(0, TOP_N);

  const content = categoryContent[category as CategorySlug];
  const url = SITE + "/best/" + category;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `أفضل ${meta.name} ${YEAR}`,
    description: `قائمة أفضل ${ranked.length} لعبة في ${meta.name} على بليكسفاي`,
    url,
    numberOfItems: ranked.length,
    itemListElement: ranked.map(({ game, stats }, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + "/play/" + game.slug,
      name: game.title,
      image: game.thumbnail,
      description:
        game.title + " — " + stats.playsDisplay + " مرة لعب على بليكسفاي",
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE + "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.name,
        item: SITE + "/category/" + category,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `أفضل ${TOP_N}`,
        item: url,
      },
    ],
  };

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
        items={[
          { label: "الرئيسية", href: "/" },
          { label: meta.name, href: "/category/" + category },
          { label: `أفضل ${TOP_N}` },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-primary/15 text-primary">
            <Trophy className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
            أفضل {meta.name} {YEAR}
          </h1>
        </div>
        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          أعلى {ranked.length} لعبة في {meta.name} على بليكسفاي،
          مرتّبة حسب الشعبية وعدد اللاعبين. {content?.metaHooks?.[0] ?? ""}.
          كلها مجانية وتعمل من المتصفح بدون تحميل.
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
              href={"/play/" + game.slug}
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
                  <span>{stats.playsDisplay} مرة لعب</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-10 pt-8 border-t border-surface-elevated">
        <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">
          استكشف المزيد
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
          {allInCat.slice(TOP_N, TOP_N + 6).map((g, idx) => (
            <GameCard
              key={g.slug}
              {...g}
              position={idx + 1}
              placement={"best-extra-" + category}
            />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href={"/category/" + category}
            className="inline-flex items-center min-h-12 px-5 text-primary hover:underline"
          >
            عرض كل {meta.name} ({allInCat.length}) ←
          </Link>
        </div>
      </section>
    </main>
  );
}
