import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GameCard, { type GameCardProps } from "@/components/GameCard";

export interface CategoryStripProps {
  title: string;
  viewAllHref?: string;
  games: readonly GameCardProps[];
}

const STRIP_LIMIT = 12;

export default function CategoryStrip(props: CategoryStripProps) {
  const { title, viewAllHref, games } = props;
  const visibleGames = games.slice(0, STRIP_LIMIT);

  return (
    <section className="mb-8 md:mb-12">
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="w-1 h-5 rounded-sm shadow-[0_0_12px_rgba(255,0,110,0.55)]"
            style={{ background: "var(--gradient-primary)" }}
          />
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary">
            {title}
          </h2>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-1 text-primary hover:text-accent-2 transition-colors text-sm font-semibold min-h-12 px-2"
            aria-label={"عرض الكل: " + title}
          >
            <span>عرض الكل</span>
            <ArrowLeft
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>

      <div className="md:hidden relative">
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none"
        />
        <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 pb-2 scrollbar-hide">
          {visibleGames.map((game) => (
            <div
              key={game.slug}
              className="snap-start shrink-0"
              style={{ width: "130px" }}
            >
              <GameCard {...game} />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-6 md:gap-6">
        {visibleGames.map((game) => (
          <GameCard key={game.slug} {...game} />
        ))}
      </div>
    </section>
  );
}
