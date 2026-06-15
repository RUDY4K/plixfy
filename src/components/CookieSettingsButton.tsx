"use client";

import { clearConsent } from "@/lib/consent";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => clearConsent()}
      className="text-sm text-text-secondary hover:text-primary transition-colors text-start"
    >
      إعدادات ملفات تعريف الارتباط
    </button>
  );
}
