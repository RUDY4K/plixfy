"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";

export default function BrandLogo({
  locale = defaultLocale,
  compact = false,
}: {
  locale?: Locale;
  compact?: boolean;
}) {
  const t = getDict(locale);
  const [direct, setDirect] = useState(false);

  return (
    <Link
      href={localeHref(locale, "/")}
      className="group inline-flex min-h-12 items-center gap-2.5"
      aria-label={t.header.homeAria}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.035] ring-1 ring-white/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <span className="absolute inset-1 rounded-xl bg-[radial-gradient(circle,rgba(0,229,255,.16),transparent_65%)]" />
        <Image
          src="/brand/plixfy-mark-v2-compact.png"
          alt=""
          width={44}
          height={44}
          className="relative h-10 w-10 object-contain"
          sizes="40px"
          loading="lazy"
          unoptimized={direct}
          onError={() => setDirect(true)}
        />
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-latin text-xl font-black tracking-[-0.04em] text-white md:text-2xl">
            Plixfy
          </span>
          <span className="mt-1 hidden text-[10px] font-bold tracking-wide text-text-faint lg:block">
            {locale === "ar" ? "العب فورًا" : "PLAY INSTANTLY"}
          </span>
        </span>
      )}
    </Link>
  );
}
