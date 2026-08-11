import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import SavedGamesGrid from "@/components/SavedGamesGrid";
import { hasLocale, pageAlternates } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: locale === "ar" ? "المفضلة | بليكسفاي" : "Favorites | Plixfy",
    description: locale === "ar" ? "ألعابك المحفوظة في مكان واحد." : "Your saved games in one place.",
    alternates: pageAlternates(locale, "/favorites"),
    robots: { index: false, follow: true },
  };
}

export default async function FavoritesPage({ params }: PageProps<"/[locale]/favorites">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-7 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-6 w-6 fill-current" /></div>
        <div><h1 className="text-3xl font-black text-white md:text-4xl">{locale === "ar" ? "المفضلة" : "Favorites"}</h1><p className="text-sm text-text-secondary">{locale === "ar" ? "تُحفظ على جهازك وتُزامن عند تسجيل الدخول" : "Saved on this device and synced when you sign in"}</p></div>
      </div>
      <SavedGamesGrid locale={locale} mode="favorites" />
    </main>
  );
}
