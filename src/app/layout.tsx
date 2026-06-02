import type { Metadata } from "next";
import { Tajawal, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://plixfy.com"),
  title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
  description: "أكثر من 100 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "Plixfy",
    title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
    description: "أكثر من 100 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
    url: "https://plixfy.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plixfy | بليكسفاي - ألعاب أونلاين مجانية",
    description: "أكثر من 100 لعبة موبايل عربية مجانية. العب فوراً من متصفحك بدون تحميل.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${inter.variable}`}>
      <body className="bg-bg text-text-primary antialiased min-h-screen pb-28 md:pb-0 relative ambient-glows overflow-x-hidden">
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-10">
          <Header />
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
