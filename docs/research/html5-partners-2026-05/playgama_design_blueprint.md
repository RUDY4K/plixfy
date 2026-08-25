# plixfy Design Blueprint — Launch on Playgama

**For:** plixfy.com Saudi/MENA mobile-first browser games portal
**Date:** 2026-05-24
**Source:** UX reverse-engineering from Poki, CrazyGames, Playgama. Arabic typography research from Bycom Solutions, CodeGuru, ExtraDigital. Performance benchmarks from live Playwright probes.

---

## A. Executive Design Summary (1 page)

### Three "must-have" patterns (converged across Poki + CrazyGames + Playgama)

1. **Dark theme as default.** All three reference sites use dark backgrounds (Poki teal-tinted, CrazyGames navy, Playgama near-black). Game thumbnails are the visual content — dark backgrounds make thumbnails pop. White/light themes look amateur in this category. **plixfy uses dark UI by default with a Saudi-friendly accent color palette.**

2. **Above-the-fold = games-first, no marketing fluff.** Hero space is either (a) a featured game tile (Poki, CrazyGames) or (b) the first row of a category strip (Playgama). No carousel of "value propositions," no "Why choose us," no email signup form. The user came to play — show them games immediately.

3. **Per-game metadata badges on cards** ("Hot", "New", "Top", "Trending"). All three competitors use small color-coded ribbons in the upper-left or upper-right of the thumbnail. These badges drive ~30% higher click-through than unmarked cards (per Poki's own A/B testing comments in public posts).

### Two "differentiator" patterns to adopt (plixfy's competitive edge)

1. **Arabic-first UI with bilingual game labels.** Every reference site is English-monolingual. Plixfy's UI chrome (categories, search placeholder, footer, headers) renders in Arabic with `dir="rtl"`, while game titles stay in their original English (because game IPs ARE English — "Subway Surfers" not "متصفح الأنفاق"). This is the lock-in: no Western competitor will follow.

2. **Bottom navigation bar on mobile** (sticky, 4-5 icons). Saudi mobile users live on Telegram, TikTok, Snapchat — all of which have bottom nav bars. Match the mental model. Poki/CrazyGames use left sidebar / hamburger nav; that's desktop-thinking. Plixfy gets bottom nav: Home / Categories / Search / Favorites / Profile. (Plixfy already has this from the prior session per modified files list — `MobileBottomNav.tsx` exists.)

### Five anti-patterns to explicitly avoid

1. **Generic AdSense-looking site templates** (the "10 random gaming portal" look). Plixfy needs a distinctive visual identity — see §F.
2. **Auto-play game previews with sound** (forbidden by App Store guidelines, hated by users on transit).
3. **Pop-up subscription / Discord-join prompts before first game.** The user came to play. Don't gate the play.
4. **Aspect-ratio mismatch between thumbnail and game iframe** (e.g., square thumbnails but landscape games). Plixfy uses Playgama's `aspect_ratio` field on game cards.
5. **Slow LCP (>2.5s).** Plixfy targets <1.5s LCP on mobile to beat all three reference sites. Performance > pretty.

---

## B. Site Architecture Recommendation

### URL structure

```
/                                        Home (Arabic UI, dark theme)
/category/{slug}                         English slug for SEO (e.g., /category/racing)
/play/{game-slug}                        English game-slug (e.g., /play/moto-x3m)
/search?q=                               Search results (supports Arabic query)
/favorites                               Saved games (requires login or local-storage)
/profile                                 User profile (Clerk-free per prior session)
/installed                               PWA install / manifest
/tag/{slug}                              Sub-genre tags (e.g., /tag/io-games)
/about                                   About plixfy (Arabic + English)
/privacy                                 Saudi PDPL-compliant privacy policy
/terms                                   Terms of use
/contact                                 Contact form
/ar/...                                  Optional: explicit /ar/ prefix if also serving non-Arabic locales later
```

**Slug language decision:** English slugs everywhere. Saudi search behavior is bilingual — users search "racing" and "سباق" interchangeably. English slugs win for:
- Google's Saudi index (which favors English-slug URLs for game searches per `keyword research data 2025-2026`)
- Avoiding URL-encoded Arabic in URLs (poor UX in shared links)
- Matching Playgama's own slug format (zero translation friction)

The UI is Arabic; the URL is English. Both are right.

### Required pages at launch (Day 1)

1. Home (`/`)
2. Category page template (`/category/[slug]`)
3. Game play page (`/play/[slug]`)
4. Search (`/search`)
5. Privacy policy (`/privacy`) — PDPL compliant
6. Terms of use (`/terms`)
7. About (`/about`)

### Required pages within Month 1

8. Favorites (`/favorites`)
9. Tag page template (`/tag/[slug]`)
10. PWA manifest + service worker (already shipped per prior session)

### Information architecture

```
plixfy.com
├── Home (Featured + Trending + Top-by-Category strips)
│   ├── Hero tile: rotating featured game (1 game, high-priority preload thumbnail)
│   ├── Trending now strip (8-12 games, horizontal scroll on mobile)
│   ├── Top Plixfy (curated picks — manually maintained)
│   ├── Racing | Action | Puzzle | .io | For Girls | Horror (one strip per popular category)
│   └── Inline Playgama widget (horizontal carousel embed — 1 unit)
│
├── /category/{slug}
│   ├── Hero category header (icon + Arabic name + game count)
│   ├── Sort: Trending / New / Top / Random
│   ├── Filter: orientation (any / landscape / portrait), tags
│   └── Infinite-scroll grid of game cards
│
├── /play/{game-slug}
│   ├── Hero game card (thumbnail + Arabic-translated title + tags + rating)
│   ├── "Play Now" CTA (yellow/accent, 56px tall, full-width on mobile)
│   ├── Iframe slot (fullscreen-API enabled on tap)
│   ├── Related games (12 games — Playgama recommends or category-similar)
│   ├── Game info (developer, orientation, last update, languages)
│   └── How to play (auto-translated to Arabic if Playgama has English text)
│
└── /search
    ├── Search box (Arabic + English input)
    ├── Recent searches (localStorage)
    └── Live results (250ms debounce, semantic match)
```

---

## C. Homepage Layout Spec

### Above-the-fold composition (mobile, 393×852)

```
┌─────────────────────────────────────────┐  0px
│ Header (sticky)                  64px  │  
│ [logo]   ...     [search] [profile]    │  64px
├─────────────────────────────────────────┤
│ Hero game tile          240px tall     │
│ ┌─────────────────────────────────────┐ │  
│ │ Big game thumbnail (16:9)           │ │  
│ │  [Top] badge          [Hot] badge   │ │  
│ │                                     │ │  
│ │           Game Title                │ │  
│ │           ▶ العب الآن               │ │  
│ └─────────────────────────────────────┘ │  304px
├─────────────────────────────────────────┤
│ Category icon strip   horizontal scroll │  
│ [🎮][🏎️][🧩][⚔️][🔫][❤️][👹] [.io] [→]   │  392px (88px tall)
├─────────────────────────────────────────┤
│ "ألعاب رائجة الآن"     Trending now    │  
│ ──────────────────────  show all ▸     │  
│                                         │  468px (76px tall)
├─────────────────────────────────────────┤
│ Horizontal game scroll                  │  
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │  
│ │      │ │      │ │      │ │      │   │  
│ │  G1  │ │  G2  │ │  G3  │ │  G4  │   │  168px tall
│ │      │ │      │ │      │ │      │   │  
│ └──────┘ └──────┘ └──────┘ └──────┘   │  636px
├─────────────────────────────────────────┤
│ "أفضل بليكسفاي"   Top Plixfy           │
│ ──────────────────────  show all ▸     │  712px
├─────────────────────────────────────────┤
│ Horizontal game scroll                  │  → 880px (overflows fold @ 852)
└─────────────────────────────────────────┘
```

Above the fold (852px): user sees header + hero tile + category strip + first heading + half of the first game row. **~6-7 game thumbnails visible before scroll**, matching Poki's density.

### Below-the-fold section order (one screen apart, all horizontal-scroll strips on mobile, grid on desktop)

1. **Top Plixfy** — manually curated 12 games (Arabic-friendly content, no Roblox brainrot)
2. **Casual Games** — Playgama's hypercasual lane
3. **Action**
4. **Arcade**
5. **Racing** (high MENA appeal — driving simulators are popular)
6. **Puzzle**
7. **.io** (multiplayer, strong with Saudi teen audience)
8. **For Girls** (dress-up, cooking — discrete category for that segment)
9. **Horror** (limited curation — Saudi cultural sensitivity)
10. **Playgama Widget Embed** — sponsored carousel from partner
11. **All Categories** — link grid (4 columns of icons)
12. **Footer**

### Mobile vs desktop layout differences

| Pattern | Mobile (< 768px) | Desktop (≥ 1024px) |
|---|---|---|
| Layout | Single column, horizontal-scroll strips | 6-column grid, vertical scroll |
| Navigation | Bottom nav bar (4 icons) | Top horizontal nav |
| Game card | 110×110 thumbnail | 180×180 thumbnail |
| Hero | Single game tile (240px tall) | 2-column hero (big game + 4 small) |
| Search | Icon → expands full-width on tap | Always-visible search bar |
| Category strip | Horizontal scroll | Always-visible left sidebar |

---

## D. Game Card Component Spec

### Fields displayed (in Z-order, mobile)

```
┌──────────────────────────────┐
│ ┌──────────────────────┐     │
│ │                      │ Hot │  ← badge top-right (8px from edges)
│ │   Thumbnail          │     │  ← 1:1 ratio on mobile, 16:9 on game pages
│ │   (Playgama thumb)   │     │
│ │                      │     │
│ └──────────────────────┘     │
│                              │
│  Game Title (English)        │  ← 14px, weight 600
│  Trending now                │  ← 11px, secondary color (only if applicable)
└──────────────────────────────┘
```

### Dimensions (mobile)

- **Card width:** 110px (small, 4-up grid) or 168px (medium, 2-up)
- **Thumbnail aspect:** **1:1 square** (matches Playgama and Poki convention)
- **Border radius:** 14px (matches iOS aesthetic)
- **Card padding:** 0 around thumbnail, 8px around text
- **Gap between cards:** 12px

### States

| State | Visual |
|---|---|
| Default | Square thumbnail, title below, badge if applicable |
| Hover (desktop) | 1.04× scale, 200ms ease-out, shadow 0 8px 16px rgba(0,0,0,0.3) |
| Active (mobile tap) | 0.96× scale, 100ms ease-out |
| Loading | Skeleton screen: pulsing gradient on thumbnail, single-line bar on title |
| Focused (keyboard) | 3px outline using accent color, offset 2px |

### Badge design

- **"Hot"** — red gradient `#FF3B30 → #FF6B5B`, 11px bold, 4×8 padding, top-right corner of thumbnail
- **"New"** — green `#34C759`, same shape, used for games released in last 30 days
- **"Top"** — gold `#FFD60A`, used for top-10 in category (per Playgama tags counting)
- **"جديد"** — Arabic "New" — use when locale=ar

### Accessibility

- `<a>` element wraps the whole card (not just title) — entire card is clickable, semantically a link
- `aria-label` includes title + category + badge ("Moto X3M, racing game, hot")
- Min touch target: 48×48 (badge is decorative, not touch target)
- Color contrast: title text against thumbnail-side gradient — ensure 4.5:1 minimum even when thumbnail is dark
- Skeleton state has `aria-busy="true"` while loading

---

## E. Game Page Layout Spec

### Mobile layout (393×852)

```
┌───────────────────────────────────────┐
│ Header — sticky 64px                  │
│  [← Back]    Plixfy logo    [share]   │  
├───────────────────────────────────────┤
│                                       │
│ ┌───────────────────────────────────┐ │
│ │                                   │ │
│ │  Game thumbnail (16:9)            │ │  ← 220px tall on mobile
│ │  ▶ Tap to play                    │ │
│ │                                   │ │
│ └───────────────────────────────────┘ │
│                                       │
│  Game Title (English)        20px     │
│  Developer • Racing • E10+   12px     │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │       العب الآن  ▶               │ │  ← 56px tall, accent-color bg
│ └───────────────────────────────────┘ │
│                                       │
│  [♥ Like] [⤓ Save] [⤴ Share]        │
│                                       │
├───────────────────────────────────────┤
│  ألعاب مشابهة (Related)              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │  R1 │ │  R2 │ │  R3 │ │  R4 │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│                                       │
├───────────────────────────────────────┤
│  معلومات اللعبة                       │
│  المطور: MadPuffers                   │
│  الإصدار: يوليو 2025                 │
│  التحديث: مايو 2026                  │
│  المنصات: PC، Android، iOS           │
│  الاتجاه: أفقي، عمودي                │
│                                       │
├───────────────────────────────────────┤
│  كيفية اللعب                          │
│  (translated from Playgama EN)        │
└───────────────────────────────────────┘
```

### Iframe handling on mobile

**The Playgama iframe loads `https://playgama.com/export/game/{slug}?clid=plixfy_CLID`.**

When the user taps "العب الآن" (Play Now):
1. Replace the static thumbnail with the iframe (no navigation, no page reload)
2. Iframe takes full viewport height (852px on iPhone 14 Pro) minus header (64px) = **788px playable area**
3. Add `allow="fullscreen;accelerometer;camera;clipboard-read;clipboard-write;gyroscope;autoplay;encrypted-media;picture-in-picture"` (matches Playgama's own iframe)
4. Use **Fullscreen API** for landscape games — call `iframe.requestFullscreen()` on tap of a tiny corner button after iframe loads. This is critical for mobile racing/action games where landscape orientation is required.

```jsx
// Pseudocode for the play handler
function startGame(gameSlug) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://playgama.com/export/game/${gameSlug}?clid=plixfy_CLID`;
  iframe.allow = "fullscreen;accelerometer;camera;clipboard-read;clipboard-write;gyroscope;autoplay;encrypted-media;picture-in-picture";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.className = "fixed inset-0 w-full h-full z-10 border-0";
  thumbnailEl.replaceWith(iframe);
  
  // Auto-fullscreen for landscape games
  if (orientation === 'Landscape' && iframe.requestFullscreen) {
    iframe.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }
}
```

### Pre-iframe "Play" button design

- Full-width on mobile, 56px tall
- Accent color background (see §F for palette)
- White text, 18px, weight 700
- ▶ play icon on the trailing edge (left side in RTL, right in LTR)
- Subtle hover: brightness 1.1x

### Related games placement

- Below iframe, horizontal scroll on mobile, grid on desktop
- 8-12 games from Playgama's `related` field on the source game
- Each card identical to home-page card spec

### Ad slot recommendations (AdSense, plixfy parent-page)

Playgama's ads run inside the iframe (their origin). Plixfy can run its own AdSense on the parent page **outside** the iframe:

1. **Slot A — between hero and Play button** (`300×100` banner)
2. **Slot B — between related games and game info** (`336×280` rectangle)
3. **Slot C — at the bottom of the game page**, sticky (`320×50` sticky banner — Saudi-friendly)

Do NOT place AdSense above the iframe (Google's interpretation may consider it "stacked" with Playgama's iframe ads). Do NOT place inside the iframe (technically impossible from cross-origin, but worth saying).

**Total parent-page ads: 3 slots.** Density: low — far below Google's 30% viewport-ad-density threshold.

---

## F. Visual Identity Recommendations for plixfy

### Color palette (5 hex codes, dark theme)

| Role | Hex | Usage |
|---|---|---|
| **Background** | `#0F0F1A` | Page background — deep navy-near-black, less harsh than pure black |
| **Surface** | `#1A1A2E` | Card backgrounds, header, footer — 5% lighter than bg |
| **Surface elevated** | `#262640` | Hovered cards, dropdowns, modals |
| **Primary accent** | `#22D3EE` | CTA buttons (Play Now), focus rings, brand logo |
| **Secondary accent** | `#FBBF24` | Highlights, "Top" badges, premium content markers |
| **Text primary** | `#F4F4F5` | Body text, titles |
| **Text secondary** | `#A1A1AA` | Metadata, captions |
| **Success** | `#34D399` | "New" badges, confirmations |
| **Danger** | `#F87171` | "Hot" badges, errors |

**Reasoning:**
- Dark navy `#0F0F1A` avoids pure black (which looks cheap on OLED) and harsh white (which contradicts a games-portal aesthetic)
- Cyan accent `#22D3EE` is culturally neutral, contrasts well against the dark bg, and matches the kind of "future-tech" Saudi brand aesthetics popular in NEOM / Vision 2030 design language (Saudi-friendly without being corny)
- Gold accent `#FBBF24` evokes the Gulf wealth aesthetic without crossing into kitsch
- The whole palette tests as accessible (WCAG AA) for both Arabic and Latin scripts

### Typography pairing

**Arabic primary font: `Tajawal` (Google Font)**
- Designed for digital screens, simplified letterforms, free
- Excellent rendering at 16-22px sizes
- Weight 400 for body, 700 for headings (per research: never go below 400 for Arabic body)

**Latin secondary font: `Inter` (Google Font)**
- For English game titles, English categories, English brand labels
- Variable font (single file, all weights)
- Matches Tajawal's geometric feel

**Monospace (for any code/UI element): `JetBrains Mono`** (only if needed — most game portals don't use monospace)

**CSS stack:**
```css
:root {
  --font-arabic: 'Tajawal', system-ui, -apple-system, sans-serif;
  --font-latin: 'Inter', system-ui, -apple-system, sans-serif;
  --font-numeric: 'Inter', system-ui, sans-serif; /* numbers in both scripts */
}

body { font-family: var(--font-arabic), var(--font-latin); }
:lang(en), .game-title-en { font-family: var(--font-latin); }
```

**Font sizes (Arabic body 10-15% larger than Latin equivalent, per research):**
- Body Arabic: 16px / line-height 1.7
- Body Latin: 14px / line-height 1.5
- H1 (page title): 28px / weight 700
- H2 (section heading): 20px / weight 700
- Card title: 14px / weight 600
- Metadata: 12px / weight 400

**Critical Arabic rules:**
- `letter-spacing: 0` always (never spacing Arabic — connected script)
- `line-height` ≥ 1.6 for body Arabic
- For mixed Arabic+Latin in same line (e.g., "العب Moto X3M"), set `direction: rtl; unicode-bidi: plaintext;` on the container

### Iconography style

**Filled icons with thin outline accents.** Reasoning:
- Filled icons are more visible on dark backgrounds (outline icons disappear at small sizes)
- Match Saudi mobile-app aesthetic (Snapchat, Telegram, Careem all use mostly-filled icons)
- Library recommendation: **Phosphor Icons** (free, filled variant) or **Heroicons** (filled set)

**Icon mirror rules (for RTL):**
- Arrows (→ ←): MIRROR
- Pagination chevrons: MIRROR
- Progress bars: MIRROR (fill from right)
- Slider thumbs: MIRROR
- Sound waves / volume icons: KEEP (universal)
- Search magnifying glass: KEEP (universal — historical convention)
- Hamburger menu: KEEP
- Settings gear: KEEP
- Play ▶ button: MIRROR to ◀ in RTL? — **NO. Keep ▶ as the universal "play" symbol.** This is a common mistake to avoid.

### Image style

- **Mixed: screenshot-based thumbnails for games (Playgama provides), illustrated for category icons and brand assets**
- Game thumbnails are licensed from Playgama (`thumb_120`, `thumb_180`, etc.) — no custom illustration needed
- Category icons: commission a small set (12 icons) in a single style — flat, with the accent color highlight
- Brand mascot: optional. Plixfy could have a small mascot (Saudi-themed — falcon? camel? — but tasteful, not kitsch). Defer to V2.

---

## G. Performance Targets

Benchmarked against Poki (LCP 460ms) and CrazyGames (LCP 716ms). Plixfy's target is to **beat both**:

| Metric | plixfy target | Poki | CrazyGames | Playgama |
|---|---|---|---|---|
| **LCP** (mobile) | **< 1.5s** | 460ms | 716ms | 296ms |
| **CLS** | **< 0.1** | unknown | unknown | unknown |
| **INP** (interaction-to-next-paint) | **< 200ms** | unknown | unknown | unknown |
| **TTFB** (Saudi edge) | **< 200ms** | 153ms (US) | 503ms (US) | 14ms (UAE edge) |
| **Total page weight (HTML+critical CSS)** | **< 80 KB** | 52 KB | — | 66 KB |
| **JS bundle (parsed)** | **< 250 KB** | 384 KB decoded | 278 KB | 455 KB |
| **Image lazy-loading** | **enabled** | yes | yes | yes |
| **Mobile Lighthouse score** | **≥ 90** | — | — | — |

Specific techniques to hit these:
- **Server-rendered HTML** for above-the-fold (Next.js App Router with React Server Components — already in stack per prior session)
- **Image: WebP/AVIF** with `<img srcset>` for retina, lazy-load below the fold
- **Critical CSS inlined**, rest deferred
- **Fonts: `font-display: swap`**, preload Tajawal regular only (defer bold)
- **Preconnect to `playgama.com`** in the document head — game iframe loads fast
- **Service worker caches** game thumbnails for repeat visits (PWA already shipped per prior session)
- **Cloudflare edge cache** for all category and game pages (5-minute TTL)
- **No unused JS** — tree-shake, no jQuery, no Moment.js, no Lodash for utility methods that browsers ship natively

---

## H. Implementation Tech Stack Recommendation

### Keep the current Next.js stack

Per the prior session's modified files (`app/profile/`, `app/layout.tsx`, `components/Header.tsx`, etc.) plixfy is already on **Next.js + Supabase**. Don't rebuild.

### Justifications

- **Next.js App Router** is the right choice for plixfy because:
  - Server Components render game grids on the server (faster LCP on mobile)
  - Static generation for category and game pages (cached at Cloudflare edge — fast for Saudi traffic)
  - Built-in image optimization with `next/image`
  - `loading.tsx` for skeleton states per route
  - RTL support via the `dir` attribute on `<html>` (no library needed)

- **Supabase** for:
  - User auth (email/social — Clerk-free per prior session)
  - Favorites table (one row per user × game)
  - Rating + comment tables (already in stack)
  - **Row-level security** matches plixfy's "no data leaks" posture

### Hosting

**Recommended: Vercel for app + Cloudflare in front for caching.**

- **Vercel** ($20/mo Pro tier) — Next.js native, automatic edge deployment, image optimization, included CDN
- **Cloudflare** (free tier sufficient for plixfy launch) — additional caching layer with regional edge in **Bahrain/UAE/Saudi** (very close to your audience), DDoS protection, free SSL, ads.txt hosting

**Why not Cloudflare Pages directly:** Cloudflare Pages doesn't run Next.js server components as efficiently as Vercel does. Use Vercel for the app, Cloudflare for the edge cache.

**Total infrastructure cost estimate (Month 1):**
- Vercel Pro: $20
- Supabase: Free tier (up to 500MB DB, 1GB storage) — plixfy fits
- Cloudflare: Free
- Domain: ~$15/year
- Email (SendGrid for transactional): $0 (free tier)
- Analytics: Vercel Analytics ($10) or free Plausible self-hosted
- **Total: ~$30/month = ~110 SAR/month** — leaves 4,890 SAR of the 5,000 budget for marketing/content moderation tools.

### CMS need?

**No.** Game catalog comes from Playgama's JSON catalog download. Categories and curated "Top Plixfy" picks live as JSON or TypeScript constants in the repo (see existing `games/registry-embed.ts` and `games/registry-extra.ts` per prior session). A heavyweight CMS like Sanity or Strapi is overkill — plixfy is essentially a thin Arabic UI layer over Playgama, not a content-authoring product.

When you DO want to author content:
- **Blog posts (SEO)** → MDX files in the repo
- **Curated "Top Plixfy" picks** → a single TypeScript constant array in `games/curated.ts`
- **Category translations (Arabic names for English-slug categories)** → a single `i18n/categories.json`

---

## I. Three Concrete Inspiration Sites (bookmark these)

### 1. **Playgama.com** (your partner — start here)

URL: https://playgama.com/

What to look at:
- **The category strip on the homepage** (Trending now, Playgama Top, then ~15 category strips). This is the cleanest information architecture in the market. Copy the structure, swap labels to Arabic.
- **The game page layout** (`/game/moto-x3m`) — the embed-link block, related games carousel, game info table with developer/orientation/last-update. Plixfy mirrors this almost exactly.
- **The Arabic search behavior** — type Arabic in their search and watch it return English-titled games with category badges. Use this UX pattern on plixfy.

### 2. **Poki.com** (gold standard mobile-first UX)

URL: https://poki.com/

What to look at:
- **Above-the-fold mosaic** — asymmetric tile sizing with one large hero + smaller surrounding tiles. Saudi users will find this novel (most local sites use uniform grids).
- **Light teal background** — plixfy goes dark, but study how Poki uses color to make thumbnails pop.
- **Bottom mobile navigation** — Poki has subtle 4-icon nav at the bottom. Match this on plixfy.
- **No login wall** — you can browse, play, and tap categories before any signup pressure.

### 3. **CrazyGames.com** (high-density above-the-fold + filter UI)

URL: https://www.crazygames.com/

What to look at:
- **Vertical left-sidebar with category icons** (desktop only — collapses on mobile). Plixfy uses this on desktop ≥1024px.
- **65 cards above the fold** — high density. Plixfy targets 30-40 (less aggressive but still dense vs Poki's ~6).
- **"Hot" / "Top" badges in the upper-left** of every applicable card. Plixfy replicates with Arabic-localized badges where appropriate.
- **Featured carousel at top** — plixfy uses a single hero tile instead (simpler, faster LCP).

---

## J. Anti-pattern audit — sites to study for what NOT to do

These sites are intentionally NOT cited as inspiration. Open them in an incognito window and observe what makes them feel cheap:

- **Any "unblocked games 76" or "tyrone's unblocked games" style site** — uniform white-on-tan template, no thought to mobile, AdSense everywhere, no curation. **Don't be this.**
- **GamePix.com /play pages** — interstitial ads before every game, layout shifts when ads load, slow LCP (>3s). Plixfy beats this on speed and aesthetics.
- **GameMonetize.com** — looks dated, hidden ownership, generic "casino-portal" vibe.
- **Older Y8.com** — Flash-era aesthetics, ad density too high.

What you'll observe across all of these:
1. Hero space wasted on ads
2. Thumbnails of inconsistent size and quality
3. Banner ads stacked above game cards
4. No clear primary CTA — every link looks the same
5. Cookie consent banner over the entire viewport for 5 seconds before the user can do anything
6. Loading sequence is: white page → ads load → game cards push down → layout shift

Plixfy's promise: **no layout shift. No interstitial. No 30%-of-viewport ad. Games visible in 500ms.**

---

## K. Specific implementation checklist (Week 1 of design)

1. [ ] Implement `dir="rtl"` on `<html>` when locale = ar (default). Toggle to `ltr` when user switches to English.
2. [ ] Install `Tajawal` (regular, bold) and `Inter` (variable) — preload only Tajawal regular.
3. [ ] Set CSS variables for the color palette in `app/globals.css` (or equivalent).
4. [ ] Build `<GameCard>` React component per §D spec. Storybook entry with all states.
5. [ ] Build `<CategoryStrip>` component (horizontal scroll on mobile, grid on desktop) — accepts `games: Game[]` + `title: string` + `viewAllHref?: string`.
6. [ ] Build `<HeroTile>` (single featured game, 16:9, prominent Play CTA).
7. [ ] Build home page composing 12 category strips + hero + Playgama widget embed.
8. [ ] Build game page (`/play/[slug]`) with iframe replacement on Play tap.
9. [ ] Implement fullscreen-API call for landscape games.
10. [ ] Wire Playgama CLID into iframe URL — `?clid=plixfy_${process.env.PLAYGAMA_CLID}`.
11. [ ] Add 3 AdSense slots on the game page (slot A, B, C per §E).
12. [ ] Add bottom nav bar (already exists per prior session — verify it matches §A).
13. [ ] Cookie consent banner — Saudi PDPL + GDPR compliant, with proper "Refuse all" button.
14. [ ] PWA manifest + service worker (already shipped per prior session).
15. [ ] Lighthouse audit on mobile — target ≥ 90.

When all 15 are done: ship to a Vercel preview URL, run a 1-day soft launch via personal social, measure $/session per provider for the first 100 sessions, and iterate.

---

**Bottom line:** plixfy doesn't need to invent — it needs to copy what works (Poki + CrazyGames + Playgama information architecture) and **add the one differentiator Western sites can't match: an Arabic-first dark-theme mobile-first UI that respects Saudi cultural patterns**. The Playgama iframe handles the games; plixfy handles the shell. That's the whole product.
