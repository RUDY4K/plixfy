"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { localeHref, type Locale } from "@/lib/i18n";

const copy = {
  ar: {
    forgotTitle: "استعادة كلمة المرور",
    forgotBody: "أدخل بريدك وسنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة.",
    resetTitle: "اختر كلمة مرور جديدة",
    resetBody: "استخدم 12 حرفًا على الأقل ولا تعِد استخدام كلمة مرور قديمة.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور الجديدة",
    send: "إرسال رابط الاستعادة",
    update: "حفظ كلمة المرور",
    back: "العودة لتسجيل الدخول",
    sent: "إذا كان البريد مسجلًا فستصلك رسالة الاستعادة خلال دقائق.",
    changed: "تم تحديث كلمة المرور. يمكنك الآن متابعة استخدام حسابك.",
    error: "تعذر إكمال العملية. حاول مرة أخرى.",
    setup: "يجب ربط Supabase أولًا لتفعيل الاستعادة.",
  },
  en: {
    forgotTitle: "Reset your password",
    forgotBody: "Enter your email and we will send a secure link to choose a new password.",
    resetTitle: "Choose a new password",
    resetBody: "Use at least 12 characters and do not reuse an old password.",
    email: "Email address",
    password: "New password",
    send: "Send reset link",
    update: "Save password",
    back: "Back to sign in",
    sent: "If that email is registered, a reset message will arrive within a few minutes.",
    changed: "Password updated. You can now continue using your account.",
    error: "We could not complete that request. Try again.",
    setup: "Supabase must be connected before password recovery can be used.",
  },
} as const;

function Shell({ locale, title, body, children }: { locale: Locale; title: string; body: string; children: React.ReactNode }) {
  const t = copy[locale];
  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-xl items-center px-4 py-12 md:px-6">
      <section className="w-full rounded-[2rem] border border-white/[0.08] bg-surface/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,.3)] md:p-8">
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent-2/10 text-accent-2"><KeyRound className="h-6 w-6" /></div>
        <h1 className="text-3xl font-black text-white">{title}</h1>
        <p className="mt-2 leading-7 text-text-secondary">{body}</p>
        <div className="mt-7">{children}</div>
        <Link href={localeHref(locale, "/auth")} className="mt-6 inline-flex text-sm font-bold text-accent-2 hover:underline">{t.back}</Link>
      </section>
    </main>
  );
}

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const supabase = getBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const params = new URLSearchParams({ locale, next: "/auth/reset" });
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?${params.toString()}`,
    });
    setStatus(t.sent);
    setLoading(false);
  }

  return (
    <Shell locale={locale} title={t.forgotTitle} body={t.forgotBody}>
      {!supabase ? <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">{t.setup}</p> : null}
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block text-sm font-bold text-text-secondary">{t.email}<div className="relative mt-2"><Mail className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint start-4" /><input name="email" type="email" required autoComplete="email" className="min-h-13 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 ps-11 text-white outline-none focus:border-accent-2/40" /></div></label>
        {status ? <p role="status" className="rounded-xl bg-success/10 p-3 text-sm text-emerald-200">{status}</p> : null}
        <button disabled={!supabase || loading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-[#090913] disabled:opacity-50">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{t.send}</button>
      </form>
    </Shell>
  );
}

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const supabase = getBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 12) {
      setError(t.resetBody);
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) setError(t.error);
    else setStatus(t.changed);
    setLoading(false);
  }

  return (
    <Shell locale={locale} title={t.resetTitle} body={t.resetBody}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold text-text-secondary">{t.password}<input name="password" type="password" required minLength={12} autoComplete="new-password" className="mt-2 min-h-13 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 font-latin text-white outline-none focus:border-accent-2/40" /></label>
        {error ? <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-red-200">{error}</p> : null}
        {status ? <p role="status" className="rounded-xl bg-success/10 p-3 text-sm text-emerald-200">{status}</p> : null}
        <button disabled={!supabase || loading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-black text-[#090913] disabled:opacity-50">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{t.update}</button>
      </form>
    </Shell>
  );
}
