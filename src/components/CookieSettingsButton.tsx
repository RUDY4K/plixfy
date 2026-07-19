"use client";

import { usePathname } from "next/navigation";
import { clearConsent } from "@/lib/consent";
import { localeFromPathname, getDict } from "@/lib/i18n";

export default function CookieSettingsButton() {
  const t = getDict(localeFromPathname(usePathname()));

  return (
    <button
      type="button"
      onClick={() => clearConsent()}
      className="text-sm text-text-secondary hover:text-primary transition-colors text-start"
    >
      {t.consent.cookieSettings}
    </button>
  );
}
