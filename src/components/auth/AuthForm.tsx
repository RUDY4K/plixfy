"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Gamepad2, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { localeHref, type Locale } from "@/lib/i18n";

const copy = {
  ar: {
    eyebrow: "حساب بليكسفاي",
    title: "احفظ ألعابك وارجع لها من أي جهاز",
    body: "التسجيل اختياري تمامًا. تقدر تواصل اللعب كزائر في أي وقت.",
    google: "الدخول باستخدام Google",
    divider: "أو بالبريد الإلكتروني",
    name: "الاسم الظاهر",
    namePlaceholder: "مثال: لاعب محترف",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordHint: "12 حرفًا على الأقل",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    createTab: "حساب جديد",
    loginTab: "لدي حساب",
    forgot: "نسيت كلمة المرور؟",
    guest: "المتابعة كزائر",
    success: "تم إنشاء الحساب. افحص بريدك لتأكيد التسجيل.",
    error: "تعذر إكمال العملية. تحقق من البيانات وحاول مرة أخرى.",
    setup: "واجهة الحسابات جاهزة، وتحتاج فقط إلى ربط مفاتيح Supabase لتفعيلها.",
    benefit1: "مفضلة متزامنة",
    benefit2: "تابع اللعب من أي جهاز",
    benefit3: "كلمات المرور لا تُخزّن في موقعنا",
  },
  en: {
    eyebrow: "Your Plixfy account",
    title: "Save games and continue on any device",
    body: "Signing up is completely optional. You can always keep playing as a guest.",
    google: "Continue with Google",
    divider: "or use your email",
    name: "Display name",
    namePlaceholder: "Example: Pro Player",
    email: "Email address",
    password: "Password",
    passwordHint: "At least 12 characters",
    signIn: "Sign in",
    signUp: "Create account",
    createTab: "New account",
    loginTab: "I have an account",
    forgot: "Forgot password?",
    guest: "Continue as guest",
    success: "Account created. Check your email to confirm registration.",
    error: "We could not complete that request. Check your details and try again.",
    setup: "The account experience is ready and only needs Supabase keys to activate it.",
    benefit1: "Synced favorites",
    benefit2: "Continue on any device",
    benefit3: "Passwords are never stored by Plixfy",
  },
} as const;

export default function AuthForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabaseClient();

  function callbackUrl(next = "/profile") {
    const params = new URLSearchParams({ locale, next });
    return `${window.location.origin}/api/auth/callback?${params.toString()}`;
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (authError) {
      setError(t.error);
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();

    if (password.length < 12) {
      setError(t.passwordHint);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl(),
          data: { display_name: displayName || undefined },
        },
      });
      if (authError) setError(t.error);
      else if (data.session) window.location.assign(localeHref(locale, "/profile"));
      else setMessage(t.success);
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(t.error);
      else window.location.assign(localeHref(locale, "/profile"));
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_0.9fr] md:px-6 md:py-16">
      <section>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-2/20 bg-accent-2/10 px-3 py-1 text-sm font-bold text-accent-2">
          <Gamepad2 className="h-4 w-4" aria-hidden="true" />
          {t.eyebrow}
        </div>
        <h1 className="max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
          {t.title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-8 text-text-secondary md:text-lg">{t.body}</p>
        <div className="mt-8 grid gap-3 text-sm font-bold text-text-primary sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          {[t.benefit1, t.benefit2, t.benefit3].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/[0.08] bg-surface/80 p-5 shadow-[0_30px_80px_rgba(0,0,0,.32)] backdrop-blur-xl md:p-7">
        {!supabase ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
            {t.setup}
          </div>
        ) : null}

        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-black/20 p-1">
          <button type="button" onClick={() => setMode("login")} className={`min-h-12 rounded-xl px-3 text-sm font-black transition ${mode === "login" ? "bg-white text-[#090913]" : "text-text-secondary hover:text-white"}`}>
            {t.loginTab}
          </button>
          <button type="button" onClick={() => setMode("signup")} className={`min-h-12 rounded-xl px-3 text-sm font-black transition ${mode === "signup" ? "bg-white text-[#090913]" : "text-text-secondary hover:text-white"}`}>
            {t.createTab}
          </button>
        </div>

        {googleAuthEnabled ? (
          <>
            <button type="button" disabled={!supabase || loading} onClick={signInWithGoogle} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 font-black text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white font-latin font-black text-[#4285F4]">G</span>
              {t.google}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-bold text-text-faint">
              <span className="h-px flex-1 bg-white/[0.07]" />
              {t.divider}
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>
          </>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <label className="block text-sm font-bold text-text-secondary">
              {t.name}
              <input name="displayName" type="text" autoComplete="nickname" placeholder={t.namePlaceholder} className="mt-2 min-h-13 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 text-white outline-none transition placeholder:text-text-faint focus:border-accent-2/40" />
            </label>
          ) : null}
          <label className="block text-sm font-bold text-text-secondary">
            {t.email}
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint start-4" aria-hidden="true" />
              <input name="email" type="email" required autoComplete="email" className="min-h-13 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 ps-11 text-white outline-none transition focus:border-accent-2/40" />
            </div>
          </label>
          <label className="block text-sm font-bold text-text-secondary">
            {t.password}
            <input name="password" type="password" required minLength={12} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-2 min-h-13 w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 font-latin text-white outline-none transition focus:border-accent-2/40" />
            <span className="mt-1 block text-xs font-normal text-text-faint">{t.passwordHint}</span>
          </label>

          {error ? <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-red-200">{error}</p> : null}
          {message ? <p role="status" className="rounded-xl bg-success/10 p-3 text-sm text-emerald-200">{message}</p> : null}

          <button type="submit" disabled={!supabase || loading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-accent-2 px-4 font-black text-white shadow-[0_14px_35px_rgba(118,87,255,.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />}
            {mode === "signup" ? t.signUp : t.signIn}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
          <Link href={localeHref(locale, "/auth/forgot")} className="text-accent-2 hover:underline">{t.forgot}</Link>
          <Link href={localeHref(locale, "/")} className="text-text-secondary hover:text-white">{t.guest}</Link>
        </div>
      </section>
    </main>
  );
}
