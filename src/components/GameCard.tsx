import Image from "next/image";
import Link from "next/link";
import { Crown, Flame, Sparkles, Star } from "lucide-react";
import { getGameStats } from "@/lib/gameStats";
import { categories } from "@/lib/games";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";

export type GameBadge = "hot" | "new" | "top" | null;

export interface GameCardProps {
  title: string;
  thumbnail: string;
  slug: string;
  badge?: GameBadge;
  category?: string;
  categorySlug?: string;
  position?: number;
  placement?: string;
  showStats?: boolean;
  locale?: Locale;
}

export default function GameCard(props: GameCardProps) {
  const { title, thumbnail, slug, badge, position, placement, showStats } = props;
  const locale = props.locale ?? defaultLocale;
  const t = getDict(locale);

  const category =
    locale === "en" && props.categorySlug
      ? categories.find((c) => c.slug === props.categorySlug)?.labelEn ??
        props.category
      : props.category;

  const stats = showStats ? getGameStats(slug) : null;

  return (
    <Link
      href={localeHref(locale, "/play/" + slug)}
      className="group relative block transition-transform duration-200 hover:-translate-y-1 active:scale-[0.94]"
      data-game-slug={slug}
      data-position={position}
      data-placement={placement}
    >
      <div
        className="game-card-glow absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-200 -z-10"
        style={{ background: "var(--gradient-card-hover)" }}
        aria-hidden="true"
      />
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_-30px_60px_rgba(0,0,0,0.35)]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 33vw, 180px"
          quality={60}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
        />
        {badge ? <Badge type={badge} newLabel={t.common.newBadge} /> : null}
        {stats ? (
          <div
            className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm">
              <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>{stats.ratingDisplay}</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm">
              {stats.playsDisplay}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-2 px-1">
        <h3
          dir="ltr"
          className="block text-[15px] font-semibold text-text-primary truncate font-latin tracking-tight text-start group-hover:text-primary transition-colors"
        >
          {title}
        </h3>
        {category ? (
          <p dir="auto" className="text-xs text-text-faint truncate mt-0.5 text-start">
            {category}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function Badge(props: { type: "hot" | "new" | "top"; newLabel: string }) {
  const baseClass =
    "absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-[0_2px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]";

  if (props.type === "hot") {
    return (
      <div
        className={
          baseClass +
          " bg-gradient-to-br from-[#F87171] to-[#FB923C] text-white"
        }
      >
        <Flame className="w-3 h-3" aria-hidden="true" />
        <span>HOT</span>
      </div>
    );
  }

  if (props.type === "new") {
    return (
      <div
        className={
          baseClass + " bg-gradient-to-br from-[#34D399] to-[#10B981] text-bg"
        }
      >
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        <span>{props.newLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={
        baseClass + " bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-bg"
      }
    >
      <Crown className="w-3 h-3" aria-hidden="true" />
      <span>TOP</span>
    </div>
  );
}
