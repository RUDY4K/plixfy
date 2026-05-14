import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const SITE_NAME = 'PlayHub';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playhub.example';
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Browser Games, No Download Required`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Play free casual browser games — puzzle, arcade, strategy and word games. No downloads, no accounts, plays instantly on desktop and mobile.',
  keywords: ['free online games', 'browser games', 'html5 games', 'play games online'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Browser Games`,
    description: 'Play free casual browser games. No download, no signup, plays instantly.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Free Browser Games`,
    description: 'Free browser games — play instantly on any device.',
  },
  ...(GSC_VERIFICATION
    ? { verification: { google: GSC_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
