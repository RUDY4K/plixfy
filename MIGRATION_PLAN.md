# Plixfy Migration Plan — Local `plixfy-new` vs Live `plixfy.com`

**Compiled:** 2026-06-02
**Analyst scope:** Read-only. No remote modifications were made. Nothing has been pushed, deployed, or deleted.

---

## A) Executive Summary

1. **These are two different products with the same name on the same domain.** The live `plixfy.com` is an **English-language 5,000+ game portal** (5,368 sitemap URLs, GA4 active, custom Phaser games, Supabase-ready, social automation). The local `plixfy-new/` is the **Arabic-base Playgama partner experiment** we built this week (372 games, 384 sitemap URLs, RTL UI, Gulf-targeted).
2. **The local repo was started from a fresh `create-next-app` scaffold** — it is NOT a fork or branch of the live GitHub repo. It has 2 commits total (`4fb3e7c` Create Next App + `211a37f` our SEO/Playgama work today). It has never been connected to `github.com/RUDY4K/plixfy`.
3. **The live GitHub repo is at commit `f85209b` (2026-05-23, ~10 days old)** with serious infrastructure: Y8/GameDistribution/OnlineGames harvest pipeline, custom Phaser games (flap-hero, match-quest, puzzle-2048, slither-trail), AI-crawler-aware robots.txt (GPTBot/ClaudeBot/PerplexityBot), GA4 wired, llms.txt, sophisticated JSON-LD (8 schema types).
4. **There is no destructive risk by default** — the two repos don't share git history, so nothing local can accidentally overwrite anything live. The only way to break the live site is by **explicitly** force-pushing or by changing Vercel project settings. Neither has happened.
5. **The strategic question is bigger than the technical question.** Three viable paths exist (separate Arabic experiment, merge as i18n branch, or replace entirely). The previous language-strategy report we compiled this week explicitly recommended "deepen Arabic moat, do not fragment effort" — that report assumed plixfy.com WAS the Arabic project, which turns out to be wrong. Re-reading it under the now-correct assumption (plixfy.com is the English 5K-game catalog), the recommendation shifts.

---

## B) Risk Assessment

| Action | Risk Level | Reversible? | Recommendation |
|---|---|---|---|
| Leave both repos alone (status quo) | **None** | N/A | Always safe; lets you decide later |
| Add a git remote `origin` to `plixfy-new` and push to a **new** GitHub repo | **None** | Yes (delete the new repo) | Safe — doesn't touch live |
| Clone GitHub repo locally for reference (done) | **None** | Yes (delete the folder) | Already done at `C:\Users\gaming\plixfy-from-github` |
| Create a feature branch `feat/arabic-locale` in RUDY4K/plixfy and merge translations | **Low** | Yes (revert branch, no merge yet) | Path 2 — recommended if you want one site |
| Deploy `plixfy-new` to a new Vercel project under a subdomain (e.g. `ar.plixfy.com`) | **Low** | Yes (delete Vercel project) | Path 1 — recommended if you want two sites |
| Change Vercel domain settings on the existing `plixfy.com` project | **Medium** | Yes within minutes if you have screenshots | Don't do without backup of current settings |
| Force-push `plixfy-new` to `RUDY4K/plixfy` (overwrite) | **High** | Hard — would need to restore from Vercel deploy archives | **Do not do.** Wipes 5,000-game catalog, GA4 history, indexed URLs |
| Delete the live Vercel project | **Critical** | Hard — domain goes down, SSL cert revoked, SEO equity lost | **Do not do.** |

---

## C) Three Recommended Paths

### Path 1 (SAFEST): Two separate properties

**What it does:**
Treat `plixfy-new` as a parallel Arabic experiment. Push it to a NEW GitHub repo (e.g. `RUDY4K/plixfy-ar`), deploy as a NEW Vercel project, point a subdomain (e.g. `ar.plixfy.com`) or new domain (e.g. `plixfy.sa`) at it. The live English site at `plixfy.com` is **untouched**.

**What we keep:**
- Live English 5,000-game catalog, GA4 history, indexed URLs, social automation, Supabase schema — all intact
- All Arabic work we did this week — runs at its own URL with its own SEO trajectory
- Optionality: if the Arabic experiment validates, you can merge later via Path 2

