import Link from "next/link";
import { ArrowLeft, Gamepad2, Play, Rocket, Smartphone } from "lucide-react";
import GameArtwork from "@/components/GameArtwork";
import { localeHref, type Locale } from "@/lib/i18n";

interface HomeHeroProps {
  locale: Locale;
  heading: string;
  summary: string;
  gameCount: number;
  game: {
    title: string;
    slug: string;
    thumbnail: string;
    thumbnailWide?: string;
    category?: string;
  };
}

export default function HomeHero({ locale, heading, summary, gameCount, game }: HomeHeroProps) {
  const isArabic = locale === "ar";
  const href = (path: string) => localeHref(locale, path);
  const number = gameCount.toLocaleString(isArabic ? "ar-SA" : "en-US");

  return (
    <section className="relative mx-4 mb-7 min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-[0_30px_100px_rgba(0,0,0,.42)] md:mx-0 md:min-h-[520px] md:rounded-[2.5rem]">
      <GameArtwork
        src={game.thumbnailWide || game.thumbnail}
        fallbackSrc={game.thumbnail}
        alt={game.title}
        fill
        sizes="(max-width: 768px) 100vw, 1280px"
        quality={75}
        className="object-cover object-center md:object-[70%_center]"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,18,.08)_0%,rgba(7,7,18,.7)_55%,#070712_100%)] md:bg-[linear-gradient(90deg,#070712_0%,rgba(7,7,18,.94)_38%,rgba(7,7,18,.38)_74%,rgba(7,7,18,.12)_100%)] rtl:md:bg-[linear-gradient(270deg,#070712_0%,rgba(7,7,18,.94)_38%,rgba(7,7,18,.38)_74%,rgba(7,7,18,.12)_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,rgba(0,229,255,.15),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(255,45,139,.16),transparent_32%)]" />

      <div className="relative z-10 flex min-h-[560px] max-w-2xl flex-col justify-end p-5 pb-7 md:min-h-[520px] md:justify-center md:p-12 lg:p-16">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_rgba(6,255,165,.8)]" />
          {isArabic ? "مئات الألعاب جاهزة الآن" : "Hundreds of games ready now"}
        </div>

        <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.035em] text-white md:text-6xl md:leading-[1.04]">
          {heading}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-lg md:leading-8">
          {summary}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={href(`/play/${game.slug}`)}
            className="group inline-flex min-h-13 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#090913] shadow-[0_14px_35px_rgba(255,255,255,.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-accent-2"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white">
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            </span>
            {isArabic ? "ابدأ بلعبة اليوم" : "Play today's pick"}
          </Link>
          <Link
            href={href("/all-games")}
            className="inline-flex min-h-13 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/10"
          >
            {isArabic ? "استكشف كل الألعاب" : "Explore all games"}
            <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-white/60 md:text-sm">
          <span className="inline-flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-accent-2" />{number} {isArabic ? "لعبة" : "games"}</span>
          <span className="inline-flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" />{isArabic ? "بدون تحميل" : "No download"}</span>
          <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-accent-3" />{isArabic ? "جوال وكمبيوتر" : "Mobile & desktop"}</span>
        </div>

        <Link
          href={href(`/play/${game.slug}`)}
          className="mt-7 flex w-fit max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-2 pe-4 backdrop-blur-xl transition hover:border-primary/40 hover:bg-black/50"
        >
          <GameArtwork src={game.thumbnail} fallbackSrc={game.thumbnailWide} alt="" width={52} height={52} className="h-13 w-13 rounded-xl object-cover" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold text-primary">{isArabic ? "اختيار بليكسفاي اليوم" : "PLIXFY PICK TODAY"}</span>
            <span dir="ltr" className="block truncate font-latin text-sm font-extrabold text-white">{game.title}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
