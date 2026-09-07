import { headers } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";

type Copy = {
  lang: "ar" | "en";
  dir: "rtl" | "ltr";
  title: string;
  description: string;
  heading: string;
  body: string;
  homeLabel: string;
  homeHref: string;
  alternateLabel: string;
  alternateHref: string;
};

const copy: Record<Copy["lang"], Copy> = {
  ar: {
    lang: "ar",
    dir: "rtl",
    title: "الصفحة غير موجودة | Plixfy",
    description: "هذه الصفحة غير موجودة. ارجع إلى بليكسفاي واستكشف الألعاب المتاحة.",
    heading: "هذه الصفحة خرجت من اللعبة",
    body: "الرابط غير صحيح أو أن الصفحة نُقلت. ارجع إلى المكتبة واختر لعبة تعمل فورًا.",
    homeLabel: "العودة إلى الألعاب",
    homeHref: "/",
    alternateLabel: "View in English",
    alternateHref: "/en",
  },
  en: {
    lang: "en",
    dir: "ltr",
    title: "Page not found | Plixfy",
    description: "This page does not exist. Return to Plixfy and explore available games.",
    heading: "This page left the game",
    body: "The link is incorrect or the page has moved. Return to the library and choose a game that starts right away.",
    homeLabel: "Return to games",
    homeHref: "/en",
    alternateLabel: "عرض بالعربية",
    alternateHref: "/",
  },
};

async function currentCopy(): Promise<Copy> {
  return (await headers()).get("x-plixfy-locale") === "en" ? copy.en : copy.ar;
}

export async function generateMetadata(): Promise<Metadata> {
  const current = await currentCopy();
  return {
    title: current.title,
    description: current.description,
    robots: { index: false, follow: false },
  };
}

export default async function GlobalNotFound() {
  const current = await currentCopy();

  return (
    <html lang={current.lang} dir={current.dir}>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-surface p-8 shadow-2xl shadow-black/30 sm:p-12">
            <p className="font-latin text-sm font-bold tracking-[0.22em] text-accent-2">ERROR 404</p>
            <h1 className="mt-4 text-4xl font-black sm:text-6xl">{current.heading}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">{current.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={current.homeHref}
                className="rounded-xl bg-primary px-6 py-3 font-bold text-[#090913] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2"
              >
                {current.homeLabel}
              </a>
              <a href={current.alternateHref} className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white hover:bg-white/10">
                {current.alternateLabel}
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