**What we lose:**
- Some duplicated infrastructure cost (2 Vercel projects on Hobby = still free)
- The Arabic site does NOT inherit the English site's domain authority
- Slight brand confusion if both URLs are public (mitigate: `ar.plixfy.com` is clearly a sub-property)

**Time:** ~30 minutes
**Recommended for:** if you want to A/B test two completely different positioning bets without risk to either.

---

### Path 2 (BALANCED): Merge Arabic localization into the live repo as a feature branch

**What it does:**
1. Add `RUDY4K/plixfy` as a second git remote on `plixfy-new` for reference
2. In the live repo, create branch `feat/arabic-locale`
3. Restructure live repo to App Router i18n pattern (`app/[locale]/...`) — Arabic at `/ar/`, English unprefixed at `/`
4. Port `plixfy-new`'s Arabic UI components, RTL stylesheet, Arabic SEO metadata, Playgama integration, and the Arabic-specific game category labels
5. Open a PR. Test on a Vercel preview deployment. Merge when satisfied.
6. The live site becomes plixfy.com (EN) + plixfy.com/ar/ (AR) with hreflang annotation

**What we keep:**
- 5,000-game English catalog + all live infrastructure
- All Arabic translation work + research
- Single domain authority for both languages
- Playgama integration becomes a 3rd game source alongside Y8/GameDistribution/OnlineGames

**What we lose:**
- ~1-3 days of refactor work (i18n restructure of live repo is non-trivial)
- Risk surface during merge — needs preview deployment + careful smoke tests before merging to main
- 4 days of Arabic-specific UI work needs to be ported (not just dropped in — needs to coexist with the English design system)

**Time:** ~1-3 days
**Recommended for:** if your strategic goal is "one site, two languages" with the English catalog as foundation.

---

### Path 3 (FASTEST/DESTRUCTIVE): Replace live with `plixfy-new`

**What it does:**
1. Set `plixfy-new` as the new source for `plixfy.com`
2. Force-push to `RUDY4K/plixfy` (or replace the GitHub repo entirely)
3. Vercel auto-deploys → 5,000-game English site is GONE, replaced by 372-game Arabic site

**What we keep:**
- 4 days of Arabic work goes live immediately
- Simplicity: one project, one focus

**What we lose:**
- 5,886 prerendered pages → 384 prerendered pages (94% drop)
- 5,368 indexed URLs in Google → potentially massive de-ranking event over weeks as Google reprocesses
- All GA4 history segmentation by English search terms
- The 5 custom Phaser games (flap-hero, match-quest, puzzle-2048, slither-trail, test-scene) — these were original work
- Y8/GameDistribution/OnlineGames harvest pipeline
- Social automation (Buffer GraphQL scheduler + weekly content packs)
- Supabase schema migrations (already applied to Supabase project even if reverted)
- llms.txt, PWA support, mobile bottom nav, AdSense scaffolding
- ALL English SEO equity built since launch

**Time:** ~10 minutes (very fast)
**Recommended for:** never, in this situation. The Arabic site can launch on `ar.plixfy.com` with zero loss.

---

## D) Path 1 — Commands Ready to Execute

**These are not run yet.** Copy-paste in order after you approve.

```bash
# Step D.1 — Create a new GitHub repo for the Arabic project
gh repo create RUDY4K/plixfy-ar --private --source=C:/Users/gaming/plixfy-new --remote=origin --description="Plixfy Arabic — Playgama partner portal, RTL, Gulf-focused"

# Step D.2 — Push current state
cd /c/Users/gaming/plixfy-new
git push -u origin master

# Step D.3 — Confirm remote is set
git remote -v

# Step D.4 — Link to a NEW Vercel project (interactive — pick "new project")
vercel login            # if not already authenticated
vercel link             # link this folder to a NEW Vercel project
# choose: "create new project", name "plixfy-ar", framework Next.js, root ./

# Step D.5 — Set the production env var (only one is strictly required)
vercel env add NEXT_PUBLIC_SITE_URL production
# When prompted, enter: https://ar.plixfy.com

# Step D.6 — Deploy to production
vercel --prod

# Step D.7 — In Vercel dashboard (web UI, not CLI):
#   Project Settings → Domains → Add "ar.plixfy.com"
#   Vercel will give you the DNS record to add at Namecheap
#   Add the CNAME at Namecheap → wait for SSL → done
```

**Estimated wall time:** 30 minutes (10 min commands + 20 min DNS propagation + SSL cert provision).

