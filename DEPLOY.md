# Plixfy — Deployment Checklist

Launch target: **today**. Last build: clean (5,886 pages, 0 errors).

Repo: <https://github.com/RUDY4K/plixfy> · Domain: `plixfy.com` (Namecheap)

---

## GO LIVE — exact steps (do these in order)

### Step 1 · Vercel project (5 min)

1. Open <https://vercel.com/new>
2. **Import Git Repository** → connect GitHub if not already → pick `RUDY4K/plixfy`
3. **Configure Project** screen:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `next build` (default — already in `package.json`)
   - Output Directory: leave empty (Next handles it)
   - Install Command: `npm install` (default)
4. **Environment Variables** — add these BEFORE the first deploy:

   | Name | Value | Apply to |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://plixfy.com` | Production, Preview, Development |
   | `NEXT_PUBLIC_GSC_VERIFICATION` | _(add after Step 5)_ | Production |
   | `NEXT_PUBLIC_GA_ID` | _(your `G-XXXXXX`)_ | Production |
   | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | _(your `ca-pub-...`)_ | Production |

   The last three are optional for the first deploy — analytics/ads can land later.
5. Click **Deploy**. Wait ~3-5 minutes. The build will produce 5,886 static pages.
6. You'll get a `plixfy.vercel.app` URL. Open it — verify the homepage shows "5,000+ Free Browser Games".

### Step 2 · Add the custom domain in Vercel (2 min)

1. In the new project → **Settings → Domains**
2. Add `plixfy.com` → Vercel will show a DNS configuration card with the exact records you need to add at Namecheap.
3. Also add `www.plixfy.com` and choose to redirect it to the apex (or vice versa — pick one canonical).
4. Leave this tab open — you'll come back after DNS propagates.

### Step 3 · Namecheap DNS records (2 min to add, up to 30 min to propagate)

1. Log in to Namecheap → **Domain List** → **Manage** next to `plixfy.com` → **Advanced DNS** tab.
2. Delete every existing record (Parking Page, default CNAMEs) to avoid conflicts.
3. Add these records — these are the values Vercel currently requires for custom domains. Cross-check against what Vercel's Domains tab shows (Vercel sometimes rotates IPs):

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | `A` | `@` | `76.76.21.21` | Automatic |
   | `CNAME` | `www` | `cname.vercel-dns.com.` | Automatic |

4. **Important**: turn OFF Namecheap's "Domain Privacy" parking page redirect if it's on — it adds a competing A record.
5. Save. Wait 2–30 minutes for propagation. Check with `nslookup plixfy.com` or <https://dnschecker.org>.

### Step 4 · Verify HTTPS + canonical (5 min after propagation)

1. Refresh Vercel → **Settings → Domains** — both `plixfy.com` and `www.plixfy.com` should show ✅ green checks.
2. Vercel auto-provisions a Let's Encrypt cert — happens in ~30s after DNS verifies.
3. Visit `https://plixfy.com` — should serve the homepage. Confirm:
   - URL bar shows the padlock
   - Hero reads "5,000+ Free Browser Games"
   - Click any game card → game page loads with iframe
4. `https://www.plixfy.com` should 308-redirect to `https://plixfy.com` (or whichever direction you picked).
5. `http://plixfy.com` should 308-redirect to `https://plixfy.com`.

### Step 5 · Google Search Console (10 min)

