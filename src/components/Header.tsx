"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import { usePlayerData } from "@/components/PlayerDataProvider";
import { localeFromPathname, localeHref, getDict } from "@/lib/i18n";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const t = getDict(locale);
  const { user } = usePlayerData();
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClass = scrolled
    ? "sticky top-0 z-50 border-b border-white/[0.07] bg-bg/88 shadow-[0_12px_35px_rgba(0,0,0,.2)] backdrop-blur-2xl transition-colors duration-300"
    : "sticky top-0 z-50 border-b border-transparent bg-bg/35 backdrop-blur-xl transition-colors duration-300";

  const navItems = [
    { href: localeHref(locale, "/categories"), label: t.nav.categories },
    { href: localeHref(locale, "/news"), label: locale === "ar" ? "الأخبار" : "News" },
    { href: localeHref(locale, "/blog"), label: locale === "ar" ? "المدونة" : "Blog" },
  ];

  return (
    <header className={headerClass}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-4 md:gap-5 md:px-6">
        <BrandLogo locale={locale} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t.nav.mainNavAria}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-bold text-text-secondary transition hover:bg-white/[0.05] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 justify-center md:flex">
          <form
            action={localeHref(locale, "/search")}
            role="search"
            className="relative w-full max-w-md"
          >
            <input
              type="search"
              name="q"
              placeholder={t.header.searchPlaceholder}
              className="min-h-12 w-full rounded-2xl border border-white/[0.07] bg-white/[0.045] px-4 py-2.5 ps-10 text-text-primary outline-none transition-all duration-200 placeholder:text-text-faint focus:border-accent-2/35 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(0,229,255,.07)]"
              aria-label={t.header.searchAria}
            />
            <Search
              className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-text-faint pointer-events-none"
              aria-hidden="true"
            />
          </form>
        </div>

        <div className="flex-1 md:hidden" />

        <LanguageSwitcher className="hidden h-12 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary sm:inline-flex md:px-3" />

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-text-primary transition-colors hover:bg-white/[0.05] md:hidden"
          aria-label={searchOpen ? t.header.closeSearch : t.header.searchAria}
          aria-expanded={searchOpen}
        >
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>

        <Link
          href={localeHref(locale, "/profile")}
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.045] p-1 transition hover:border-white/20 hover:bg-white/[0.08]"
          aria-label={t.header.profileAria}
        >
          <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-surface-elevated">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-text-primary" aria-hidden="true" />
            )}
            {user ? <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-elevated bg-success" aria-hidden="true" /> : null}
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
