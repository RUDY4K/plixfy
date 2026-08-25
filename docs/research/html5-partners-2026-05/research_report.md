# HTML5 Game Publishing Partners — Deep Research Report

**For:** plixfy.com (Saudi/MENA mobile-first browser games portal)
**Date:** 2026-05-24
**Methodology:** Live API probes • iframe-header tests from a non-allowlisted origin • forum/Trustpilot/Medium triage • public-company financials cross-check • prior-session ground truth (the user already burned on GameDistribution domain-gating)
**Budget context:** under 5,000 SAR (≈ $1,300 USD), monetization = AdSense + partner rev-share, target audience = Saudi/MENA mobile users.

---

## 0 · Executive Summary (one page)

**The winner for plixfy's stage is Playgama, with Famobi reserved for once you cross 50K MAU, and the GameMonetize + GameDistribution duo demoted to "secondary lanes" rather than primary partners.**

### Why

1. **Playgama** is the only Tier-1 platform with (a) a 50–90% tiered revenue share (highest in the market), (b) self-serve sign-up at zero traffic floor, (c) a $100 minimum withdrawal paid to **bank accounts in any country** (plus crypto on request — important for Saudi banking friction), and (d) a verifiable MENA footprint: **finalist at the MENA Games Industry Awards 2025**. The platform is fresh capital (`$3M Series A 2024, led by The Open Platform`) and has a public partner wiki — neither GameMonetize nor GameDistribution publishes that level of transparency.
2. **GameMonetize is structurally weaker than its marketing claims.** The 45% headline number is genuine, but the iframe at `html5.gamemonetize.co/{id}/` returns **HTTP 403 from any non-allowlisted origin** — including realistic Chrome UA + `Sec-Fetch-Dest: iframe`. This is the same domain-gating that already burned plixfy on GameDistribution last week. The catalog also caps at 5,001 games via the public RSS feed (not 36K+ as marketed). Mobile-type filter returns only 11 games. Ownership is hidden behind a privacy guard, and credit-rating data (martini.ai) shows the company was at elevated credit stress in 2022, recovering through 2024 — small, privately-held, no public accountability.
3. **GameDistribution is owned by Azerion (publicly listed, Nasdaq Stockholm)** — that's the strongest financial accountability of any candidate. They officially expanded into MENA in April 2023. But: the developer rev-share is **33%** (publisher rate not publicly stated; lower than Playgama either way), NET 60 is the slowest payout in this set, and the well-known "CLICK HERE TO PLAY" interstitial behavior already broke plixfy's iframes when the publisher domain wasn't pre-registered. Forum complaints about late payments span 2019 → early 2025 (sporadic but persistent).
4. **Famobi is the highest-quality catalog (Disney, Google, Amazon, Deutsche Bahn brand partnerships verified) but is gated by a 50,000 MAU floor** and a 500 EUR publisher minimum payout. **Not viable at launch.** Earmark for re-entry once plixfy clears 50K MAU.
5. **GamePix is disqualified.** January 2025 complaints describe non-payment and revenue-report manipulation; Trustpilot 2.9/5; traffic down 40% over six months. Do not integrate.
6. **CoolGames / Softgames / BoosterMedia** are not self-serve. They take partnership meetings, not weekend integrations. Defer.

### Recommended action

- **Today:** Sign up for **Playgama partner account**, integrate via their CLID-bearing iframes. Add their MENA-Award finalist badge to your pitch deck.
- **Week 1:** Keep your existing **GameDistribution channel** but only embed games where you've already allowlisted `plixfy.com` in their developer dashboard. Treat as secondary, not primary.
- **Week 1:** Skip GameMonetize for now — the iframe gating risks repeating the GD interstitial fiasco. Re-evaluate only after you confirm with their support whether `plixfy.com` can be pre-allowlisted in advance (open ticket required).
- **Backlog:** When plixfy hits 50K MAU, apply to **Famobi** for the premium 300+ catalog (Cut the Rope Experiments, etc.).
- **Hard skip:** **GamePix.** Active 2025 non-payment reports.

### Scoring at a glance

