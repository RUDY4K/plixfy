"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, X } from "lucide-react";
import { localeFromPathname, localeHref, getDict } from "@/lib/i18n";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const t = getDict(locale);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClass = scrolled
    ? "sticky top-0 z-50 bg-bg/72 backdrop-blur-xl border-b border-white/5 shadow-[0_1px_0_0_rgba(255,0,110,0.10)] transition-colors duration-300"
    : "sticky top-0 z-50 bg-transparent border-b border-transparent transition-colors duration-300";

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3 md:gap-6">
        <Link
          href={localeHref(locale, "/")}
          className="relative shrink-0 inline-flex items-center min-h-12"
          aria-label={t.header.homeAria}
        >
          <span
            aria-hidden="true"
            className="absolute -start-3 -top-3 w-16 h-16 rounded-full bg-primary/30 blur-2xl pointer-events-none"
          />
          <span className="relative z-10 gradient-text text-2xl md:text-3xl font-bold leading-none">
            {t.brand}
          </span>
        </Link>

        <div className="hidden md:flex flex-1 justify-center">
          <form
            action={localeHref(locale, "/search")}
            role="search"
            className="w-full max-w-md relative"
          >
            <input
              type="search"
              name="q"
              placeholder={t.header.searchPlaceholder}
              className="w-full bg-surface/70 text-text-primary placeholder:text-text-faint rounded-full px-4 py-2.5 ps-10 min-h-12 outline-none border border-white/5 focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(255,0,110,0.18),0_0_24px_rgba(255,0,110,0.45)] transition-all duration-200"
              aria-label={t.header.searchAria}
            />
            <Search
              className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-text-faint pointer-events-none"
              aria-hidden="true"
            />
          </form>
        </div>

        <div className="flex-1 md:hidden" />

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="md:hidden w-12 h-12 inline-flex items-center justify-center text-text-primary rounded-full hover:bg-surface/60 transition-colors"
          aria-label={searchOpen ? t.header.closeSearch : t.header.searchAria}
          aria-expanded={searchOpen}
        >
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>

        <Link
          href={localeHref(locale, "/profile")}
          className="relative p-[2px] rounded-full bg-gradient-to-br from-[#FF006E] via-[#00F0FF] to-[#A100F2] shadow-[0_4px_14px_rgba(255,0,110,0.35)]"
          aria-label={t.header.profileAria}
        >
          <div className="w-9 h-9 rounded-full bg-surface grid place-items-center">
            <User className="w-5 h-5 text-text-primary" aria-hidden="true" />
          </div>
        </Link>
      </div>

      {searchOpen ? (
        <div className="md:hidden border-t border-white/5 bg-bg/85 backdrop-blur-xl px-4 py-3">
          <form
            action={localeHref(locale, "/search")}
            role="search"
            className="relative"
          >
            <input
              type="search"
              name="q"
              placeholder={t.header.searchPlaceholder}
              className="w-full bg-surface/70 text-text-primary placeholder:text-text-faint rounded-full px-4 py-3 ps-10 min-h-12 outline-none border border-white/5 focus:border-primary/40 focus:shadow-[0_0_0_4px_rgba(255,0,110,0.18),0_0_24px_rgba(255,0,110,0.45)] transition-all duration-200"
              aria-label={t.header.searchAria}
              autoFocus
            />
            <Search
              className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-text-faint pointer-events-none"
              aria-hidden="true"
            />
          </form>
        </div>
      ) : null}
    </header>
  );
}
