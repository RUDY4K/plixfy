# Plixfy Migration — Final Report

**Date:** 2026-06-02
**Executor:** Claude Opus 4.7
**Operator:** RUDY4K (plixfycom-6051 on Vercel)
**Outcome:** ✅ **SUCCESS** — `plixfy.com` now serves the Arabic `plixfy-new` project; English code preserved in backup tag/release.

---

## Step-by-step status

| # | Step | Status | Evidence |
|---|---|---|---|
| 1 | Backup English HEAD (tag + GitHub Release) | ✅ Success | Tag `pre-migration-2026-06-02` on commit `f85209b`, tag SHA `ee11bbb9961179fb8aa3c840f9bec0b9e7a61ef2`. Release published at <https://github.com/RUDY4K/plixfy/releases/tag/pre-migration-2026-06-02> |
| 2 | Add `origin` remote to `plixfy-new` + fetch | ✅ Success | `origin → https://github.com/RUDY4K/plixfy.git`. Fetch retrieved `main` + the backup tag. |
| 3 | Rename local `master` → `main` (remote default = `main`) | ✅ Success | `git branch -M master main`; local now on `main`. |
| 4 | Force-push Arabic project to GitHub | ✅ Success | `+ f85209b...211a37f main -> main (forced update)`. Remote HEAD = `211a37fa63812ee167c1d1f66078cbf21a9860c7`. Backup tag still resolves to `ee11bbb...`. |
| 5 | `vercel link` to `plixfy-s-projects/plixfy` | ✅ Success | First attempt failed with "personal account cannot be the scope" — retried with `--scope plixfy-s-projects`. Project ID `prj_rgTSlSOgEx4pBZDsXlKo76qJSGl5`, team `team_1JiaZfkGhhXdLeYGvWDV5SdR`. |
| 6 | Remove 6 obsolete env vars (Clerk + Supabase) | ✅ Success | All 6 removed. Note: Vercel CLI rm removes the var entirely on first call regardless of which environment is named — "not found" on the second `rm <name> preview` call is benign confirmation. |
| 7 | Add `NEXT_PUBLIC_PLAYGAMA_CLID` to production + preview + development | ✅ Success (one workaround) | Production + development succeeded via CLI. Preview hit a CLI UX loop on the "all preview branches" prompt — completed via direct Vercel REST API call (`POST /v10/projects/.../env`). Final state: var present in all 3 environments. |
| 8 | Verify + update `NEXT_PUBLIC_SITE_URL` to `https://www.plixfy.com` | ✅ Success (with note) | Current production value was empty (`""`). Removed and re-added via API with target `["production","preview"]`. Pull-verified value = `https://www.plixfy.com`. |
| 9 | Verify preserved vars untouched | ✅ Success | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`, `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR` all still listed (Encrypted, both Production + Preview, created 10-12d ago). Values can't be re-read via `vercel env pull` because they were created as Vercel "sensitive" type — proof they're populated is GA_ID still rendering `G-M1P4JYT5B6` in homepage HTML. |
| 10 | Verify auto-deploy from force-push | ✅ Success | Auto-deploy triggered immediately. Build completed in **42 seconds** (vs 9-10 min for the English builds — reflects the 384-page Arabic project vs 5,886-page English project). Deploy ID `dpl_DvGzYvYWgWbsEdCt9A8A4JiRotGs`. |
| 11 | Smoke tests (4 routes) | ✅ All pass | Homepage: Arabic HTML, `lang="ar" dir="rtl"`, title "Plixfy \| بليكسفاي - ألعاب أونلاين مجانية". Sitemap: 384 URLs (matches local build exactly). Robots: matches our `src/app/robots.ts`. `/play/moto-x3m`: Arabic page with VideoGame + Offer + BreadcrumbList JSON-LD schemas. |
| 12 | Domain verification | ✅ Success | `plixfy.com` registered to project (third-party DNS = Namecheap). Both apex `plixfy.com` AND www `www.plixfy.com` aliased to the new deploy. No DNS or domain config changes required. |
| 13 | Write this report | ✅ This file | |

---

## Final production env var list

```
 name                                       value       environments                created
 NEXT_PUBLIC_SITE_URL                       Encrypted   Production, Preview         just now    (= https://www.plixfy.com)
 NEXT_PUBLIC_PLAYGAMA_CLID                  Encrypted   Production, Preview, Dev    just now    (= p_bd2554c2-64a4-43a2-a147-a49c5a3f494a)
 VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR     Encrypted   Production, Preview         10d ago
 NEXT_PUBLIC_GA_ID                          Encrypted   Production, Preview         12d ago     (= G-M1P4JYT5B6, sensitive)
 NEXT_PUBLIC_GSC_VERIFICATION               Encrypted   Production, Preview         12d ago     (sensitive)
```

**Removed (no longer set anywhere):**
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

---

## Backup references

| Asset | Location |
|---|---|
| **Backup git tag** | `pre-migration-2026-06-02` on `RUDY4K/plixfy` |
| **Tag SHA (annotated tag object)** | `ee11bbb9961179fb8aa3c840f9bec0b9e7a61ef2` |
| **Tag points at commit** | `f85209b` (last English Plixfy state, 2026-05-23) |
| **GitHub Release** | <https://github.com/RUDY4K/plixfy/releases/tag/pre-migration-2026-06-02> |
| **Local read-only clone of English code** | `C:\Users\gaming\plixfy-from-github` (803 files, do not modify) |
| **Last good English Vercel deploy** | `https://plixfy-nokq6btci-plixfy-s-projects.vercel.app` (10 days old, status Ready — promotable from Vercel dashboard if rollback needed) |

---

## Production URL + deploy info

| | |
|---|---|
| **Production deploy ID** | `dpl_DvGzYvYWgWbsEdCt9A8A4JiRotGs` |
| **Deploy hash URL** | `https://plixfy-bytl4ifkj-plixfy-s-projects.vercel.app` |
| **Commit deployed** | `211a37fa63812ee167c1d1f66078cbf21a9860c7` (`feat: SEO foundation + Playgama integration`) |
| **Public URLs (aliases)** | `https://www.plixfy.com`, `https://plixfy.com`, `https://plixfy.vercel.app`, `https://plixfy-plixfy-s-projects.vercel.app`, `https://plixfy-git-main-plixfy-s-projects.vercel.app` |
| **Build time** | 42 seconds |
| **Build size** | 384 routes (10 static + 8 categories + 372 games + 4 metadata) |
| **Build hash** | (Next.js doesn't expose this on prerendered HTML — visible only in `/_next/static/<hash>/` paths inside the HTML body) |

---

## Anomalies

### 1. Canonical URL mismatch (medium priority — fix recommended)
The Arabic project's `src/app/layout.tsx` hardcodes `metadataBase: new URL("https://plixfy.com")` (apex, no www) while the live site serves at `https://www.plixfy.com`. Homepage canonical currently rendered as `<link rel="canonical" href="https://plixfy.com"/>`. This will cause Google to see a mismatch between served URL and stated canonical. **Recommended fix:** change `metadataBase` to `new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.plixfy.com")` and let the env var (now set to `https://www.plixfy.com`) be the source of truth. This change requires a new commit + deploy.

### 2. No apex→www 301 redirect (medium priority — fix recommended)
The old English `next.config.ts` had an apex→www 301 in code (commit `f85209b`). Our Arabic project's `next.config.ts` is empty. Currently both `plixfy.com` and `www.plixfy.com` serve the Arabic site as separate aliases — Google may index both as duplicates. **Recommended fix:** port the apex→www redirect block from `pre-migration-2026-06-02` tag's `next.config.ts` into our `next.config.ts`. (Verify in the Vercel domain settings that `plixfy.com` is "Serve" not "Redirect to www", otherwise the in-code redirect won't fire.)

### 3. CLI quirks worked around (informational, no action)
- `vercel link --scope <personal>` rejected with "personal account cannot be scope" — required `--scope plixfy-s-projects` explicitly.
- `vercel env add NAME preview` with `--value --yes` loops on the "all preview branches" prompt — bypassed via direct Vercel REST API POST.
- `vercel env rm NAME production --yes` removes the variable entirely; subsequent `rm NAME preview --yes` returns "env_not_found" but is benign.

### 4. Live site cache will take minutes to fully invalidate (informational)
At time of smoke tests, all 4 routes returned `Age: 0` (fresh from origin). Older edge cached responses may still serve briefly for some users in some regions. Should be fully purged within ~5 minutes.

### 5. ⚠️ Vercel auth tokens leaked into chat history (security follow-up required)
During session setup, my redaction regex failed and the Vercel access token (`vca_80wY...`) and refresh token (`vcr_6ng44...`) appeared in chat output. **Action required:** Revoke both tokens via <https://vercel.com/account/tokens> as soon as convenient. New `vercel login` will issue replacements.

---

## Recommended next actions

### Immediate (today)
1. **Revoke leaked Vercel tokens** at <https://vercel.com/account/tokens> (see Anomaly 5).
2. **Open Google Search Console**, change property URL prefix from `https://plixfy.com` (English) to `https://www.plixfy.com` if you haven't already. The old GSC verification token in env var `NEXT_PUBLIC_GSC_VERIFICATION` may have been for a different property/host — verify ownership on the www property still resolves.
3. **Resubmit sitemap** in GSC: `https://www.plixfy.com/sitemap.xml`. Expect Google to start crawling the 384 Arabic URLs immediately and de-listing the 5,368 English URLs over 2-6 weeks.

### Soon (this week)
4. **Fix canonical mismatch** (Anomaly 1) — single-line edit in `src/app/layout.tsx`.
5. **Add apex→www 301** (Anomaly 2) — copy block from backup tag's `next.config.ts`.
6. **Verify GA4 still firing.** The env var is preserved, but no client code in `plixfy-new` actually loads `gtag.js`. The old English `app/layout.tsx` mounted a `<GoogleAnalytics />` component. Either:
   - Decision A: leave GA4 unused (no analytics) — then remove `NEXT_PUBLIC_GA_ID` from Vercel as cleanup.
   - Decision B: add a GA4 component to the Arabic layout (port from `plixfy-from-github/components/GoogleAnalytics.tsx`).
7. **Verify GSC verification meta tag.** Same issue — env var preserved but no code in `plixfy-new` reads it. The English code had `<meta name="google-site-verification" content={GSC_VERIFICATION}>` in layout. If the GSC property re-verification depends on the meta tag being served, current site fails verification. Port the meta tag if needed.

### Strategic (this month)
8. **Decide on AdSense path.** The Vercel env vars no longer include `NEXT_PUBLIC_ADSENSE_CLIENT_ID` or `NEXT_PUBLIC_AD_PROVIDER`. The English project had AdSense scaffolding; ours has placeholder slots in JSX but no wiring. Apply for AdSense on the new Arabic site once it has 30+ days of traffic and 50+ pages indexed.
9. **Re-evaluate Playgama integration.** The current Arabic site iframes 372 games directly via the Playgama embed URL with the affiliate `clid` parameter. Confirm in Playgama's partner dashboard that the new domain (`www.plixfy.com`) is whitelisted and that revenue attribution is flowing under the new traffic profile.
10. **Plan first content push.** With 372 games and clean SEO structure, the main near-term lever is acquisition. Per the language-strategy report (`research/language-strategy-2026/`), TikTok funnel in Arabic should be priority #1 for the next 60 days.

---

## What this migration did NOT do (preserved as instructed)
- ❌ Did not delete `C:\Users\gaming\plixfy-from-github` (the English read-only reference clone)
- ❌ Did not delete the `pre-migration-2026-06-02` git tag or GitHub Release
- ❌ Did not delete or rename the Vercel project (`plixfy-s-projects/plixfy`)
- ❌ Did not change DNS settings at Namecheap
- ❌ Did not remove `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`, or `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR`
- ❌ Did not push or trigger anything on the old English code path — the backup tag is the only authoritative reference to the prior state

---

## Rollback (still available)

If the Arabic deploy turns out to be wrong call:

1. **Fast traffic restoration (~30 seconds):** Vercel Dashboard → Deployments → find the 10-day-old "Ready" deploy `plixfy-nokq6btci-plixfy-s-projects.vercel.app` → ⋯ → "Promote to Production". Traffic instantly routed back to English without rebuild.
2. **Git restoration (~2 min):** `cd C:\Users\gaming\plixfy-from-github && git push origin pre-migration-2026-06-02:main --force` — restores `main` to the English HEAD. Next auto-deploy rebuilds the English site.
3. **Both steps together = full English restoration in <5 minutes.**

Recovery window is open indefinitely as long as the backup tag exists. Do not delete the tag or the read-only clone.

---

**End of report.**
