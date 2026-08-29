"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { trackEvent } from "@/components/GoogleAnalytics";

interface TrackedGameLinkProps {
  href: string;
  slug: string;
  locale: Locale;
  position?: number;
  placement?: string;
  children: ReactNode;
}

export default function TrackedGameLink({
  href,
  slug,
  locale,
  position,
  placement,
  children,
}: TrackedGameLinkProps) {
  return (
    <Link
      href={href}
      className="relative block"
      onClick={() => {
        trackEvent("select_game", {
          game_slug: slug,
          locale,
          position,
          placement,
        });
      }}
      data-game-slug={slug}
      data-position={position}
      data-placement={placement}
    >
      {children}
    </Link>
  );
}
