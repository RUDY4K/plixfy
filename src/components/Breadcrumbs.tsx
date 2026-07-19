import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getDict, defaultLocale, type Locale } from "@/lib/i18n";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  latin?: boolean;
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  locale?: Locale;
}

export default function Breadcrumbs({ items, locale }: BreadcrumbsProps) {
  const t = getDict(locale ?? defaultLocale);
  return (
    <nav
      aria-label={t.misc.breadcrumbsAria}
      className="text-xs md:text-sm text-text-secondary mb-4 md:mb-5"
    >
      <ol className="flex items-center flex-wrap gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const textClass = item.latin ? "font-latin" : "";
          const content = (
            <span className={textClass} dir={item.latin ? "ltr" : undefined}>
              {item.label}
            </span>
          );

          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 ? (
                <ChevronLeft
                  className="w-3.5 h-3.5 text-text-faint shrink-0 ltr:rotate-180"
                  aria-hidden="true"
                />
              ) : null}
              {isLast || !item.href ? (
                <span
                  className={"text-text-primary font-medium " + textClass}
                  aria-current={isLast ? "page" : undefined}
                  dir={item.latin ? "ltr" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-primary hover:underline transition-colors"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