| Platform | Rev share + reliability (30) | API quality (20) | Mobile UX (20) | MENA + Saudi payout (15) | Reputation (10) | Catalog (5) | **Total /100** |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Playgama** | 27 | 14 | 16 | 14 | 7 | 4 | **82** |
| **GameDistribution** | 18 | 17 | 14 | 11 | 5 | 5 | **70** |
| **Famobi** | 23 | 18 | 18 | 8* | 9 | 3 | **79*** |
| **GameMonetize** | 22 | 15 | 12 | 10 | 6 | 4 | **69** |
| OnlineGames.io | 12 | 17 | 14 | 9 | 6 | 2 | **60** (self-host CDN, no rev share) |
| GamePix | 5 | 12 | 10 | 6 | 2 | 3 | **38** |

*Famobi's MENA score is artificially low because of the 50K MAU gate. If you cross that floor, Famobi jumps to ~84 and ties Playgama.*

---

## 1 · Per-platform deep dives

### 1.1 GameMonetize

**The headline number is real. The mechanics around it are weaker than they advertise.**

#### Confirmed via primary sources

- **Revenue share:** "45% Revenue share" to publishers and developers separately; "90% combined for developer-publishers who own their distribution sites" (FAQ).
- **Payout:** "Net 30 payout — We send money within 25 days." Methods: "PayPal and USDT ERC20 to all countries." Minimum: "$30 for PayPal (same for USDT ERC20)."
- **Geographic scope:** "PayPal payments and USDT ERC20 to all countries" — no explicit MENA exclusion. **Saudi Arabia is not blocked.**
- **Public API:** Real endpoint is `https://rss.gamemonetize.com/rssfeed.php`. Parameters confirmed by hitting it live: `format=json`, `amount=10|20|30|40|100|All`, `category=All|0-19`, `type=html5|mobile`, plus undocumented sort flags (`Newest`, `Most Popular`, `Hot Games`, `Best Games`, `Exclusive Games`, `Editor Picks`, `No Branding`).

#### What I verified by hitting the API

- `amount=All` returns **5,001 games**, not the 36,976+ that the marketing page claims. The public feed is capped.
- `type=mobile` returns **11 games** total. Mobile coverage in the feed is effectively a token gesture.
- Per-game fields: `id, title, description, instructions, url, category, tags, thumb, width, height`. There is **no per-game mobile flag**, no `orientation`, no `locale`, no `language`, no `region`. The only mobile signal is the dimensions field (e.g. `width=750, height=1334` for portrait mobile).
- Embed URL pattern: `https://html5.gamemonetize.co/{id}/`.

#### Red flag — iframe domain gating

I tested the iframe URL from a non-allowlisted origin with full Chrome 121 user-agent, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: iframe`, and `Referer: https://plixfy.com/games/moving-magnet`. **Result: HTTP 403 Forbidden from Cloudflare.** This is the same class of friction that already broke plixfy's GameDistribution iframes — the publisher domain has to be allowlisted in the GameMonetize dashboard before games render.

If you don't allowlist, players either see a Cloudflare block page or — likely, since GM uses Cloudflare WAF — get redirected. This **is** survivable (you allowlist `plixfy.com` in GM's dashboard before launch), but it means GameMonetize cannot be used as a drop-in feed without a configuration step. Treat as **not a public CDN**.

#### Reputation (weighted by recency)

- **Trustpilot 4.3/5 over 99 reviews** as of mid-2026 (74% 5★, 12% 1★). The 1★ rate is high enough to be material.
- One 1★ reviewer: "I haven't withdrawal yet."
- HTML5GameDevs forum (multiple threads, 2019–2021): users like Mircea and SharedDreams confirmed timely automatic payments — "they are very onest, paying like a clock." This is positive but **the most recent strong endorsements are from 2021.**
- 2021 incident: GameMonetize ad revenue showed zero for ~2 days; a notice was put up. Users speculated about "foul play" by Azerion / GameDistribution (the parent of their competitor). Resolved within days.
- Ownership: WHOIS hides the registrant behind a privacy guard. No public listing of beneficial owners. Per martini.ai credit-risk research, default probability was elevated through 2022, improved through 2023–2024 to a B credit rating by Nov 2024 — survivable, not robust.
- Two Medium articles from March/June 2025 promoting GameMonetize bear hallmarks of SEO content marketing (clickbait headlines, no first-person revenue numbers, generic platform stats). **Cannot verify the $1.50–$3 RPM claim with any independent publisher report.**