**Optional follow-up:** add an i18n picker on the English site `plixfy.com` that links to `ar.plixfy.com`, and vice versa. Use `<link rel="alternate" hreflang="ar" href="https://ar.plixfy.com">` in both sites' layouts for cross-language SEO discovery.

---

## E) Pre-Flight Checklist

Before executing ANY path, confirm:

### Backups that must exist
- [ ] **GitHub repo `RUDY4K/plixfy` is the source of truth for the live site.** Confirmed — cloned locally at `C:\Users\gaming\plixfy-from-github` and intact (803 files, 31 commits, latest `f85209b` 2026-05-23).
- [ ] **Local `plixfy-new` is committed and clean.** Confirmed — commit `211a37f` on master, working tree clean.
- [ ] **`plixfy-from-github` clone is read-only reference.** Do not push from this folder. Do not run `npm install` and accidentally regenerate `package-lock.json` that gets committed.
- [ ] (Path 2/3 only) **Tag the current live deploy** so we can roll back: from `plixfy-from-github`, run `git tag pre-migration-2026-06-02 && git push origin pre-migration-2026-06-02`.

### Env vars that must be saved before any change to the live Vercel project
Inferred from `.env.example` + `grep process.env.* ` in the live repo. **YOU need to capture the actual production values** from the Vercel dashboard (Settings → Environment Variables) before changing anything:

```
Required for the live site to function:
  NEXT_PUBLIC_SITE_URL              = https://www.plixfy.com  (confirmed from rendered HTML)
  NEXT_PUBLIC_GA_ID                 = G-M1P4JYT5B6  (confirmed visible in homepage HTML)
  NEXT_PUBLIC_GSC_VERIFICATION      = (unknown — likely set, captures GSC ownership)
  NEXT_PUBLIC_ADSENSE_CLIENT_ID     = (unknown — may be empty if ads still 'stub')
  NEXT_PUBLIC_AD_PROVIDER           = stub | adsense | adinplay  (default: stub)

Likely set but inactive (Supabase placeholder pattern):
  NEXT_PUBLIC_SUPABASE_URL          = (placeholder per .env.example)
  NEXT_PUBLIC_SUPABASE_ANON_KEY     = (placeholder per .env.example)
  SUPABASE_SERVICE_ROLE_KEY         = (placeholder per .env.example)

For social automation scripts (used by Buffer scheduler in scripts/):
  BUFFER_ACCESS_TOKEN               = (likely set — social posting works)
  BUFFER_ORGANIZATION_ID            = (likely set)
  BUFFER_TWITTER_CHANNEL_ID         = (likely set)
  BUFFER_INSTAGRAM_CHANNEL_ID       = (likely set)
  ANTHROPIC_API_KEY                 = (used by generate-social-content.mjs)
```

> ⚠️ **OPEN ITEM:** I could not run `vercel env ls production` to confirm the exact name list because the Vercel CLI is not logged in on this machine. **Please run `! vercel login` (Vercel device-code flow opens in browser, ~30s) so I can complete the env var audit.** This is the only piece missing from this report.

