"use client";

import Link from "next/link";
import { Cloud, Gamepad2, Heart, LogIn, LogOut, UserRound } from "lucide-react";
import SavedGamesGrid from "@/components/SavedGamesGrid";
import { usePlayerData } from "@/components/PlayerDataProvider";
import { localeHref, type Locale } from "@/lib/i18n";

const copy = {
  ar: {
    guest: "أنت تلعب كزائر",
    guestBody: "مفضلتك وسجل اللعب محفوظان على هذا الجهاز. سجّل الدخول لمزامنتهما مع بقية أجهزتك.",
    signIn: "تسجيل الدخول أو إنشاء حساب",
    keepPlaying: "متابعة اللعب كزائر",
    signedIn: "تم تسجيل الدخول",
    synced: "بياناتك متزامنة بأمان",
    favorites: "المفضلة",
    recent: "آخر الألعاب",
    viewFavorites: "عرض كل المفضلة",
    signOut: "تسجيل الخروج",
    setup: "نظام الحسابات جاهز محليًا وينتظر ربط Supabase لتفعيل التسجيل السحابي.",
  },
  en: {
    guest: "You are playing as a guest",
    guestBody: "Favorites and play history are saved on this device. Sign in to sync them across devices.",
    signIn: "Sign in or create an account",
    keepPlaying: "Keep playing as guest",
    signedIn: "Signed in",
    synced: "Your data is securely synced",
    favorites: "Favorites",
    recent: "Recent games",
    viewFavorites: "View all favorites",
    signOut: "Sign out",
    setup: "The account system is ready locally and only needs Supabase connected to enable cloud sign-in.",
  },
} as const;

export default function ProfilePanel({ locale }: { locale: Locale }) {
  const { user, authLoading, authConfigured, favorites, recentGames, signOut } = usePlayerData();
  const t = copy[locale];

  if (authLoading) {
    return <div className="h-64 animate-pulse rounded-[2rem] border border-white/[0.06] bg-white/[0.035]" />;
  }

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0];
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-surface/75 shadow-[0_26px_70px_rgba(0,0,0,.28)]">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-accent-2" />
        <div className="p-5 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-white/[0.05] text-accent-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : user ? (
                  <span className="font-latin text-2xl font-black">{String(displayName ?? "P").slice(0, 1).toUpperCase()}</span>
                ) : (
                  <UserRound className="h-8 w-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-success"><Cloud className="h-4 w-4" />{user ? t.signedIn : t.guest}</div>
                <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{user ? displayName : t.guest}</h1>
                <p dir="ltr" className="font-latin text-sm text-text-faint">{user?.email}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">{user ? t.synced : t.guestBody}</p>
              </div>
            </div>

            {user ? (
              <button type="button" onClick={() => void signOut()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 font-bold text-white hover:bg-white/[0.08]"><LogOut className="h-4 w-4" />{t.signOut}</button>
            ) : (
              <div className="flex flex-col gap-2 sm:items-end">
                <Link href={localeHref(locale, "/auth")} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-[#090913]"><LogIn className="h-4 w-4" />{t.signIn}</Link>
                <Link href={localeHref(locale, "/all-games")} className="text-center text-sm font-bold text-text-secondary hover:text-white">{t.keepPlaying}</Link>
              </div>
            )}
          </div>

          {!authConfigured ? <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">{t.setup}</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"><Heart className="h-5 w-5 text-primary" /><strong className="mt-2 block font-latin text-2xl text-white">{favorites.length}</strong><span className="text-sm text-text-secondary">{t.favorites}</span></div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"><Gamepad2 className="h-5 w-5 text-accent-2" /><strong className="mt-2 block font-latin text-2xl text-white">{recentGames.length}</strong><span className="text-sm text-text-secondary">{t.recent}</span></div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white">{t.recent}</h2>
          <Link href={localeHref(locale, "/favorites")} className="text-sm font-bold text-accent-2 hover:underline">{t.viewFavorites}</Link>
        </div>
        <SavedGamesGrid locale={locale} mode="recent" />
      </section>
    </>
  );
}