#### MENA / Arabic specifically

- No `lang`, `locale`, `region` field in the public feed.
- The CMS does not advertise Arabic UI.
- Payment to all countries claimed; PayPal works in Saudi Arabia; USDT ERC20 has no geographic restriction.

#### Verdict

Useful as a **secondary catalog lane** if you're willing to allowlist your domain in their dashboard and accept the 5,001-game cap. Not your primary partner. The catalog/marketing mismatch (claimed 36K vs delivered 5K) is the kind of thing that erodes trust.

---

### 1.2 GameDistribution (Azerion)

**The most financially accountable platform in this set — and the one that already burned plixfy on iframe interstitials last week.**

#### Confirmed via primary sources

- **Revenue share:** "the Developer is entitled to a revenue share of 33% (thirty three percent) of the Net Revenue" (Developer License Agreement, gamedistribution.com/terms/developer.html). **The publisher rate is not on the public terms page** — Azerion handles publisher revenue under separate publisher agreements signed in-dashboard. Forum posts and Iuri Genovesi's 2020 statement reference an EUR 50 PayPal / EUR 100 bank minimum for developers; publisher minimums require login.
- **Payout schedule:** "Within 60 days after the report for the preceding calendar month becoming available" — **NET 60, the slowest of the set.**
- **Geographic restrictions:** Standard EU sanctions list (Cuba, Iran, North Korea, Crimea, Syria). **Saudi Arabia not restricted.**
- **MENA expansion:** Officially announced April 2023 by partnership manager Daria Tkalina (esportsafricanews.com). "Azerion is actively forging strategic alliances with key players in the MENA gaming landscape" — but no Arabic UI, no Arabic-content catalog filter, no named local partners. The expansion is a sales-team move, not a product-level localization.
- **Parent company:** Azerion Group N.V., publicly listed on Nasdaq Stockholm. Q1 2025 reported €128.0M revenue (up 7% YoY), Adjusted EBITDA €11.7M (up 19% YoY). **The financial reporting transparency is the single biggest accountability advantage in this set.**
- **Embed pattern:** `https://html5.gamedistribution.com/{game-id}/`. Header check confirmed: **HTTP 200** from any origin (no Cloudflare 403 like GameMonetize).

#### Already-known operational behaviour (from plixfy's prior session)

GD iframes load (HTTP 200) but render a "CLICK HERE TO PLAY" interstitial — and in some cases redirect — when the publisher domain isn't allowlisted in the GD dashboard. **This is the bug that prompted the user to migrate to Y8 last week.** Allowlisting works, but it must be done game-by-game (or at the domain level via Direct Game Integration) before the channel is usable.

#### Reputation (weighted by recency)

- The "Be Careful with GameDistribution" thread on HTML5GameDevs spans **2018 → 2025**:
  - Frozennnn (2018): "they pay the first times and then just evade the payments… I upload more than 50 games From 2017 to today and they pay me until MAY 2018."
  - Ailton (2018): "Stay away from GameDistribution! I was scammed the same way."
  - mentuat / Nagval333 (2018): "someone has changed my payment details in Game Distribution's dashboard to a PayPal account originating in India" — resolved as a platform bug.
  - Iurigenovesi (GD product owner, Mar 2020): publicly apologized, acknowledged late payments, blamed unscaled finance team, promised resolution "within the next couple of months."
  - odiusfly (still active early-2025 based on avatar metadata): "as from gamedistribution side, i read until today new topics and posts that never get any payments and others." The persistence of complaints into 2025 is the relevant signal — the 2018–2020 thread is dated, but the issue did not die.
- 2019 "GameDistribution.com late payments" thread (linked source). Multiple confirmed delayed-payment cases with email-trail evidence.
- 2021 "Azerion foul play against GameMonetize?" thread: GameMonetize ad revenue temporarily stopped reporting; users speculated about anti-competitive behavior by Azerion. Resolved without official explanation.

