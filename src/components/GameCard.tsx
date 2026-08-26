import Link from "next/link";
import { Crown, Flame, Play, Sparkles } from "lucide-react";
import GameArtwork from "@/components/GameArtwork";
import { categories } from "@/lib/games";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";
import FavoriteButton from "@/components/FavoriteButton";

export type GameBadge = "hot" | "new" | "top" | null;

export interface GameCardProps {
  title: string;
  thumbnail: string;
  thumbnailWide?: string;
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
  const { title, thumbnail, thumbnailWide, slug, badge, position, placement } = props;
  const locale = props.locale ?? defaultLocale;
  const t = getDict(locale);

  const category =
    locale === "en" && props.categorySlug
      ? categories.find((c) => c.slug === props.categorySlug)?.labelEn ??
        props.category
      : props.category;

  return (
    <article className="group relative transition duration-300 hover:-translate-y-1.5 active:scale-[0.97]">
      <Link
        href={localeHref(locale, "/play/" + slug)}
        className="relative block"
        data-game-slug={slug}
        data-position={position}
        data-placement={placement}
      >
      <div
        className="game-card-glow absolute -inset-1 -z-10 rounded-[1.4rem] opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "var(--gradient-card-hover)" }}
        aria-hidden="true"
      />
      <div className="relative aspect-square overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-surface shadow-[0_12px_30px_rgba(0,0,0,.16)] transition-colors group-hover:border-white/15">
        <GameArtwork
          src={thumbnail}
          fallbackSrc={thumbnailWide}
          alt={title}
          fill
          sizes="(max-width: 768px) 33vw, 180px"
          quality={60}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/5 opacity-70 transition-opacity group-hover:opacity-100" />
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-2xl bg-white text-[#090913] opacity-0 shadow-[0_12px_35px_rgba(0,0,0,.28)] transition duration-300 group-hover:scale-100 group-hover:opacity-100">
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        </span>
        {badge ? <Badge type={badge} newLabel={t.common.newBadge} /> : null}
      </div>

      <div className="mt-2.5 px-1">
        <h3
          dir="ltr"
          className="block truncate text-start font-latin text-[15px] font-extrabold tracking-tight text-text-primary transition-colors group-hover:text-white"
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
      <FavoriteButton
        slug={slug}
        locale={locale}
        className="absolute top-2 left-2 h-11 w-11 px-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
      />
    </article>
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