1. Open <https://search.google.com/search-console>
2. **Add property** → URL prefix → `https://plixfy.com`
3. Verification method: **HTML tag** → copy the `content="..."` value
4. Back in Vercel → Settings → Environment Variables → set `NEXT_PUBLIC_GSC_VERIFICATION` to that value → redeploy (Deployments → ⋯ → Redeploy on the latest deploy)
5. Back in GSC → click Verify
6. Once verified: GSC → **Sitemaps** → submit `https://plixfy.com/sitemap.xml` (5,886 URLs)
7. Optional but recommended: also submit to Bing Webmaster Tools (<https://www.bing.com/webmasters/>) — same sitemap URL.

### Step 6 · Smoke test the live site (15 min)

Walk through these on `https://plixfy.com` with the production URL:

- [ ] Home page loads, "5,000+ Free Browser Games" hero
- [ ] Hit `🎲 Quick Play` button — random game loads
- [ ] Open a custom game (e.g. `/games/flap-hero`) — Phaser canvas appears
- [ ] Open an embed game (e.g. `/games/moto-x3m`) — iframe loads
- [ ] Open an .io game (e.g. `/games/slither-io`) — iframe loads slither.io
- [ ] Open `/play/io-games` — landing page with 30+ games + breadcrumb
- [ ] Click **Sign in** in header → set nickname + avatar → confirm header chip updates
- [ ] Visit `/profile` — stats card shows
- [ ] `/sitemap.xml` — opens, has 5,886 `<url>` entries
- [ ] `/robots.txt` — opens, has AI-crawler sections
- [ ] `/llms.txt` — opens, has the Plixfy summary
- [ ] View source of `/games/moto-x3m` — confirm 3 JSON-LD scripts (Organization, WebSite, VideoGame+BreadcrumbList)

### Step 7 · Lighthouse on the live URL (10 min)

```
npx lighthouse https://plixfy.com --view --form-factor=mobile
npx lighthouse https://plixfy.com --view --preset=desktop
```

Targets (from prior section below): Performance ≥ 80 mobile / 95 desktop,
Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

### Step 8 · Announce (whenever you're ready)

- Tweet/X with a Challenge URL screenshot to seed the viral loop
- Submit to Hacker News (Show HN), r/WebGames, r/incremental_games
- DM friends with a `/games/<slug>?c=<token>` challenge link to seed
  their leaderboards
- Set up the GA4 realtime dashboard and watch the first hour of traffic

---


## 0 · Domain & DNS

- [ ] Register `plixfy.com` (or chosen TLD) at registrar
- [ ] Set DNS to deployment provider (Vercel / Netlify / Cloudflare Pages)
  - Apex `A` → provider's IP (or `ALIAS`/`ANAME`)
  - `www` → CNAME to apex (or vice versa — pick one canonical)
- [ ] Force-redirect `www` ↔ apex to one canonical host
- [ ] TLS cert provisioned (Let's Encrypt via provider — usually automatic)
- [ ] DNSSEC enabled at registrar (optional but recommended)

## 1 · Environment variables (production)

Set on the deployment provider, NOT in `.env.local`:

| Name | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://plixfy.com` — drives canonical URLs, sitemap, OG |
| `NEXT_PUBLIC_GSC_VERIFICATION` | ⚠️ | After you add the property in Google Search Console |
| `NEXT_PUBLIC_GA_ID` | ⚠️ | GA4 measurement ID (e.g. `G-XXXXXXX`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | ⚠️ | `ca-pub-XXXXXXXXXXXXXXXX` once AdSense is approved |

⚠️ Optional but expected at launch.

## 2 · Code freeze + final QA

- [ ] `npm run build` passes locally with no warnings (✅ verified just now)
- [ ] `npx tsc --noEmit` clean (✅ verified)
- [ ] Smoke-test critical flows on `npm start` (production server):
  - [ ] Home page loads, Quick Play button picks a random game
  - [ ] Game detail page loads for a custom game + an embed game
  - [ ] Profile setup modal saves nickname + avatar
  - [ ] `/profile` shows stats / badges / favorites
  - [ ] Leaderboard renders + score submit on Flap Hero / 2048 / Slither / Match Quest
  - [ ] Challenge URL (`?c=...`) shows the amber banner
  - [ ] Share opens Twitter / WhatsApp intents
  - [ ] Rating thumbs persist on reload
  - [ ] Streak chip increments on cross-day revisit
  - [ ] Cookie consent banner dismisses + persists
- [ ] Mobile (Chrome DevTools → iPhone SE 375×667):
  - [ ] Header doesn't overflow with profile chip + Quick Play
  - [ ] Game cards stack to 2 columns
  - [ ] Profile setup modal usable with on-screen keyboard

## 3 · SEO

- [ ] `/sitemap.xml` lists all 3,200+ game pages (auto-generated)
- [ ] `/robots.txt` allows crawl of public routes, blocks `/profile` (already `noindex`)
- [ ] Submit sitemap in Google Search Console + Bing Webmaster Tools
- [ ] Add `NEXT_PUBLIC_GSC_VERIFICATION` env var with the GSC HTML-tag token
- [ ] Add Open Graph image: `/og-default.png` 1200×630 (NOT yet present — create one with Plixfy logo + tagline)
- [ ] Verify Twitter Card by pasting a game URL into https://cards-dev.twitter.com/validator
- [ ] Confirm canonical tags on every page (already wired via `alternates.canonical`)

## 4 · Performance + Lighthouse

Once deployed, run Lighthouse against the **production URL** (not localhost — CDN behavior matters):

```
# Headless lighthouse against your live site
npx lighthouse https://plixfy.com --view --preset=desktop
npx lighthouse https://plixfy.com --view --form-factor=mobile
```

Targets:

| Metric | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 80 | ≥ 95 |
| Accessibility | ≥ 95 | ≥ 95 |
| Best Practices | ≥ 95 | ≥ 95 |
| SEO | ≥ 95 | ≥ 95 |
| LCP | < 2.5s | < 1.8s |
| CLS | < 0.1 | < 0.1 |
| INP | < 200ms | < 200ms |

If Performance < 80 on mobile, check:
- [ ] Thumbnail images served from CDN, not Next dev runtime
- [ ] Below-the-fold `GameCard` images marked `loading="lazy"` (already are ✅)
- [ ] No third-party scripts blocking render (AdSense `async` ✅)
- [ ] `prefers-reduced-motion` honored for animations (already ✅)

## 5 · Analytics + monitoring

- [ ] GA4 property created, measurement ID set
- [ ] Verify `gtag` fires on:
  - [ ] Page view
  - [ ] `recordPlay` → custom event
  - [ ] `recordScore` / `recordHighScore`
  - [ ] Share / Challenge click
- [ ] Vercel/Netlify error monitoring on (built-in)
- [ ] Set up a basic uptime ping (Better Stack / UptimeRobot — free tier)

## 6 · Ads (AdSense)

- [ ] AdSense account approved for `plixfy.com` (review takes 1–14 days)
- [ ] Add `ads.txt` at root with the new publisher ID (currently has a stub at `public/ads.txt` — replace placeholder with real `pub-…` ID before deploy)
- [ ] Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` env var
- [ ] Verify ads only render after the cookie banner is accepted (already gated via `plixfy:ad-consent`)

## 7 · Legal / compliance

- [ ] `/privacy` reviewed and current address listed
- [ ] `/terms` reviewed
- [ ] Cookie banner GDPR-compliant: shown before any tracking, opt-in
- [ ] COPPA: nicknames are display-only, no real-name collection (already ✅)
- [ ] If targeting EEA users, add a "Do not sell my personal info" link (US/CCPA)
- [ ] Contact email working (`privacy@plixfy.com`, `legal@plixfy.com`, `support@plixfy.com` — set up forwarders at registrar)

## 8 · Branding final pass

- [ ] Replace all `plixfy.example` placeholders with the real domain via the `NEXT_PUBLIC_SITE_URL` env var (no code change needed — the fallback only kicks in when the var is unset)
- [ ] Favicon `/favicon.ico` exists at root (verify in `app/favicon.ico` — Next conventions)
- [ ] Apple touch icon (180×180)
- [ ] PWA manifest (`/manifest.webmanifest`) — optional but enables "Add to home screen" on mobile

## 9 · Day-of launch

1. Set env vars on deploy provider
2. Push `main` → trigger build → wait for "deployment successful"
3. Visit `https://plixfy.com` — confirm 200, no console errors
4. Run mobile Lighthouse on the live URL
5. Submit sitemap to GSC
6. Tweet / announce launch with a Challenge URL screenshot
7. Monitor for 60 minutes: error logs + analytics realtime

## 10 · Day-after launch

- [ ] Check GSC for crawl errors
- [ ] Skim analytics for unexpected bounce on any specific game page
- [ ] Watch for AdSense policy emails

---

## Notes on architecture decisions made for launch

- All player data is `localStorage`-only (`plixfy:*` keys). Zero backend cost,
  but means stats/badges/leaderboards do not sync across devices. A future
  Tier-3 phase can swap `lib/leaderboard.ts` and `lib/profile.ts` to a real
  backend (Supabase, Convex, etc.) — the public function signatures already
  match what a backend repo would expose.
- Leaderboards seed with a synthetic baseline derived from the slug hash, so
  cards never read as "0 votes" or "no scores" on day one (social proof
  before the first user shows up).
- Achievements evaluate after any state-changing UI event (play, favorite,
  streak, score submit). No background timers needed.
- Challenge URLs are base64url-encoded — the score travels in the link, no
  backend hop required for the viral loop.