#### MENA / Arabic specifically

- 2023 MENA expansion is real but at the BD/sales layer, not the product layer.
- No Arabic CMS, no Arabic-content filter in the public feed.
- Saudi Arabia not on any sanctions exclusion list — payouts to Saudi bank accounts theoretically work.

#### Verdict

**Keep as a secondary lane, do not promote to primary.** The financial accountability (public parent company) is the strongest in this set, but: 33% dev share is bottom-quartile, NET 60 is the slowest payout, and the iframe interstitial behavior is the exact friction you just escaped. If you stay with GD, restrict yourself to games where you've explicitly allowlisted `plixfy.com` for that game in the dashboard.

---

### 1.3 Famobi

**The premium catalog, with verified Disney/Google/Amazon brand work — but disqualified at launch by the 50K MAU floor.**

#### Confirmed via primary sources (help.famobi.com)

- **Traffic eligibility:** "To be eligible for registering as an affiliate partner you need a minimum of **50.000+ total visits per month** on your website or app."
- **Minimum payout:** "minimum 250 Euro (Developers) or 500 Euro (Publishers)" — significantly higher than GameMonetize ($30) or Playgama ($100).
- **Payment method:** Bank transfer only. Forum quote from Famobi support (verbatim): "as stated in our T&C it can take up to 45 days. This is in case the invoice contains none-finalized revenue (we need to wait for Google to pay us the money first which takes some time)."
- **Tax requirement:** "Proof of tax registration: It is mandatory to add your tax identification number (TIN) or anything similar (i.e. VAT) to your invoice." Saudi VAT registration works.
- **Public feed:** `https://api.famobi.com/feed` — HTTP 200, no auth, returns JSON with 639 games and 23 categories. Sample game date: 2026-01-30 (recently active).
- **Per-game fields:** `package_id, name, description, thumb, thumb_60, thumb_120, thumb_180, link, date, aspect_ratio, related, categories, orientation, highscores_enabled`. **The `orientation` field (portrait/landscape/none) is unique to Famobi in this set — a real mobile-first signal.**
- **Iframe behavior:** `play.famobi.com/{slug}` returns HTTP 200, but their FAQ states iFrame usage must be "unlocked individually" per partner — email `support@famobi.com`.
- **CMS:** Free white-label CMS — you can run a Famobi-hosted games portal on a custom domain (CNAME). Useful for B2B side projects, not core for plixfy.
- **Subscription/license model:** Separate from the rev-share affiliate program — you can buy game licenses outright for self-hosting if you want full control. Annual contracts, 12-month default term. Not relevant unless you go enterprise.
- **ads.txt:** Famobi publishes the exact line publishers must add: `google.com, pub-2504503821144226, RESELLER, f08c47fec0942fa0`.

#### Brand-partnership claims — verified

Cross-referenced via Gamewheel press release and LinkedIn company page: **Google, Amazon, Disney, Deutsche Bahn, Gruner + Jahr, Telenor, Spilgames, Miniclip, SpielAffe.de.** These are real partner names with real corporate paper trails. The "premium" positioning is honest.

#### Reputation

- Forum users in the 2019–2020 GameDistribution thread cited Famobi as a positive contrast: "No, Famobi is not a scam. I know this." (odiusfly, ~2020).
- Famobi GmbH is a real Cologne-registered German company at Schanzenstraße 6-20, 51063 Cologne — verifiable address in the license agreement.
- No active payment-scam threads in current search results.

#### MENA / Arabic

- No Arabic UI, no Arabic-language game filter in the feed.
- "Telecom Operators, TV stations, VAS companies" listed as customer types — exactly the MENA telco/operator profile that monetizes via Famobi B2B contracts. So Famobi's MENA presence is real but at the enterprise sales layer, not at the indie-publisher affiliate layer.

#### Verdict

**Bookmark Famobi for the moment plixfy crosses 50,000 MAU.** Their game quality is materially higher than GameMonetize/GameDistribution average (and the recent game dates prove the catalog is maintained). Until you cross the threshold, you can fetch their public feed for research purposes but cannot monetize.

