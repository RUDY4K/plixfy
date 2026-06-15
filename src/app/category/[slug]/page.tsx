import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { categories, getCategoryMeta, getCategoryGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrackOnMount from "@/components/TrackOnMount";

const SITE = "https://www.plixfy.com";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

function buildCategoryDescription(name: string, count: number, tagline: string): string {
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

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCategoryMeta(slug);
  if (!meta) {
    return {
      title: "الفئة غير موجودة | بليكسفاي",
      alternates: { canonical: "/categories" },
    };
  }
  const games = getCategoryGames(slug);
  const title = meta.name + " - " + games.length + " لعبة مجاناً | بليكسفاي";
  const description = buildCategoryDescription(meta.name, games.length, meta.description);
  const url = SITE + "/category/" + slug;
  return {
    title,
    description,
    alternates: {
      canonical: "/category/" + slug,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Plixfy",
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageParams) {
  const { slug } = await params;
  const meta = getCategoryMeta(slug);
  const games = getCategoryGames(slug);

  if (!meta || games.length === 0) {
    notFound();
  }

  const url = SITE + "/category/" + slug;
  const description = buildCategoryDescription(meta.name, games.length, meta.description);
  const top10 = games.slice(0, 10);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.name,
    description,
    url,
    inLanguage: "ar",
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
        url: SITE + "/play/" + g.slug,
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
        name: "الرئيسية",
        item: SITE + "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.name,
        item: url,
      },
    ],
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
        items={[
          { label: "الرئيسية", href: "/" },
          { label: meta.name },
        ]}
      />

      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary min-h-12 text-sm mb-2"
        aria-label="العودة إلى الفئات"
      >
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        <span>العودة</span>
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="text-4xl md:text-5xl mb-2" aria-hidden="true">
          {meta.icon}
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          {meta.name}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-1">
          {games.length + " لعبة"}
        </p>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-2xl">
          {meta.description}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
        {games.map((game) => (
          <GameCard key={game.slug} {...game} />
        ))}
      </div>
    </main>
  );
}
