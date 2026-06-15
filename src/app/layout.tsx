import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Tajawal, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PageViewTracker from "@/components/PageViewTracker";
import MonetagServiceWorker from "@/components/MonetagServiceWorker";
import ConsentBanner from "@/components/ConsentBanner";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D001A",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.plixfy.com"),
  applicationName: "Plixfy",
  title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
  description: "أكثر من 370 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "Plixfy",
    title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
    description: "أكثر من 370 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
    url: "https://www.plixfy.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
    description: "أكثر من 370 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://playgama.com" />
        <link rel="dns-prefetch" href="https://playgama.com" />
      </head>
      <body className="bg-bg text-text-primary antialiased min-h-screen pb-32 md:pb-0 relative ambient-glows overflow-x-hidden">
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-10">
          <Header />
          {children}
          <Footer />
          <BottomNav />
        </div>
        <MonetagServiceWorker />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
          </>
        )}
        <ConsentBanner />
      </body>
    </html>
  );
}
