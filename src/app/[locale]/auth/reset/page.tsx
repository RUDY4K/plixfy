import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/PasswordRecoveryForms";
import { hasLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Choose a new password | Plixfy", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/auth/reset">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <ResetPasswordForm locale={locale} />;
}
