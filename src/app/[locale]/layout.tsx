import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Tajawal, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PageViewTracker from "@/components/PageViewTracker";
import AeoReferralTracker from "@/components/AeoReferralTracker";
import WebVitals from "@/components/WebVitals";
import MonetagServiceWorker from "@/components/MonetagServiceWorker";
import ConsentBanner from "@/components/ConsentBanner";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import DeferredAdSense from "@/components/DeferredAdSense";
import PlayerDataProvider from "@/components/PlayerDataProvider";
import {
  locales,
  hasLocale,
  dirFor,
  ogLocaleFor,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";
import { allGames } from "@/lib/games";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "optional",
});

const ADSENSE_CLIENT = "ca-pub-7564871953180369";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "optional",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070712",
};

const titles: Record<Locale, string> = {
  ar: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
  en: "Plixfy - Free Online Games, No Download",
};

const descriptions: Record<Locale, string> = {
  ar: `${allGames.length.toLocaleString("ar-SA")} لعبة مجانية تعمل على الجوال والكمبيوتر. العب فوراً من متصفحك بدون تحميل أو تسجيل.`,
  en: `Play ${allGames.length.toLocaleString("en-US")} free games on mobile and desktop. No download, no sign-up.`,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return {
    metadataBase: new URL("https://www.plixfy.com"),
    applicationName: "Plixfy",
    other: {
      "google-adsense-account": ADSENSE_CLIENT,
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/brand/plixfy-icon-v2-192.png", sizes: "192x192", type: "image/png" },
        { url: "/brand/plixfy-icon-v2-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/brand/plixfy-apple-v2.png", sizes: "180x180", type: "image/png" }],
    },
    title: titles[locale],
    description: descriptions[locale],
    alternates: pageAlternates(locale, "/"),
    openGraph: {
      type: "website",
      locale: ogLocaleFor(locale),
      siteName: "Plixfy",
      title: titles[locale],
      description: descriptions[locale],
      url: locale === "ar" ? "https://www.plixfy.com" : "https://www.plixfy.com/en",
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale],
      description: descriptions[locale],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${tajawal.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://static.playgama.com" />
        <link rel="dns-prefetch" href="https://playgama.com" />
      </head>
      <body className="bg-bg text-text-primary antialiased min-h-screen pb-32 md:pb-0 relative ambient-glows overflow-x-hidden">
        <div className="noise-overlay" aria-hidden="true" />
        <PlayerDataProvider>
          <div className="relative z-10">
            <a
              href="#main-content"
              className="fixed start-4 top-3 z-[120] -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-[#090913] shadow-xl transition-transform focus-visible:translate-y-0"
            >
              {locale === "ar" ? "تجاوز إلى المحتوى" : "Skip to content"}
            </a>
            <Header />
            <div id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </div>
            <Footer locale={locale} />
            <BottomNav />
            <ConsentBanner />
            <InstallAppPrompt locale={locale} />
          </div>
        </PlayerDataProvider>
        <MonetagServiceWorker />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
            <WebVitals />
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            <AeoReferralTracker />
          </>
        )}
        <DeferredAdSense client={ADSENSE_CLIENT} />
        <Analytics />
      </body>
    </html>
  );
}
