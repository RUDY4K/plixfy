import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories } from "@/lib/games";
import { hasLocale, localeHref, pageAlternates } from "@/lib/i18n";

const copyByLocale = {
  ar: {
    title: "الفئات | بليكسفاي",
    description: "تصفّح كل فئات الألعاب — سباق، أكشن، ألغاز، رياضة وأكثر.",
    h1: "الفئات",
  },
  en: {
    title: "Categories | Plixfy",
    description:
      "Browse all game categories — racing, action, puzzle, sports and more.",
    h1: "Categories",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/categories">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/categories"),
  };
}

export default async function CategoriesPage({
  params,
}: PageProps<"/[locale]/categories">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        {copy.h1}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={localeHref(locale, "/category/" + cat.slug)}
            className="block bg-surface hover:bg-surface-elevated transition-colors rounded-2xl p-4 md:p-6 min-h-24 flex flex-col items-start justify-center"
          >
            <span className="text-xs text-text-secondary font-latin mb-1">
              {locale === "en" ? cat.labelAr : cat.labelEn}
            </span>
            <span className="text-lg md:text-xl font-bold text-text-primary">
              {locale === "en" ? cat.labelEn : cat.labelAr}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
