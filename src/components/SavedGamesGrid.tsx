"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Gamepad2, Heart, LoaderCircle, Play } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { usePlayerData } from "@/components/PlayerDataProvider";
import { localeHref, type Locale } from "@/lib/i18n";

interface SavedGame {
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  categorySlug: string;
}

const copy = {
  ar: {
    favoritesTitle: "ألعابك المفضلة",
    recentTitle: "تابع اللعب",
    favoriteEmpty: "لم تحفظ أي لعبة بعد",
    recentEmpty: "ابدأ أي لعبة وستظهر هنا تلقائيًا",
    explore: "استكشف الألعاب",
    play: "العب الآن",
  },
  en: {
    favoritesTitle: "Your favorites",
    recentTitle: "Continue playing",
    favoriteEmpty: "You have not saved any games yet",
    recentEmpty: "Start any game and it will appear here automatically",
    explore: "Explore games",
    play: "Play now",
  },
} as const;

export default function SavedGamesGrid({ locale, mode }: { locale: Locale; mode: "favorites" | "recent" }) {
  const { favorites, recentGames } = usePlayerData();
  const slugs = useMemo(
    () => mode === "favorites" ? [...favorites] : recentGames.map((item) => item.slug),
    [favorites, recentGames, mode],
  );
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    if (slugs.length === 0) {
      setGames([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/games?slugs=${encodeURIComponent(slugs.join(","))}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setGames(Array.isArray(payload.games) ? payload.games : []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [slugs.join(",")]);

  if (loading && games.length === 0) {
    return <div className="grid min-h-48 place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-accent-2" aria-label="Loading" /></div>;
  }

  if (games.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/[0.1] bg-white/[0.025] px-5 py-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.05] text-accent-2">
          {mode === "favorites" ? <Heart className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
        </div>
        <h2 className="mt-4 text-xl font-black text-white">{mode === "favorites" ? t.favoriteEmpty : t.recentEmpty}</h2>
        <Link href={localeHref(locale, "/all-games")} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-black text-[#090913]">
          <Gamepad2 className="h-4 w-4" /> {t.explore}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <article key={game.slug} className="group relative">
          <Link href={localeHref(locale, `/play/${game.slug}`)} className="block transition duration-300 hover:-translate-y-1">
            <div className="relative aspect-square overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-surface shadow-[0_14px_35px_rgba(0,0,0,.2)]">
              <Image src={game.thumbnail} alt={game.title} fill sizes="(max-width: 640px) 50vw, 220px" quality={60} className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-black text-white backdrop-blur"><Play className="h-3 w-3 fill-current" />{t.play}</span>
            </div>
            <h3 dir="ltr" className="mt-2 truncate px-1 text-start font-latin text-sm font-black text-white">{game.title}</h3>
            <p className="truncate px-1 text-start text-xs text-text-faint">{game.category}</p>
          </Link>
          <FavoriteButton slug={game.slug} locale={locale} className="absolute top-2 start-2 h-11 w-11 px-0" />
        </article>
      ))}
    </div>
  );
}
