import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, pageAlternates } from "@/lib/i18n";

const copyByLocale = {
  ar: {
    title: "المفضلة | بليكسفاي",
    description: "ألعابك المحفوظة في مكان واحد.",
    h1: "المفضلة",
    empty: "لم تضف ألعاب بعد",
    emptyHint: "الألعاب اللي تحبها تطلع هنا",
  },
  en: {
    title: "Favorites | Plixfy",
    description: "Your saved games in one place.",
    h1: "Favorites",
    empty: "No games added yet",
    emptyHint: "Games you love will show up here",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/favorites"),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function FavoritesPage({
  params,
}: PageProps<"/[locale]/favorites">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        {copy.h1}
      </h1>

      <div className="bg-surface rounded-2xl p-8 md:p-12 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <p className="text-base md:text-lg text-text-secondary">
          {copy.empty}
        </p>
        <p className="text-sm text-text-secondary mt-2">
          {copy.emptyHint}
        </p>
      </div>
    </main>
  );
}
