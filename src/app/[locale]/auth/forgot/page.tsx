import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/PasswordRecoveryForms";
import { hasLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Password recovery | Plixfy", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/auth/forgot">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <ForgotPasswordForm locale={locale} />;
}
