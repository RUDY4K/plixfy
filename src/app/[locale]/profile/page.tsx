import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, pageAlternates } from "@/lib/i18n";

const copyByLocale = {
  ar: {
    title: "الملف الشخصي | بليكسفاي",
    description: "ملفك الشخصي في بليكسفاي.",
    h1: "الملف الشخصي",
    guest: "زائر",
    signInHint: "سجّل علشان تحفظ ألعابك",
    comingSoon: "المزيد من الميزات قريباً",
  },
  en: {
    title: "Profile | Plixfy",
    description: "Your Plixfy profile.",
    h1: "Profile",
    guest: "Guest",
    signInHint: "Sign in to save your games",
    comingSoon: "More features coming soon",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/profile"),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        {copy.h1}
      </h1>

      <div className="bg-surface rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-elevated rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <p className="text-lg md:text-xl font-bold text-text-primary">
              {copy.guest}
            </p>
            <p className="text-sm text-text-secondary">{copy.signInHint}</p>
          </div>
        </div>

        <div className="text-sm text-text-secondary">
          {copy.comingSoon}
        </div>
      </div>
    </main>
  );
}
