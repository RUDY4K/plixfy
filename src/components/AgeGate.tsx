"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const STORAGE_KEY = "plixfy-age-confirmed-13";

interface AgeGateProps {
  children: React.ReactNode;
  category: string;
}

export default function AgeGate({ children, category }: AgeGateProps) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setConfirmed(false);
    }
  }, []);

  // While determining state, render nothing to avoid flash
  if (confirmed === null) return null;
  if (confirmed) return <>{children}</>;

  function confirm() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setConfirmed(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-surface border border-surface-elevated rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-primary/15 text-primary inline-flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 id="age-gate-title" className="text-lg md:text-xl font-bold text-text-primary">
            تأكيد العمر مطلوب
          </h2>
        </div>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed mb-6">
          ألعاب <span className="font-semibold text-text-primary">{category}</span> قد
          تحتوي على محتوى موجّه للفئة العمرية <strong>13 سنة فأكثر</strong>. الرجاء
          تأكيد عمرك للمتابعة.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={confirm}
            className="flex-1 min-h-12 bg-primary text-white font-bold py-3 rounded-xl hover:brightness-110 transition"
          >
            أنا فوق 13 سنة — متابعة
          </button>
          <Link
            href="/"
            className="flex-1 min-h-12 bg-surface-elevated text-text-primary font-semibold py-3 rounded-xl text-center inline-flex items-center justify-center hover:bg-surface transition"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
