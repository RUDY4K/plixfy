import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Orbitron, DM_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterAd from '@/components/FooterAd';
import CookieConsent from '@/components/CookieConsent';
import AdSenseScript from '@/components/AdSenseScript';
import AchievementToast from '@/components/AchievementToast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPrompt from '@/components/InstallPrompt';
import MobileBottomNav from '@/components/MobileBottomNav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// Display: Orbitron — geometric, arcade/sci-fi, perfect for the "Neon Arcade"
// brand. Loaded for headings + the wordmark. Body: DM Sans — clean geometric
// sans that pairs with Orbitron without competing for attention.
//
// Variable names use the font's own name (e.g. --font-orbitron) so they
// never collide with Tailwind theme tokens that are also named
// `--font-display`/`--font-body`. globals.css' `--font-display-stack` then
// references these next/font variables.
const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  display: 'swap',
});
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

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
  manifest: '/manifest.webmanifest',
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00C8FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body text-neutral-100 neon-mesh-bg">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        <Header />
        {/* pb on mobile leaves room for the fixed MobileBottomNav so
            content (cards, footer) isn't covered by the nav bar. */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <FooterAd />
        <Footer />
        <CookieConsent />
        <AdSenseScript />
        <AchievementToast />
        <ServiceWorkerRegister />
        <InstallPrompt />
        <MobileBottomNav />
      </body>
    </html>
  );
}
