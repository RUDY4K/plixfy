import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { categories, getCategoryMeta, getCategoryGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
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
  const url = "https://plixfy.com/category/" + slug;
  return {
    title: meta.name + " | بليكسفاي",
    description: meta.description,
    alternates: {
      canonical: "/category/" + slug,
    },
    openGraph: {
      type: "website",
      title: meta.name + " | بليكسفاي",
      description: meta.description,
      url,
      siteName: "Plixfy",
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.name + " | بليكسفاي",
      description: meta.description,
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

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
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
