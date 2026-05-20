import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterAd from '@/components/FooterAd';
import CookieConsent from '@/components/CookieConsent';
import AdSenseScript from '@/components/AdSenseScript';
import AchievementToast from '@/components/AchievementToast';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const SITE_NAME = 'Plixfy';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plixfy.example';
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Free Browser Games, No Download Required`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Play 5,000+ free browser games — puzzle, racing, shooting, .io multiplayer, action, sports and more. No downloads, no accounts, plays instantly on desktop and mobile.',
  keywords: [
    'free online games', 'browser games', 'html5 games', 'play games online',
    'io games', 'unblocked games', 'multiplayer games', 'free games no download',
  ],
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Free Browser Games`,
    description: 'Play 5,000+ free casual browser games. No download, no signup, plays instantly.',
    url: SITE_URL,
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Free Browser Games`,
    description: 'Free browser games — play instantly on any device.',
    images: ['/og-default.png'],
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

/**
 * Organization + WebSite schema emitted on every page so AI crawlers
 * (ChatGPT, Perplexity, Claude) and search engines have a single source
 * of brand identity to attach signals to. WebSite includes a sitelinks
 * SearchAction so Google's site-search box can surface in SERPs.
 */
const rootJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-full.svg`,
      sameAs: [
        // Placeholders — replace with real handles when accounts go live.
        'https://twitter.com/plixfy',
        'https://www.facebook.com/plixfy',
        'https://www.instagram.com/plixfy',
        'https://www.tiktok.com/@plixfy',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: 'Free browser games — play instantly, no download required.',
      publisher: { '@id': `${SITE_URL}#org` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}#games`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <FooterAd />
        <Footer />
        <CookieConsent />
        <AdSenseScript />
        <AchievementToast />
      </body>
    </html>
  );
}
