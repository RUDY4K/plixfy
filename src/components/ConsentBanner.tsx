"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { getConsent, setConsent } from "@/lib/consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function onAccept() {
    setConsent("accept");
    setVisible(false);
  }

  function onReject() {
    setConsent("reject");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="إشعار ملفات تعريف الارتباط"
      className="fixed bottom-20 md:bottom-4 inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-30 max-w-3xl mx-auto"
    >
      <div className="glass bg-bg/95 backdrop-blur border border-surface-elevated rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-start md:items-center gap-3 flex-1">
          <Cookie
            className="w-6 h-6 shrink-0 text-primary mt-0.5 md:mt-0"
            aria-hidden="true"
          />
          <div className="text-sm md:text-base text-text-primary leading-relaxed">
            نستخدم ملفات تعريف الارتباط لتحليلات الموقع والإعلانات.
            بالموافقة، توافق على معالجة بياناتك حسب{" "}
            <a
              href="/privacy"
              className="underline text-primary hover:brightness-110"
            >
              سياسة الخصوصية
            </a>
            .
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl min-h-12 bg-surface text-text-primary text-sm font-semibold hover:bg-surface-elevated transition"
            aria-label="رفض"
          >
            رفض
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl min-h-12 bg-primary text-bg text-sm font-bold hover:brightness-110 transition"
            aria-label="موافقة"
          >
            موافقة
          </button>
        </div>
      </div>
    </div>
  );
}
