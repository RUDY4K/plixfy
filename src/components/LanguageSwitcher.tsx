"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { localeFromPathname } from "@/lib/i18n";

/** رابط النسخة المقابلة للصفحة الحالية — نفس الـ slug متوفر بالعربي والإنجليزي */
function targetFor(pathname: string, query: string): { href: string; label: string } {
  const locale = localeFromPathname(pathname);
  const withQuery = (href: string) => (query ? `${href}?${query}` : href);
  if (locale === "en") {
    const stripped = pathname === "/en" ? "/" : pathname.slice(3);
    return { href: withQuery(stripped), label: "العربية" };
  }
  // أثناء الـ prerender يحمل المسار العربي بادئة /ar رغم أن المتصفح يعرضه بدونها
  const path =
    pathname === "/ar" ? "/" : pathname.startsWith("/ar/") ? pathname.slice(3) : pathname;
  return { href: withQuery(path === "/" ? "/en" : "/en" + path), label: "English" };
}

function LanguageSwitcherLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { href, label } = targetFor(pathname, searchParams.toString());

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

export default function LanguageSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<span aria-hidden="true" className={className} />}>
      <LanguageSwitcherLink className={className} />
    </Suspense>
  );
}
