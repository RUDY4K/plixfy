import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allGames,
  getGameBySlug,
  getGamesByCategory,
  getCategoryMeta,
} from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://www.plixfy.com";
const SIMILAR_COUNT = 12;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allGames.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) {
    return {
      title: "اللعبة غير موجودة | بليكسفاي",
      alternates: { canonical: "/" },
    };
  }
  const title = `ألعاب مثل ${game.title} - ${SIMILAR_COUNT} لعبة مشابهة | بليكسفاي`;
  const description = `${SIMILAR_COUNT} لعبة شبيهة بـ ${game.title} في فئة ${game.category} على بليكسفاي. كلها مجانية، تعمل من المتصفح بدون تحميل.`;
  return {
    title,
    description,
    alternates: { canonical: "/play/" + slug + "/like" },
    openGraph: {
      type: "website",
      title,
      description,
      url: SITE + "/play/" + slug + "/like",
      siteName: "Plixfy",
      locale: "ar_SA",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const revalidate = 86400;

export default async function SimilarGamesPage({ params }: PageParams) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const catMeta = getCategoryMeta(game.categorySlug);
  if (!catMeta) notFound();

  const similar = getGamesByCategory(game.categorySlug, [game.slug]).slice(
    0,
    SIMILAR_COUNT,
  );
  if (similar.length === 0) notFound();

  const url = SITE + "/play/" + slug + "/like";

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `ألعاب مثل ${game.title}`,
    description: `${similar.length} لعبة شبيهة بـ ${game.title} في فئة ${catMeta.name}`,
    url,
    numberOfItems: similar.length,
    itemListElement: similar.map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + "/play/" + g.slug,
      name: g.title,
      image: g.thumbnail,
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
        name: catMeta.name,
        item: SITE + "/category/" + game.categorySlug,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: SITE + "/play/" + slug,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "ألعاب مشابهة",
        item: url,
      },
    ],
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
          { label: catMeta.name, href: "/category/" + game.categorySlug },
          { label: game.title, href: "/play/" + slug, latin: true },
          { label: "ألعاب مشابهة" },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <h1
          className="text-2xl md:text-4xl font-bold text-text-primary mb-3"
          dir="rtl"
        >
          ألعاب مثل{" "}
          <span dir="ltr" className="font-latin">
            {game.title}
          </span>
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          إذا أعجبتك <span dir="ltr" className="font-latin font-semibold">{game.title}</span>،
          ستعجبك هذه الـ {similar.length} لعبة المختارة من نفس فئة{" "}
          <strong className="text-text-primary">{catMeta.name}</strong>. كلها
          مجانية على بليكسفاي وتعمل من المتصفح مباشرة بدون تحميل.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={"/play/" + slug}
            className="inline-flex items-center min-h-12 px-5 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition"
            dir="ltr"
          >
            ▶ العب {game.title}
          </Link>
          <Link
            href={"/category/" + game.categorySlug}
            className="inline-flex items-center min-h-12 px-5 rounded-xl bg-surface text-text-primary hover:bg-surface-elevated transition"
          >
            كل ألعاب {catMeta.name}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
        {similar.map((g, idx) => (
          <GameCard
            key={g.slug}
            {...g}
            position={idx + 1}
            placement={"similar-to-" + slug}
          />
        ))}
      </div>
    </main>
  );
}
