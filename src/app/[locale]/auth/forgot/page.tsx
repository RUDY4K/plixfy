import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/PasswordRecoveryForms";
import { hasLocale, pageAlternates } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/auth/forgot">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: locale === "ar" ? "استعادة كلمة المرور | بليكسفاي" : "Password recovery | Plixfy",
    alternates: pageAlternates(locale, "/auth/forgot"),
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/auth/forgot">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <ForgotPasswordForm locale={locale} />;
}
