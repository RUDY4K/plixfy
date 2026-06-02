"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Heart, User, type LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const items: readonly NavItem[] = [
  { href: "/", label: "الرئيسية", Icon: Home },
  { href: "/categories", label: "الفئات", Icon: LayoutGrid },
  { href: "/search", label: "بحث", Icon: Search },
  { href: "/favorites", label: "المفضلة", Icon: Heart },
  { href: "/profile", label: "الملف", Icon: User },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-3 inset-x-3 z-50 glass rounded-3xl px-1.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] grid grid-cols-5"
      aria-label="التنقل الرئيسي"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const colorClass = active ? "text-primary" : "text-text-faint";
        const labelWeight = active ? "font-semibold" : "font-medium";
        const iconClass = active
          ? "w-5 h-5 scale-110 drop-shadow-[0_0_8px_var(--color-primary)] transition-transform"
          : "w-5 h-5 transition-transform";

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={
              "relative flex flex-col items-center justify-center gap-1 min-h-12 transition-colors " +
              colorClass
            }
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-[dotIn_280ms_cubic-bezier(.2,.7,.2,1)]"
              />
            ) : null}
            <item.Icon className={iconClass} aria-hidden="true" />
            <span className={"text-[10px] " + labelWeight}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
