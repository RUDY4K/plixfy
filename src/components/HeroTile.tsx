import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Crown, Flame, Play } from "lucide-react";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";

export interface HeroTileProps {
  title: string;
  slug: string;
  thumbnail: string;
  category?: string;
  description?: string;
  isTopGame?: boolean;
  locale?: Locale;
}

export default function HeroTile(props: HeroTileProps) {
  const { title, slug, thumbnail, category, isTopGame } = props;
  const locale = props.locale ?? defaultLocale;
  const t = getDict(locale);

  const wrapperClass = isTopGame
    ? "group relative block overflow-hidden rounded-3xl bg-surface mb-8 md:mb-12 mx-4 md:mx-0 shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_2px_rgba(255,0,110,0.6)] glow-pink transition-transform duration-200 active:scale-[0.99]"
    : "group relative block overflow-hidden rounded-3xl bg-surface mb-8 md:mb-12 mx-4 md:mx-0 shadow-[0_20px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] transition-transform duration-200 active:scale-[0.99]";

  return (
    <Link
      href={localeHref(locale, "/play/" + slug)}
      className={wrapperClass}
      aria-label={t.common.playAria + title}
      data-game-slug={slug}
      data-placement={isTopGame ? "hero-top-game" : "hero"}
    >
      <div className="relative aspect-[16/10] md:aspect-[21/9]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />

        {/* Bottom gradient (dark fade up from bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        {/* Side gradient (RTL: darken from right where text sits) */}
        <div className="absolute inset-0 bg-gradient-to-l from-bg/55 via-transparent to-transparent" />
        {/* Diagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-60 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 14px)",
          }}
          aria-hidden="true"
        />

        {/* Premium chip */}
        {isTopGame ? (
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur border border-primary text-white text-xs font-extrabold neon-glow-pink">
            <Flame className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
            <span>{t.common.mostPlayed}</span>
          </div>
        ) : (
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass border border-secondary/40 text-secondary text-xs font-bold shadow-[0_4px_16px_rgba(212,255,0,0.18)]">
            <Crown className="w-3 h-3" aria-hidden="true" />
            <span>{t.common.featured}</span>
          </div>
        )}

        {/* Centered play button with pulse rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 pointer-events-none">
          <div className="hero-pulse-ring" aria-hidden="true" />
          <div className="hero-pulse-ring delayed" aria-hidden="true" />
          <div
            className="absolute inset-3 rounded-full grid place-items-center"
            style={{
              background: "var(--gradient-primary)",
              boxShadow:
                "0 10px 30px rgba(255,0,110,0.45), 0 0 0 2px rgba(255,255,255,0.15), inset 0 2px 0 rgba(255,255,255,0.4)",
            }}
            aria-hidden="true"
          >
            <Play className="w-8 h-8 md:w-7 md:h-7 fill-bg text-bg" />
          </div>
        </div>

        {/* Title + CTA */}
        <div className="absolute bottom-0 right-0 left-0 p-4 md:p-8">
          {category ? (
            <span className="inline-block text-xs md:text-sm text-text-secondary mb-1 md:mb-2 font-medium">
              {category}
            </span>
          ) : null}
          <h2
            className="text-2xl md:text-4xl font-extrabold text-white mb-3 md:mb-4 tracking-tight font-latin"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
            dir="ltr"
          >
            {title}
          </h2>
          <span className="inline-flex items-center gap-1.5 md:gap-1.5 px-4 py-2 md:px-3.5 md:py-1.5 rounded-full bg-white/95 text-bg text-sm md:text-xs font-bold shadow-[0_6px_20px_rgba(255,255,255,0.18)]">
            <span>{t.common.playNow}</span>
            <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5 ltr:rotate-180" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
