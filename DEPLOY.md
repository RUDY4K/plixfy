# Plixfy — Deployment Checklist

Launch target: this week. Last build: clean (3264 pages, 0 errors).

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
