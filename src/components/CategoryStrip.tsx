import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GameCard, { type GameCardProps } from "@/components/GameCard";
import { getDict, defaultLocale, type Locale } from "@/lib/i18n";

export interface CategoryStripProps {
  title: string;
  viewAllHref?: string;
  games: readonly GameCardProps[];
  locale?: Locale;
}

// One complete desktop row keeps the homepage fast while category pages retain
// access to the full catalogue.
const STRIP_LIMIT = 6;

export default function CategoryStrip(props: CategoryStripProps) {
  const { title, viewAllHref, games } = props;
  const locale = props.locale ?? defaultLocale;
  const t = getDict(locale);
  const visibleGames = games.slice(0, STRIP_LIMIT);

  return (
    <section className="mb-9 md:mb-14">
      <div className="mb-4 flex items-end justify-between px-4 md:px-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-6 w-1 rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          />
          <h2 className="text-xl font-black tracking-tight text-text-primary md:text-2xl">
            {title}
          </h2>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="group inline-flex min-h-12 items-center gap-1 rounded-xl px-2 text-sm font-bold text-text-secondary transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-label={t.common.viewAllAria + title}
          >
            <span>{t.common.viewAll}</span>
            <ArrowLeft
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="md:hidden absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="md:hidden absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none"
        />
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth px-4 pb-3 md:grid md:grid-cols-6 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {visibleGames.map((game) => (
            <div
              key={game.slug}
              className="w-[142px] shrink-0 snap-start md:w-auto"
            >
              <GameCard {...game} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
