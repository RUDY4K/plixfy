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
  // أثناء الـ prerender يحمل المسار العربي بادئة /ar رغم أن المتصفح يعرضه بدونها
  const path =
    pathname === "/ar" ? "/" : pathname.startsWith("/ar/") ? pathname.slice(3) : pathname;
  if (path.startsWith("/blog") || path.startsWith("/news")) {
    return { href: "/en", label: "English" };
  }
  return { href: path === "/" ? "/en" : "/en" + path, label: "English" };
}

export default function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const { href, label } = targetFor(pathname);

  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors min-h-12"
      }
      rel="alternate"
    >
      <Globe className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
