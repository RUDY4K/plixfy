"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Share2, Check } from "lucide-react";
import { trackEvent } from "./GoogleAnalytics";
import { localeFromPathname, getDict } from "@/lib/i18n";

interface ShareButtonProps {
  slug: string;
  title: string;
  url: string;
}

export default function ShareButton({ slug, title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = getDict(localeFromPathname(usePathname()));

  async function onShare() {
    const params = { game_slug: slug, game_title: title };
    trackEvent("playgama_game_share", params);

    const shareData: ShareData = {
      title: title + " - " + t.brand,
      text: t.common.playAria + title + " " + t.share.freeSuffix,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="flex-1 md:flex-none bg-surface text-text-primary px-5 py-3 rounded-xl min-h-12 inline-flex items-center justify-center gap-2 hover:bg-surface-elevated transition"
      aria-label={t.share.shareAria + title}
      data-game-slug={slug}
    >
      {copied ? (
        <Check className="w-5 h-5 text-primary" aria-hidden="true" />
      ) : (
        <Share2 className="w-5 h-5" aria-hidden="true" />
      )}
      <span className="text-sm font-semibold">
        {copied ? t.share.copied : t.share.share}
      </span>
    </button>
  );
}
