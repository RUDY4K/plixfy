import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GameLab from "@/components/GameLab";
import { hasLocale, localeHref, pageAlternates } from "@/lib/i18n";

const metadataByLocale = {
  ar: {
    title: "مختبر ألعاب Plixfy | جرّب ألعابنا الأصلية",
    description: "جرّب ثلاثة نماذج ألعاب جوال قصيرة وساعدنا في اختيار أول لعبة أصلية من Plixfy.",
  },
  en: {
    title: "Plixfy Game Lab | Try our original games",
    description: "Try three quick mobile game prototypes and help choose Plixfy's first original game.",
  },
} as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/lab">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = metadataByLocale[locale];
  return {
    ...copy,
    alternates: pageAlternates(locale, "/lab"),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: `https://www.plixfy.com${localeHref(locale, "/lab")}`,
      siteName: "Plixfy",
    },
  };
}

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <main><GameLab locale={locale} /></main>;
}
