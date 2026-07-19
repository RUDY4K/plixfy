"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { localeFromPathname } from "@/lib/i18n";

/** رابط النسخة المقابلة للصفحة الحالية — المدونة والأخبار عربية فقط فيحوَّل للرئيسية الإنجليزية */
function targetFor(pathname: string): { href: string; label: string } {
  const locale = localeFromPathname(pathname);
  if (locale === "en") {
    const stripped = pathname === "/en" ? "/" : pathname.slice(3);
    return { href: stripped, label: "العربية" };
  }
  if (pathname.startsWith("/blog") || pathname.startsWith("/news")) {
    return { href: "/en", label: "English" };
  }
  return { href: pathname === "/" ? "/en" : "/en" + pathname, label: "English" };
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const { href, label } = targetFor(pathname);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors min-h-12"
      rel="alternate"
    >
      <Globe className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
