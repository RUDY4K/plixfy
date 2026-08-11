"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Heart, User, type LucideIcon } from "lucide-react";
import { localeFromPathname, localeHref, getDict } from "@/lib/i18n";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

function isActive(pathname: string, href: string): boolean {
  // Arabic URLs are canonical without a prefix, but the server renders them
  // through an internal /ar rewrite. Normalize both views so hydration sees
  // the same active navigation item.
  const visiblePathname =
    pathname === "/ar"
      ? "/"
      : pathname.startsWith("/ar/")
        ? pathname.slice(3)
        : pathname;

  if (href === "/") {
    return visiblePathname === "/" || visiblePathname === "/en";
  }
  return (
    visiblePathname === href || visiblePathname.startsWith(href + "/")
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const t = getDict(locale);

  const items: readonly NavItem[] = [
    { href: localeHref(locale, "/"), label: t.nav.home, Icon: Home },
    { href: localeHref(locale, "/categories"), label: t.nav.categories, Icon: LayoutGrid },
    { href: localeHref(locale, "/search"), label: t.nav.search, Icon: Search },
    { href: localeHref(locale, "/favorites"), label: t.nav.favorites, Icon: Heart },
    { href: localeHref(locale, "/profile"), label: t.nav.profile, Icon: User },
  ];

  return (
    <nav
      className="glass fixed inset-x-3 z-50 grid grid-cols-5 rounded-[1.4rem] px-1.5 py-2 shadow-[0_18px_50px_rgba(0,0,0,.5)] md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label={t.nav.mainNavAria}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const colorClass = active
          ? "text-white"
          : "text-text-faint";
        const labelWeight = active ? "font-semibold" : "font-medium";
        const iconClass = active
          ? "w-5 h-5 scale-110 text-accent-2 transition-all duration-200"
          : "w-5 h-5 transition-all duration-200";

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={
              "relative flex flex-col items-center justify-center gap-1 min-h-12 transition-all duration-200 " +
              colorClass
            }
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-0.5 h-1 w-4 rounded-full bg-gradient-to-r from-primary to-accent-2 animate-[dotIn_280ms_cubic-bezier(.2,.7,.2,1)]"
              />
            ) : null}
            <item.Icon className={iconClass} aria-hidden="true" />
            <span className={"text-[11px] " + labelWeight}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
