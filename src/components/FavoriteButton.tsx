"use client";

import { Heart } from "lucide-react";
import { usePlayerData } from "@/components/PlayerDataProvider";
import type { Locale } from "@/lib/i18n";

export default function FavoriteButton({
  slug,
  locale,
  className = "",
  showLabel = false,
}: {
  slug: string;
  locale: Locale;
  className?: string;
  showLabel?: boolean;
}) {
  const { isFavorite, toggleFavorite } = usePlayerData();
  const active = isFavorite(slug);
  const label = locale === "ar"
    ? active ? "إزالة من المفضلة" : "إضافة إلى المفضلة"
    : active ? "Remove from favorites" : "Add to favorites";

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black shadow-[0_8px_24px_rgba(0,0,0,.25)] backdrop-blur-md transition hover:scale-105 ${
        active
          ? "border-primary/40 bg-primary text-[#090913]"
          : "border-white/10 bg-black/55 text-white hover:bg-black/75"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} aria-hidden="true" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
