"use client";

import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { localeFromPathname, localeHref, getDict } from "@/lib/i18n";

const STORAGE_KEY = "plixfy-age-confirmed-13";

interface AgeGateProps {
  children: React.ReactNode;
  category: string;
}

export default function AgeGate({ children, category }: AgeGateProps) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const locale = localeFromPathname(usePathname());
  const t = getDict(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setConfirmed(false);
    }
  }, []);

  useEffect(() => {
    if (confirmed !== false) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    confirmRef.current?.focus();
  }, [confirmed]);

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
    requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
    });
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-description"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={trapFocus}
      className="fixed inset-0 z-[100] m-0 h-screen w-screen max-h-none max-w-none border-0 bg-bg/95 p-4 text-text-primary backdrop-blur open:flex open:items-center open:justify-center"
    >
      <div className="max-w-md w-full bg-surface border border-surface-elevated rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-primary/15 text-primary inline-flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 id="age-gate-title" className="text-lg md:text-xl font-bold text-text-primary">
            {t.ageGate.title}
          </h2>
        </div>
        <p id="age-gate-description" className="text-sm md:text-base text-text-secondary leading-relaxed mb-6">
          {t.ageGate.bodyPrefix}{" "}
          <span className="font-semibold text-text-primary">{category}</span>{" "}
          {t.ageGate.bodyAgeNote} <strong>13+</strong>. {t.ageGate.bodyConfirm}
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            ref={confirmRef}
            onClick={confirm}
            className="flex-1 min-h-12 bg-primary text-[#090913] font-bold py-3 rounded-xl hover:brightness-110 transition"
          >
            {t.ageGate.confirm}
          </button>
          <Link
            href={localeHref(locale, "/")}
            className="flex-1 min-h-12 bg-surface-elevated text-text-primary font-semibold py-3 rounded-xl text-center inline-flex items-center justify-center hover:bg-surface transition"
          >
            {t.ageGate.backHome}
          </Link>
        </div>
      </div>
    </dialog>
  );
}
