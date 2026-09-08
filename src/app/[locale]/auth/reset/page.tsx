import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/PasswordRecoveryForms";
import { hasLocale, pageAlternates } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/auth/reset">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: locale === "ar" ? "تعيين كلمة مرور جديدة | بليكسفاي" : "Choose a new password | Plixfy",
    alternates: pageAlternates(locale, "/auth/reset"),
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/auth/reset">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <ResetPasswordForm locale={locale} />;
}
