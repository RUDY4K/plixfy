import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfilePanel from "@/components/ProfilePanel";
import { hasLocale, pageAlternates } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: locale === "ar" ? "الملف الشخصي | بليكسفاي" : "Profile | Plixfy",
    description: locale === "ar" ? "مفضلتك وسجل ألعابك في بليكسفاي." : "Your favorites and play history on Plixfy.",
    alternates: pageAlternates(locale, "/profile"),
    robots: { index: false, follow: true },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12"><ProfilePanel locale={locale} /></main>;
}