### Vercel settings to screenshot before any change to the live project
1. **Project Settings → General** — Framework, Node version, Root directory, Output directory
2. **Project Settings → Domains** — exact configuration of `plixfy.com` and `www.plixfy.com` (which redirects to which, "Serve / No redirect / Redirect" choice — this matters because `next.config.ts` has an apex→www 301 that only fires if Vercel itself isn't redirecting first)
3. **Project Settings → Environment Variables** — complete name + scope list (Production / Preview / Development)
4. **Project Settings → Git** — connected repo + branch + auto-deploy settings
5. **Deployments** — current production deployment ID + commit SHA (looks like `f85209b` based on git)
6. **Analytics** (if enabled) — current Web Vitals + Audience snapshots

---

## F) Rollback Plan

### If Path 1 goes wrong
**Worst case:** New `ar.plixfy.com` deploy fails or shows broken content.
**Rollback:**
1. Live `plixfy.com` is untouched throughout — nothing to roll back there
2. Delete the new Vercel project (`vercel project rm plixfy-ar`)
3. Delete the new GitHub repo (`gh repo delete RUDY4K/plixfy-ar`)
4. Remove the DNS CNAME at Namecheap
5. Total recovery time: <5 minutes

### If Path 2 goes wrong (during PR development)
**Worst case:** Merge to main causes a broken live deploy.
**Rollback:**
1. Vercel keeps a rolling history of deployments. Open Vercel Dashboard → Deployments → find the last green deploy before the merge → click ⋯ → **"Promote to Production"**. Site is restored within ~30s (no rebuild required, just re-routes traffic to the existing cached deploy).
2. Then `git revert <merge-commit-sha>` on main, push, let it redeploy
3. Total recovery time: <2 minutes for traffic, <5 minutes for git

### If Path 3 goes wrong
**Worst case:** Live site replaced with Arabic version, English users see Arabic, Google starts deindexing English URLs.
**Rollback:**
1. **Same as Path 2** — Vercel Dashboard → Deployments → find the `f85209b` deploy (last good English deploy) → "Promote to Production". Site visually restored within seconds.
2. Then in git: `cd plixfy-from-github && git push origin f85209b:master --force` — restores the GitHub repo to its pre-migration state (this is destructive but it's restoring a known-good state we have locally as proof).
3. **However** — even with a perfect rollback, Google's crawlers may have seen the Arabic version during the gap. If the gap was <1 hour, impact is minimal. If >24 hours, expect some SEO turbulence for a few weeks while Google rediscovers the English content.

### Universal rollback safety net
Before executing ANY migration path:
```bash
# 1. Tag the current live state in the github clone
cd /c/Users/gaming/plixfy-from-github
git tag pre-migration-2026-06-02
git push origin pre-migration-2026-06-02

# 2. Note the current production deployment ID from Vercel dashboard
#    (Deployments tab → look for the "Production" badge → copy the deployment URL)
#    Example: plixfy-abc123.vercel.app

# 3. Confirm both above are stored before proceeding
```

These two steps guarantee that even if everything else goes wrong, you can restore the live site to its current state in under 5 minutes.

---

## Appendix 1 — Inventory Comparison

### Local `plixfy-new`
| Metric | Value |
|---|---|
| Files (excl. node_modules/.next/_blexy-drop) | 42 |
| Commits | 2 (latest `211a37f` 2026-06-02) |
| Sitemap URLs | 384 |
| Game catalog | 372 Playgama games (iframe) |
| Languages | Arabic only (RTL) |
| Default locale | `ar` |
| Dependencies | next, react, react-dom, lucide-react |
| Auth | None |
| Analytics | None |
| Backend | None |
| Custom games | None |
| Linked to GitHub remote | No (no `origin` set) |
| Linked to Vercel project | No |

### Live `RUDY4K/plixfy` (→ plixfy.com)
| Metric | Value |
|---|---|
| Files (excl. node_modules/.next) | 803 |
| Commits | 31+ (latest `f85209b` 2026-05-23) |
| Sitemap URLs | 5,368 (per live curl) |
| Game catalog | 5,000+ (Y8 + GameDistribution + OnlineGames harvested via scripts) + 5 custom Phaser games |
| Languages | English only (LTR) |
| Default locale | `en` |
| Dependencies | next, react, react-dom, @supabase/{ssr,supabase-js}, next-sitemap, phaser, eslint |
| Auth | None active (Clerk removed in `1107eae`, back to localStorage) |
| Analytics | GA4 active (G-M1P4JYT5B6 confirmed in HTML) |
| Backend | Supabase (schema in `supabase/migrations/0001_initial.sql`, inert per `f165962`) |
| Custom games | 5 (flap-hero, match-quest, puzzle-2048, slither-trail, test-scene — Phaser/React) |
| PWA | Yes (ServiceWorkerRegister + InstallPrompt) |
| Social automation | Buffer GraphQL + AI-generated weekly content packs |
| Linked to GitHub | Yes — `RUDY4K/plixfy` |
| Linked to Vercel | Yes — deployed to plixfy.com |

### Files in both, materially different (whitespace-ignored)
| File | Local size | GitHub size | What's different |
|---|---:|---:|---|
| `app/layout.tsx` | 1948 B | 6178 B | GitHub loads Geist + Orbitron + DM Sans fonts, AdSense, Cookie Consent, GA4, PWA SW, Install Prompt, Mobile Nav, Achievement Toast components. Local has Tajawal + Inter, no analytics, RTL `<html lang="ar" dir="rtl">`. |
| `app/page.tsx` | 3070 B | 5131 B | Completely different homepage structure |
| `app/robots.ts` | 283 B | 1729 B | GitHub: 10 user-agent blocks (incl. GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot/Bytespider). Local: 1 wildcard rule. |
| `app/sitemap.ts` | 1081 B | 1519 B | GitHub: sources from `GAMES` registry + topic landing pages. Local: from `allGames` constant. |
| `next.config.ts` | 474 B | 1565 B | GitHub: apex→www 301 redirect. Local: empty config (Turbopack only). |
| `app/favorites/page.tsx` | 934 B | 801 B | Different copy/markup; both noindex |
| `app/profile/page.tsx` | 1236 B | 393 B | Local has more content; GitHub delegates to ProfileView component |
| `components/GameCard.tsx` | 2972 B | 10857 B | GitHub has rating/favorite buttons, badges, view counts |
| `components/Header.tsx` | 4091 B | 3052 B | Local has more (search bar?); GitHub simpler shell |
| `package.json` | 485 B | 685 B | Dep diff: GitHub adds @supabase/{ssr,supabase-js}, next-sitemap, phaser, eslint, eslint-config-next. Local adds lucide-react. |
| `tsconfig.json` | 685 B | 700 B | Minor path-alias difference likely |
| `.gitignore` | 565 B | 872 B | GitHub adds more excludes (scripts/output/, .vercel) |

### Files only in local (23)
```
.env.local
app/categories/page.tsx
app/category/[slug]/page.tsx
app/play/[slug]/page.tsx
app/search/page.tsx
components/BottomNav.tsx
components/CategoryStrip.tsx
components/GameFrame.tsx
components/HeroTile.tsx
data/catalog-summary.md
data/playgama-catalog.json
lib/games.ts                    (388 KB — the entire Playgama catalog inline)
lib/playgama.ts
next-env.d.ts
public/*.svg (5 default CRA assets)
research/language-strategy-2026/decision_matrix.md
research/language-strategy-2026/evidence_log.md
research/language-strategy-2026/language_strategy_report.md
research/language-strategy-2026/market_data.json
```

### Files only in GitHub (784)
Highlights (rest are game data files, public images, scripts):
```
.env.example, DEPLOY.md, eslint.config.mjs
app/about/page.tsx, app/api/{activity,play/[topic],thumb/[file]}/route.ts
app/games/[slug]/page.tsx, app/games/page.tsx
app/play/[topic]/page.tsx        (NOTE: different shape from local's app/play/[slug]/)
app/privacy/page.tsx, app/terms/page.tsx
app/test-phaser/{page.tsx,TestPhaserStage.tsx}
components/  (45+ components incl. AdSenseScript, GoogleAnalytics, PhaserGame, Hero, Footer, etc.)
docs/  (plans + research subdirs)
games/{flap-hero,match-quest,puzzle-2048,slither-trail,test-scene}/  (custom game source)
games/registry.ts                (the canonical GAMES export)
lib/supabase/  (Supabase client wrappers)
public/{assets,icons,social,socials}/  (PWA icons, OG images, social packs)
scripts/  (16 scripts: harvest, generate, audit, upload-to-buffer)
supabase/migrations/0001_initial.sql
types/
```

---

## Appendix 2 — Recent GitHub Commit Timeline (Last 20)

All by `RUDY4K`, all on `2026-05-22` or `2026-05-23`:

```
f85209b  2026-05-23  fix(seo): 301-redirect apex plixfy.com → www.plixfy.com         [touches next.config.ts, ROUTING]
e431caf  2026-05-23  chore(audit): add link auditor; remove latent /profile/<username> 404
ef9a3c0  2026-05-23  fix(seo): create /games master catalog page — was returning 404 [touches SITEMAP via new route]
bd9dd1f  2026-05-23  fix(analytics): actually load gtag.js — GA4 was never on the live site
49b2589  2026-05-23  fix(game): mobile layout — eliminate horizontal overflow on /games/[slug]
71d0be9  2026-05-23  deploy: trigger with bypass env                                 [touches ENV]
9875f3f  2026-05-23  trigger: force redeploy
ed28999  2026-05-23  fix(play): paginate topic pages to stay under Vercel's 19MB ISR limit  [touches ROUTING]
8389794  2026-05-23  chore: untrack scripts/output/ (generated artifacts)
3893ed9  2026-05-23  fix(ui): rename next/font variables; clean Hero style spread
d318378  2026-05-23  feat(ui): Neon Arcade — full visual redesign
6331a0e  2026-05-23  feat(ui): apply dopamine palette across cards, sections, and chrome
f69add8  2026-05-23  social: weekly pack
5bb175a  2026-05-23  social: move weekly images to /socials/ to bypass stale CDN 404 cache
e2bf4e6  2026-05-23  social images
7400930  2026-05-23  social: fix Twitter/Instagram createPost requirements + image fallback
7870678  2026-05-23  social: switch Buffer GraphQL endpoint to api.buffer.com
8ba7265  2026-05-23  social: migrate Buffer scheduler to GraphQL API
39fee3e  2026-05-23  social: weekly pack + scripts
d40b46b  2026-05-22  feat: mobile/desktop platform classification + filter
```

**Flagged commits by category:**
- **next.config:** `f85209b` (apex→www 301)
- **vercel.json:** none — repo doesn't have a vercel.json
- **env:** `71d0be9` (bypass env trigger)
- **SEO files:** `f85209b`, `ef9a3c0`, `bd9dd1f`, `ed28999`
- **routing:** `f85209b`, `ef9a3c0`, `ed28999`, `49b2589`

---

## Appendix 3 — Live Site Probes

```
GET https://www.plixfy.com
  HTTP/1.1 200 OK
  Server: Vercel
  X-Nextjs-Prerender: 1
  X-Vercel-Cache: HIT
  Age: 830701  (= 9.6 days, matches last commit 2026-05-23)
  Content-Length: 3,247,939 bytes (3.2 MB prerendered HTML)

GET https://www.plixfy.com/sitemap.xml
  HTTP/1.1 200 OK
  Content-Length: 938,135 bytes
  URL count: 5,368

GET https://www.plixfy.com/robots.txt
  HTTP/1.1 200 OK
  Rules for: *, GPTBot, OAI-SearchBot (and presumably ChatGPT-User, ClaudeBot,
  anthropic-ai, PerplexityBot, Google-Extended, CCBot, Bytespider — verified
  from source robots.ts in GitHub clone)
  Sitemap: https://www.plixfy.com/sitemap.xml

GET https://www.plixfy.com/llms.txt
  HTTP/1.1 200 OK  (yes, the site has an llms.txt — for AI-grounding)

JSON-LD types found on /games/flap-hero:
  Organization, WebSite, SearchAction, VideoGame, BreadcrumbList,
  Offer, EntryPoint, ListItem
  (8 distinct types — vs local's 2: VideoGame + BreadcrumbList)

GA4 tag: G-M1P4JYT5B6 (visible in homepage HTML, loaded via gtag)
```

---

## Appendix 4 — Open Item: Vercel Env Var Audit

To complete this report, I need to run `vercel env ls production` against the live project. The Vercel CLI is installed (v54.4.1) but not logged in on this machine. Please run:

```bash
! vercel login
```

(The `!` prefix runs it interactively in your terminal so the device-code flow works.) Once you're authenticated, ping me and I'll run `vercel env ls` to confirm the exact production env var name list, then update Appendix 1 / Section E with the verified set.

---

## What I Recommend

**My honest read, on a single read of the data:**

The strategic-research report I wrote earlier this week (`research/language-strategy-2026/language_strategy_report.md`) assumed plixfy.com was the Arabic project being deepened. That assumption was wrong. Re-reading it under correct assumptions:

- **The live English plixfy.com is a more mature, higher-leverage asset than the Arabic experiment.** It's competing in the saturated English market (a losing bet per that same report) but it has 5,000 games, GA4 history, social automation, and Supabase infrastructure already shipped.
- **The Arabic experiment we built this week is exactly the "MENA cultural moat" play the report recommended** — uncontested, mobile-first, with a Playgama partner stack.
- **These are complementary, not competitive.** The right play is **Path 1 (separate properties)** for the next 3-6 months while you measure which one accumulates traffic faster. Then revisit whether to merge (Path 2) or sunset one of them.

**Path 1 minimizes regret.** Path 3 is essentially "delete the more mature project to ship the less mature one" — that's only the right call if you've decided English-plixfy.com is strategically wrong AND you're willing to eat the SEO loss. The evidence to make that call doesn't exist yet — give Arabic 3 months at its own URL to prove itself.

**Awaiting your decision.** Nothing has been pushed or deployed. Local repo is at commit `211a37f` on master, clean working tree. GitHub clone is read-only reference at `C:\Users\gaming\plixfy-from-github`.