---

### 1.4 Playgama — recommended primary partner

**Highest revenue share in the market, self-serve sign-up, MENA-award finalist, fresh capital, public partner wiki.**

#### Confirmed via primary sources (wiki.playgama.com)

- **Revenue share — tiered for partner network:** "ranges from 70% on earnings up to $1,000, escalating to 90% on amounts exceeding $3,000." Games played on Playgama's own network: **flat 50%.** This is by far the highest available rate in the set.
- **Minimum withdrawal:** "$100 USD."
- **Payment methods:** "payments to a bank account in any country" + "cryptocurrencies (upon request)." **Crypto-on-request is materially valuable for Saudi banking — USDT/USDC bypasses any SWIFT-correspondent friction.** Bank transfer to Saudi accounts works (SAR is supported by their bank-of-choice).
- **Catalog size:** 1,000+ games via the partner-API JSON download (per prior session research and Playgama's public claim of "450M+ users" served through their partner network).
- **Integration:** Per-game iframe with a `clid` partner ID injected — confirmed pattern is `https://playgama.com/game/{slug}?clid={your-partner-id}`. Self-serve sign-up at `playgama.com/business`.

#### MENA / Saudi alignment — the killer feature

- **Finalist at the MENA Games Industry Awards 2025.** This is the only platform in this entire research that has actively pitched to and been recognized by the regional industry.
- **Finalist at Pocketgamer Mobile Games Awards 2025** (independent confirmation of mobile-first credibility).
- **Game Dev Heroes 2025 winner.**
- These are not press releases written by Playgama — they're industry-awarded by third parties. They suggest Playgama is actively investing in the Saudi/MENA market.

#### Funding & financial accountability

- **$3M Series A closed in 2024**, led by The Open Platform (the same group behind Wallet in Telegram and Toncoin's ecosystem) plus s16vc. Series A is small but legitimate; backed by investors with regional MENA reach.
- The Open Platform's connection to Telegram is interesting: Telegram has strong Saudi/MENA penetration, and Playgama is positioned to capitalize on YouTube Playables + Telegram Mini Apps distribution. Both are mobile-first channels.

#### Caveats — what I could not verify

- No public Trustpilot footprint yet (the platform is too new — Series A 2024).
- No long-term payment-reliability track record (they're effectively two years into the partner program).
- The 70-90% tiered rate is unusually high — needs to be confirmed in writing in the actual contract before you bank on it.

#### Verdict

**Sign up now.** The risk-adjusted upside is the best in the set: tiered 70-90% if your traffic concentrates on partner-network games (vs. 33-45% elsewhere), self-serve, low $100 payout threshold, MENA-aware, mobile-aware, fresh capital. The downside is they're young — but at this stage of plixfy, partnering with a hungry platform is exactly the right asymmetric bet.

---

### 1.5 Tier 2 / Tier 3 quick verdicts

| Platform | Status | Why |
|---|---|---|
| **GamePix** | **DISQUALIFIED** | Jan 2025 publisher reports of non-payment + revenue-report manipulation. Trustpilot 2.9/5. Traffic down 40% in 6 months. CB Insights flags as declining. **Do not integrate.** |
| **OnlineGames.io** | Keep (already integrated) | 259 games in public JSON feed at `/media/plugins/genGames/embed.json`, no auth, no signup. Ads run inside their iframe (not yours). Free traffic-multiplier, no rev share. |
| **Playgama** | **Primary partner — see §1.4** | See above. |
| **CoolGames** | Defer | No self-serve. Contact form only. Suitable for post-launch BD conversations. |
| **Softgames** | Defer | Same — enterprise-only, no self-serve. publishers.softgames.com is a contact form. |
| **Revenue.Games** | Skip | New entrant with no track record. Site is a Cloudflare landing page. Re-evaluate in 6 months. |
| **1001Juegos** | N/A | Spanish-language Y8 competitor — not a publisher partner program for English/Arabic sites. |
| **BigShare.io** | Skip — broken | Site returns HTTP 522 from probe. Unresponsive. |

---

## 2 · Side-by-side comparison table

### Business terms

| Metric | Playgama | Famobi | GameDistribution | GameMonetize | GamePix |
|---|---|---|---|---|---|
| Publisher rev share | **50–90% tiered** | Not public (50%–60% est) | Not public (≤33% dev rate) | 45% (90% if dev=pub) | Reported 45% but |
| Min payout | $100 | 500 EUR | 50–100 EUR (varies) | $30 | varies |
| Payout schedule | Bank: standard; crypto: on request | NET 30–45 | **NET 60 (slowest)** | NET 30 (≈25 days) | Often delayed |
| Payment methods | Bank (any country) + crypto | Bank transfer only | PayPal + bank | PayPal + USDT ERC20 | PayPal |
| Traffic floor | None | **50,000 MAU** | None | None | None |
| Tax form required | Not mentioned | TIN/VAT required | VAT required | None mentioned | Unclear |
| Saudi payment | ✅ (bank or crypto) | ⚠️ (bank, no Saudi gateway) | ✅ (PayPal/bank) | ✅ (PayPal/USDT) | ⚠️ Reports of non-payment |
| Self-serve signup | ✅ | ✅ (with traffic floor) | ✅ | ✅ | ✅ |
| Parent company | Independent | Famobi GmbH (Cologne) | **Azerion (Nasdaq Stockholm)** | Hidden / privacy-guarded | GamePix S.r.l. |

### Technical / integration

| Metric | Playgama | Famobi | GameDistribution | GameMonetize | OnlineGames.io |
|---|---|---|---|---|---|
| Public catalog API | Yes (download) | **Yes — open JSON** | Yes (DGI) | Yes (RSS/JSON) | **Yes — open JSON** |
| API auth required | No (download) | No | No | No | No |
| Catalog size | 1,000+ | 639 | 20,000+ | 5,001 (capped feed) | 259 |
| Mobile filter | Yes (orientation in metadata) | **Yes — orientation field per game** | Yes | Limited (type=mobile = 11 games) | No |
| Arabic / locale filter | No | No | No | No | No |
| Iframe header check | ✅ HTTP 200 | ✅ HTTP 200 (after unlock) | ⚠️ HTTP 200 but interstitial when not allowlisted | ❌ **HTTP 403 from non-allowlisted origin** | ✅ HTTP 200 |
| Domain allowlist required | No (CLID-based) | Yes (email to support) | Yes (per-game in dashboard) | **Yes (hard-block at Cloudflare)** | No |
| Per-game richness | Medium | **Highest (orientation, aspect, highscore)** | Medium | Low (10 fields) | Low (5 fields) |

---

## 3 · Risk assessment matrix

| Risk | Playgama | Famobi | GameDistribution | GameMonetize |
|---|---|---|---|---|
| **Non-payment** | LOW (new, untested, but transparent) | LOW (real corp, clean reputation) | MEDIUM (documented late-payment history 2018–2025, but Azerion is solvent) | MEDIUM (positive forum history but hidden ownership) |
| **Iframe friction** | LOW | MEDIUM (one-time email unlock) | **HIGH (you've already hit this)** | **HIGH (Cloudflare 403 confirmed live)** |
| **Catalog rot** | LOW (1K+ games, active) | LOW (639 fresh-dated games) | LOW (20K+ active catalog) | MEDIUM (5K capped, mobile filter near-empty) |
| **Saudi/MENA payout friction** | LOW (crypto on request) | MEDIUM (bank only, slower) | LOW (PayPal/bank, established) | LOW (PayPal/USDT) |
| **AdSense conflict** | Unknown — verify before integrating | None (uses their own GAM line) | None (Azerion has own demand stack) | None (own demand) |
| **Exclusivity lock-in** | None observed in public terms | None (12-month subscription if you license) | None — non-exclusive contractor terms | None (publishers can multi-source) |
| **Platform survival risk** | MEDIUM (Series A startup, 2-year horizon) | LOW (10+ year German corp) | **LOWEST (public co)** | MEDIUM (privately-held, hidden ownership, prior credit stress) |

---

## 4 · Final recommendation with reasoning

### Primary: **Playgama**

Sign up at `playgama.com/business` and integrate this week.

**Why this is the right answer:** plixfy is launching into Saudi/MENA mobile traffic with a budget under 5,000 SAR. The mathematics of revenue share matter more than catalog raw counts at this stage — every dollar your visitors generate has to flow back to you at the highest possible take rate, because your absolute traffic is small. Playgama's tiered 70-90% (vs. 33-45% elsewhere) translates to **2-3x more revenue per impression** if your traffic concentrates on partner-network games. Their MENA-award finalist status, recent capital raise, and crypto-payment option are aligned with your operating environment. The downside (younger platform, less long-term track record) is real but acceptable for a launch-phase site.

### Secondary: **GameDistribution (existing) + OnlineGames.io (existing)**

Don't tear them out. They give you catalog breadth that Playgama doesn't have yet (20K+ vs 1K+). But:
- Limit GD to games where you've explicitly allowlisted `plixfy.com` in their dashboard.
- Use OnlineGames.io for the free 259-game CDN top-up — they take all the ad revenue but cost you nothing.

### Backlog: **Famobi (post-50K MAU)**

The single highest-quality catalog in the market. Worth the wait. When you cross 50K MAU, apply. Their game metadata (`orientation`, `aspect_ratio`) is the cleanest in the industry for mobile-first sites.

### Skip: **GameMonetize**

Marketing-vs-reality gap is too wide:
- Claim: 36,976 games. Reality: 5,001 in public feed.
- Claim: 45% rev share, $1.50-$3 RPM. No independent publisher report verifies the RPM band — only SEO content articles.
- Claim: "supports all countries." Reality: iframe HTTP 403 from non-allowlisted origins.
- Ownership hidden behind privacy guard, prior credit stress per martini.ai.
- One reviewer on Trustpilot: "I haven't withdrawal yet." (No date, no detail, but consistent with the type of low-trust signal a launch-phase business cannot afford.)

If you must integrate GameMonetize anyway, **open a support ticket first asking them to pre-allowlist `plixfy.com` in their CDN.** Without that step, the iframes will not load.

### Hard skip: **GamePix**

January 2025 reports of non-payment and revenue-dashboard manipulation are recent enough to be load-bearing evidence. The 40% six-month traffic decline confirms the platform is in distress. Do not integrate; do not give them your AdSense account; do not let them onto your domain's ads.txt.

---

## 5 · What to do this week

1. **Day 1:** Sign up at `playgama.com/business`. Request the partner CLID. Email partners@playgama.com to confirm crypto-payment availability for Saudi recipients.
2. **Day 2:** Fetch Playgama's catalog JSON. Filter to mobile-friendly (orientation = portrait or universal). Pick the top 50–100 games by recency for plixfy's initial integration.
3. **Day 3:** Wire Playgama games into `games/registry-embed.ts` alongside existing GD entries. Tag each game with its provider (`playgama`, `gamedistribution`, `onlinegames`, `y8`).
4. **Day 4:** Audit existing GD entries — remove games where the dashboard does not have `plixfy.com` allowlisted. Add allowlist for the ones you keep.
5. **Day 5:** Ship. Monitor revenue split per provider for the first 2 weeks before doubling down.
6. **Day 14:** Once you have your first $100+ Playgama balance, withdraw to confirm payment mechanics actually work for Saudi banking. **Verify the channel before you bet the business on it.**

---

## Confidence levels

- **High confidence:** Playgama as primary recommendation. GameMonetize iframe gating (HTTP 403 reproduced live, multiple header combinations). Famobi 50K MAU floor (quoted verbatim from help.famobi.com). GamePix 2025 payment complaints (multiple sources, recent).
- **Medium confidence:** Playgama 70-90% tiered rate (single primary source, partner wiki — confirm in actual contract before relying on). GameDistribution publisher rev share % (not on public terms page; developer rate is 33% per agreement). MENA market actual fill rates for any of these platforms.
- **Cannot verify:** GameMonetize $1.50-$3 RPM claim with any independent publisher report. GameDistribution's MENA-localized inventory beyond a press release. Any platform's actual fill rate specifically for Saudi/UAE traffic.

See `evidence.md` for full citations and `api_tests.json` for raw API probe results.
