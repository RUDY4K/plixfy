import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { hasLocale, pageAlternates } from "@/lib/i18n";

export default async function AuthPage({ params }: PageProps<"/[locale]/auth">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <AuthForm locale={locale} />;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/auth">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: locale === "ar" ? "تسجيل الدخول | بليكسفاي" : "Sign in | Plixfy",
    description: locale === "ar" ? "سجّل الدخول لحفظ ألعابك المفضلة وسجل اللعب." : "Sign in to sync your favorites and recently played games.",
    alternates: pageAlternates(locale, "/auth"),
    robots: { index: false, follow: true },
  };
}
