import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { getGameBySlug } from "@/lib/games";
import { hasLocale, localeHref, type Locale } from "@/lib/i18n";
import { getPlaygamaEmbedUrl } from "@/lib/playgama";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProgressiveGameLaunchPage({
  params,
}: PageProps<"/[locale]/play/[slug]/launch">) {
  const { locale: rawLocale, slug } = await params;
  if (!hasLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const exitHref = localeHref(locale, `/play/${game.slug}`);
  const exitLabel = locale === "ar" ? "الخروج من اللعبة" : "Exit game";

  return (
    <main
      id="play-frame"
      className="game-launch-viewport fixed inset-0 z-[300] flex w-screen flex-col overflow-hidden bg-black"
    >
      <div
        className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-bg px-3 py-2 shadow-xl"
        style={{
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        }}
      >
        <Link
          href={exitHref}
          aria-label={exitLabel}
          data-game-exit
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-surface-elevated px-3 font-bold text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          <span>{exitLabel}</span>
        </Link>
        <span className="truncate font-latin text-sm font-bold text-text-secondary" dir="auto">
          {game.title}
        </span>
      </div>
      <div
        className="flex min-h-0 flex-1 justify-center bg-black"
        style={{
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        <div
          className="game-launch-stage relative h-full w-full"
          data-game-orientation={game.orientation ?? "both"}
        >
          <iframe
            src={getPlaygamaEmbedUrl(game.slug)}
            title={game.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer-when-downgrade"
            loading="eager"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </main>
  );
}
