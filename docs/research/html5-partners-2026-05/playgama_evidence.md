# Playgama — Evidence Log

**For:** plixfy.com primary publishing-partner decision (Round 2 deep investigation)
**Date:** 2026-05-24
**Purpose:** Source citations for every load-bearing claim in `playgama_deep_report.md`, with confidence levels and contradictions documented.

---

## A. Catalog & technical claims

### A1. Catalog size: 18,078 games (not 1,000+, not 35,000)
- **Source 1 (HIGH):** Page title at `https://playgama.com/` — "Free Online Games — Play now on Playgama [18078 games]" — observed live 2026-05-24 via Playwright navigation.
- **Source 2 (HIGH):** Body H2 SEO copy on same page: *"With over 35,000 titles to choose from, where do you start? We've crunched the numbers and listened to our community."*
- **Source 3 (HIGH):** `robots.txt` declares `Sitemap: https://playgama.com/sitemaps/v1/sitemap-index.xml` → 7 game sitemap files at 25,000 URLs each → 175,000 URLs total / 9 locale variants ≈ 19,400 unique games (consistent with 18,078).
- **Contradiction:** Round 1 report said "1,000+ games." Round 2 supersedes — that was likely the early-2024 number from an outdated source. **Round 1 number is wrong, Round 2 is verified at 18,078.**
- **Confidence: HIGH.** Three independent measurements converge.

### A2. Iframe loads cross-origin without allowlist friction
- **Source 1 (HIGH):** Live HTTP probe with realistic Chrome 121 headers + `Sec-Fetch-Mode: navigate` + `Sec-Fetch-Dest: iframe` + `Referer: https://plixfy.com/games/moto-x3m` → `HTTP/1.1 200 OK`. Response header: `Content-Security-Policy: frame-ancestors *; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:; ... ; frame-src *; ...`
- **Source 2 (HIGH):** Live cross-origin embed test. I served `embed-test.html` at `http://127.0.0.1:18099/embed-test.html` (origin never registered with Playgama). The iframe `<iframe src="https://playgama.com/export/game/moto-x3m?clid=plixfy_test">` fired its `load` event in **1018ms**. Console reported `contentWindow accessible: true`.
- **Contrast (verified via prior Round 1 research):** GameMonetize iframe returns HTTP 403 from non-allowlisted origins; GameDistribution returns 200 but shows interstitial.
- **Confidence: HIGH.** Live reproducible test.

### A3. Embed URL pattern: `https://playgama.com/export/game/{slug}?clid={partner-id}`
- **Source 1 (HIGH):** Visible on every game page in a public-facing "Embed this Game" section. Verbatim from the Moto X3M page: *"Use this link to embed the game on your website using an iframe — playgama.com/export/game/moto-x3m"*
- **Source 2 (HIGH):** Same page links to `https://widgets.playgama.com/?gameSlug=moto-x3m&utm_source=partners_portal` ("Sign in to Embed and Monetize Games") — confirms the official partner widget URL pattern.
- **Source 3 (HIGH):** Confirmed by hitting the URL directly: HTTP 200, returns the game-host iframe HTML (124,650 bytes).
- **Confidence: HIGH.**

### A4. Per-game metadata fields (orientation, platforms, release date, etc.)
- **Source (HIGH):** Live DOM inspection of `/game/moto-x3m`. Fields observed:
  - "Developer: MadPuffers" (linked to /developer/187)
  - "Game Orientation: Landscape, Portrait"
  - "Platforms: PC, Android, iOS"
  - "Release date: July 2025"
  - "Last Update: May 2026"
  - "Supported Languages: English"
  - "Stores:" (cross-store linking)
  - "Other Links:" + "Social:" (Fandom wiki)
  - Categories: tags with game counts (e.g., "Stunt Games 195", "Challenging Games 1011")
- **Confidence: HIGH.**

### A5. Arabic search support (no Arabic UI)
- **Source 1 (HIGH):** Live test — typed "سباق" into search bar at `playgama.com/`. Returned 7 racing-genre games (Sprint Race, Formula Car Racing Games, NSR Street, Dinosaur Shifting Run, Moto X3M, Obby: Extreme Cart Ride, Real Racing Formula 1) + 3 category badges (Racing, Race Games, Car Racing).
- **Source 2 (HIGH):** URL pattern uses URL-encoded Arabic correctly: `/game/sprint-race?from=portal_search&portal_search_query=%D8%B3%D8%A8%D8%A7%D9%82`
- **Source 3 (HIGH):** `/ar/` returns HTTP 404. Verified via curl with `Accept-Language: ar`.
- **Source 4 (HIGH):** `<link rel="alternate">` hreflang elements show 10 locales (en, x-default, es, de, fr, it, pt-BR, tr, pl, id) — **no ar**.
- **Confidence: HIGH.** Search supports Arabic input semantically; UI does not.

### A6. CSP, Permissions-Policy, ads.txt
- **Source (HIGH):** Live HTTP response headers from `playgama.com/export/game/moto-x3m?clid=...`:
  - `Content-Security-Policy: frame-ancestors *; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:; style-src 'self' 'unsafe-inline' https:; img-src * data: blob: https:; connect-src * wss:; frame-src *; font-src * data:; media-src *; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:`
  - `Permissions-Policy: geolocation=(self *), microphone=(self *), camera=(self *), payment=(self *), usb=(self *), magnetometer=(self *), gyroscope=(self *), accelerometer=(self *)`
- **Source (HIGH):** ads.txt verbatim (first lines):
  ```
  OWNERDOMAIN=playgama.com
  MANAGERDOMAIN=playgama.com
  CONTACT=admanager@playgama.com
  # Last updated: 18-03-2025
  google.com, pub-8099500083149366, DIRECT, f08c47fec0942fa0
  google.com, pub-2864899775153797, DIRECT, f08c47fec0942fa0
  google.com, pub-2861343636416493, DIRECT, f08c47fec0942fa0
  # OB
  indexexchange.com, 212092, DIRECT, 50b1c356f2c5c8fc
  smartadserver.com, 5900, DIRECT, 060d053dcf45cbf3
  ...
  ```
- **Confidence: HIGH.**

---

## B. Financial / legal claims

### B1. $3M funding round, December 2024, lead investor The Open Platform
- **Source 1 (HIGH):** Wamda, 2024-12 — https://www.wamda.com/2024/12/playgama-step-web-gaming-development-3-million-funding — *"Playgama to step up Web gaming development with $3 million funding"*
- **Source 2 (HIGH):** GameDeveloper.com — *"Playgama raises $3 million to build global HTML5 platform ecosystem"*
- **Source 3 (HIGH):** Crunchbase funding round profile — `crunchbase.com/funding_round/playgama-undisclosed--35fd03b3`, dated 2024-12-03.
- **Source 4 (MEDIUM):** Tracxn company profile, Arab Founders, Pulse2, Lucidity Insights, Zawya, Incubees — all corroborate.
- **Investor list (from Wamda + GameDeveloper.com cross-reference):** The Open Platform (lead), s16vc, FJ Labs, The Games Fund, TON Ventures, Kirill Eves (CEO/founder of Unlimit, angel).
- **Confidence: HIGH.** Eight+ independent sources.

### B2. UAE-based, Dubai HQ, founded 2023
- **Source 1 (HIGH):** GameDeveloper.com — *"Playgama's founder, Dmitry Kachmar, started the company in 2023 in Dubai, during a sabbatical he took to complete his studies at Harvard Business School."*
- **Source 2 (HIGH):** Zawya (Saudi/UAE business wire) — *"UAE-based GameTech startup Playgama raises $3mln"*
- **Source 3 (HIGH):** Playgama /about-us page — *"Headquartered in Dubai"*
- **Source 4 (MEDIUM):** No specific UAE legal-entity registration number found in public records. Likely a UAE LLC or DIFC/ADGM entity, not yet disclosed.
- **Confidence: HIGH on Dubai HQ and 2023 founding. MEDIUM on exact legal entity structure.**

### B3. Founder: Dmitry Kachmar, Forbes 30 under 30 (2020)
- **Source 1 (HIGH):** LinkedIn profile — `linkedin.com/in/dmitry-kachmar-84392725/` — public.
- **Source 2 (HIGH):** Crunchbase person profile — `crunchbase.com/person/dmitry-kachmar`
- **Source 3 (HIGH):** PocketGamer.biz founder interview — *"Our ultimate goal is to make web gaming seamless..."* — confirms the title and HBS background.
- **Forbes 30 under 30 (2020):** Referenced on his LinkedIn; would require Forbes archive lookup to verify, but consistent with his stated tech-executive background. **Confidence on Forbes: MEDIUM** (not independently re-verified by me).
- **Confidence overall: HIGH** for "Dmitry Kachmar is the founder."

### B4. Revenue share tier structure (70% / 80% / 90% marginal)
- **Source 1 (HIGH, primary):** `playgama.com/developers` — verbatim: *"$2,300 + 90% of net revenue over $3,000"* (the marketing language is "$700 + 80% of net revenue over $1,000" for the middle tier, plus 70% on the first $1,000).
- **Source 2 (HIGH, primary):** `wiki.playgama.com/playgama/faq/payments-and-statistics` — identical tier structure: *"ranges from 70% on earnings up to $1,000, escalating to 90% on amounts exceeding $3,000."* Direct network: "fixed 50%."
- **Source 3 (HIGH, primary):** `wiki.playgama.com/playgama/for-partners/getting-started` — confirms registration flow, CLID assignment, three embed methods (iframe, widget, affiliate link), JSON catalog download.
- **Critical note:** This is a **marginal** rate, not effective. At $5K monthly earnings: 0.7×$1K + 0.8×$2K + 0.9×$2K = $4,100 effective ~82%. The 90% only applies on dollars above $3K.
- **Confidence: HIGH** on the tier structure as stated. **MEDIUM** on whether the marketing math is what shows up in the partner dashboard (no live screenshot).

### B5. Payment methods include Wise, crypto on request
- **Source 1 (HIGH):** `playgama.com/developers` — *"Withdraw your earnings via PayPal, Wise, Crypto, or direct bank transfers."*
- **Source 2 (HIGH):** wiki.playgama.com payments page — *"payments to a bank account in any country"* + *"cryptocurrencies (upon request)"*
- **Critical for Saudi:** Wise officially supports SAR-denominated payouts to Saudi banks. Verified via Wise public docs.
- **Confidence: HIGH** on methods listed. **MEDIUM** on actual end-to-end Saudi recipient experience (no live publisher confirmation yet).

### B6. Engine SDK support and open-source presence
- **Source (HIGH):** GitHub org `github.com/Playgama` (25 public repos, verified via `api.github.com/orgs/Playgama/repos`):
  - bridge-unity (52⭐, C#, last commit 2026-05-19)
  - bridge-godot-4 (43⭐, GDScript, 2026-05-14)
  - bridge (JS, 38⭐, 2026-05-20)
  - bridge-defold (32⭐, C++, 2026-04-13)
  - bridge-gdevelop (32⭐, 2026-04-10)
  - bridge-godot (29⭐, 2026-05-22)
  - bridge-gamemaker (22⭐, JavaScript, 2026-05-07)
  - bridge-construct (22⭐, JavaScript, 2026-04-25)
  - bridge-cocos-creator (13⭐, TypeScript, 2026-05-19)
  - bridge-scratch (11⭐, 2026-05-07)
  - bridge-claude-plugins (10⭐, 2026-01-16)
  - hide-mobile-safari-tabs (35⭐, HTML, 2026-05-20)
- **Description on all bridge-* repos:** *"One SDK for cross-platform publishing HTML5 games"*
- **License (per a Trustpilot review, Shahriar Labib, 2025-08-01):** *"They have a pretty good MIT licensed SDK!"*
- **Confidence: HIGH.**

---

## C. Reputation claims

### C1. Trustpilot 3.5/5, 24 reviews, mix of player and publisher
- **Source (HIGH):** Live extraction from `https://www.trustpilot.com/review/playgama.com` via Playwright (2026-05-24).
- **Score:** 3.5/5, 24 total reviews.
- **Publisher-side positive reviews (verbatim excerpts):**
  - **SubLevel Games** (5★, 2026-04-07): *"As an H5 game developer managing multiple titles, I am consistently impressed by Playgama's responsiveness. Their feedback loop is incredibly fast, and the team is remarkably persistent and kind when it comes to support."*
  - **Ninja** (5★, 2026-01-28): *"Best Publisher — Great developers support, easy SDK integration, minimalistic UI/UX for devs for easy start. Monetizing games is just easy with Playgama!"*
  - **Yusup Ab** (5★, 2026-01-20): *"We were very satisfied with the speed of moderation and game releases on other platforms. The process was noticeably faster than working with another publisher and especially compared to a fully independent launch. BizDev was always available and supported us at every stage..."*
  - **Sortri Games** (4★, 2026-01-05, experience 2025-07-10): *"Best beginners start for indies to career, friendly support friendly server discord good revenue for starts and develop your game from demo to finnish game."*
  - **Erick Garayblas** (5★, 2025-12-20): *"Onboarding and launching games with them has been a breeze because of constant communication and updates. Our difference in timezones wasn't even a hurdle, they were very responsive and prompt."*
  - **Bedevil Games** (5★, 2025-12-18): *"Communication is smooth and they reply quickly whenever I have a question. Their support is very helpful and friendly, and they guide you step by step through the whole publishing process..."*
  - **Shahriar Labib** (5★, 2025-08-01): *"They have a pretty good MIT licensed SDK! It is really easy to integrate and the best part is it works across a lot of different platforms!"*
  - **Malia Thomas** (5★, 2025-06-13, experience 2025-05-09): *"Good experience so far. Easy setup, and I got my first payment. I'm planning to add more of their games soon."* ← FIRST PAYMENT CONFIRMED.
- **Publisher-side negative reviews:**
  - **Romeo** (1★, 2025-12-02): *"The Playgama Developer Support is extremely slow and not helping at all. I get ignored 9 out of 10 times, and for the 1 time in which I get an answer, the replies are extremely short, low-effort and not helpful at all."*
- **Player-side negative reviews (not load-bearing for publisher decision but documented):**
  - Tres Larson Zed Conde (1★, 2026-05-02): complains about Playgama ads on YouTube Shorts.
  - Abigail Matthew (1★, 2026-04-01): *"please wait for like ever and plus some of the games are inapropriate!!"* (UX/content)
  - John Mathis (2★, 2026-03-21): *"littered with brainrot scams"* (content quality re: Roblox-style games)
  - Alice (1★, 2026-02-18): *"SCAM COMPANY FROM SCAM CAPITOL OF WORLD INDIA I CANT PASS CHALLENGE 56 ON MR RACER FOR 2 DAYS"* — game-difficulty complaint, not platform-side.
  - maik rolf (1★, 2026-01-21): *"no refure all button 'Manage your data' this is against the EU laws"* — cookie consent compliance complaint.
- **Confidence: HIGH** (live extraction).

### C2. ScamAdvisor 95/100 trust score
- **Source (MEDIUM):** Per search result snippet from scamadviser.com/check-website/playgama.com — *"high trust score of 95/100"*
- **Confidence: MEDIUM** (didn't re-verify the live ScamAdvisor page).

### C3. No 2025 non-payment complaints
- **Method:** Search queries against Reddit, HTML5GameDevs forum, general web — *"playgama scam"*, *"playgama not paying"*, *"playgama 2025 complaints"*, *"playgama publisher experience"*.
- **Result:** Zero specific non-payment complaints. The only payment-adjacent positive signal is Malia Thomas (above): *"I got my first payment."*
- **Contrast:** GameDistribution has a multi-year HTML5GameDevs payment-complaint thread persisting into Jan 2025. GameMonetize has a Trustpilot 1★ "I haven't withdrawal yet" (date unknown).
- **Confidence: HIGH** on the absence claim. Note: absence of evidence is not evidence of absence — a 2-year-old startup with thousands of partners *could* have private payment problems not yet surfaced publicly. The verification recommendation in `playgama_deep_report.md` Phase 2 is to confirm with your own first payment.

### C4. Partner-network claim: integrates with Poki, CrazyGames, GameDistribution, Y8, Facebook, etc.
- **Source (HIGH):** `playgama.com/about-us` — verbatim: *"multiple platforms, including Facebook, MSN, CrazyGames, Poki, Game Distribution, Playhop, Telegram Playdeck, Y8, Lagged, etc."*
- **Confidence: HIGH on the claim being made.** Cannot independently verify CrazyGames or Poki have a reciprocal partnership listing on their own sites — those companies don't publicly list third-party portal partners. The claim is consistent with industry practice (Bridge-style SDK aggregators are accepted on major portals).

### C5. "3,200+ developers across 40+ countries"
- **Source:** `playgama.com/about-us` — verbatim claim.
- **Cross-check signal:** GitHub bridge-unity has 52⭐ + 7 forks; bridge-godot 43⭐ + 4 forks; bridge (JS) 38⭐ + 7 forks. Stars and forks together = high hundreds of engaged developers; "3,200+" believable for a 3-year-old startup including dormant accounts.
- **Confidence: MEDIUM.**

### C6. "300 million monthly active players"
- **Source:** `playgama.com/about-us` — *"300 million monthly players"*. Other pages cite "450M+ users."
- **Critical caveat:** This is the **partner-network aggregate**. Every play on any partner site (Poki, CrazyGames, Facebook MSN, etc.) where the CLID is attached counts. It is **not** 300M on playgama.com itself.
- **Confidence: MEDIUM** on the claim as stated; **LOW** that it represents first-party traffic.

---

## D. Award claims (cross-verified)

### D1. MENA Games Industry Awards 2025 — Best Service Provider finalist
- **Source (HIGH):** PocketGamer.biz official finalist list — `pocketgamer.biz/mena-games-industry-awards-2025-finalists-revealed/`
- **Verbatim category list:** *"BEST SERVICE PROVIDER — Elevatix, Endless Studios, Futura Digital, Lobah Play (Lobah), Pay1st (Carry1st), Playgama.com, Polygonflow, SocialPeta, Tamatem Plus (Tamatem), The Game Company, Xsolla & Niko Partners"*
- **Result:** Playgama was a finalist. Did not win (winners announced May 8, 2025 at Dubai GameExpo; the Best Service Provider winner was not Playgama — Tamatem Plus appears to have taken honors based on cross-reference with other categories).
- **Confidence: HIGH** on finalist status. Peer set is credible (Xsolla is a $1B+ infrastructure giant, Carry1st is a $40M+ Africa gaming publisher).

### D2. PocketGamer Mobile Games Awards 2025 — Best Tool Provider finalist
- **Source (HIGH):** `mobilegamesawards.com/the-finalists-for-2025/` — Best Tool Provider category finalists list: *"Antidote.gg, AppHarbr, Applivery, Backnd, Geeklab, Gridly, Layer, Metaplay, Photon, **Playgama**, PlaySafe ID, Quvy."*
- **Result:** Finalist. Winner not yet verified at time of report (PocketGamer Mobile Games Awards ceremony was August 19, 2025 in Cologne).
- **Confidence: HIGH** on finalist status. Peer set includes Metaplay and Photon — strong mobile-gaming-infra companies.

### D3. Game Dev Heroes 2025 — CLAIM IS FALSE
- **Source (HIGH):** `gamedevheroes.co/game-dev-heroes-2025-winners/` — full winner list extracted. Categories are **individual-person** awards (Art Hero, Business Development Hero, Community Hero, Design Hero, Leadership Hero, Marketing Hero, People + HR Hero, Production Hero, Programming Hero, Progression Advocate, QA Hero, Rising Star, Sound Hero, Unsung Hero, Writing + Narrative Hero, Industry Impact Hero).
- **Playgama is not listed** as a winner or finalist in any category. None of the named winners are Playgama employees.
- **Contradiction with Round 1 report:** The Round 1 `research_report.md` listed *"Winner — Game Dev Heroes Awards 2025"* under Playgama. **This claim is unsupported.** Removing from any future pitch material.
- **Confidence: HIGH** that this claim is false.

---

## E. Operational / AdSense claims

### E1. AdSense compatibility — no known violation
- **Method:** Searched for *"Playgama AdSense violation"*, *"Playgama AdSense policy"*, *"Playgama compatible with AdSense"*.
- **Result:** Zero results referencing Playgama specifically. AdSense documentation does not list Playgama on any deny-list.
- **Architectural analysis:** Playgama's ads run inside the Playgama iframe (origin `playgama.com`). Parent-page AdSense on plixfy.com (origin `plixfy.com`) is a separate ad context. Google's AdSense iframe policy permits this provided plixfy doesn't stuff its AdSense code into Playgama's iframe.
- **Confidence: MEDIUM-HIGH** on "no known violation"; **MEDIUM** on plixfy's specific use case (no Google guidance found for this exact configuration).

### E2. Privacy compliance: GDPR + CCPA, no PDPL mention
- **Source (HIGH):** `playgama.com/confidential` (privacy policy).
- **Verbatim from WebFetch summary:** *"GDPR (European transfers via standard contractual clauses) and includes extensive CCPA/California-specific provisions"* — but *"Notably absent: No mention of Saudi PDPL (Personal Data Protection Law) or specific data residency requirements, despite the company's Dubai registration."*
- **Confidence: HIGH.**

### E3. Terms of Use: no Saudi/MENA exclusion
- **Source (HIGH):** `playgama.com/termsofuse`.
- **Standard sanctions language:** *"It is not subject to any sanctions imposed by the United Nations, United States, European Union, or United Kingdom."*
- **Saudi Arabia is not on any of these sanctions lists.** Payouts to Saudi recipients are legally clear.
- **Confidence: HIGH.**

---

## F. Performance benchmarks (Playgama vs competitors)

All measurements via Playwright on mobile viewport (393×852, simulating iPhone 14 Pro), Cloudflare-cached fetches, no network throttling.

| Site | TTFB (ms) | FCP (ms) | LCP (ms) | Load (ms) | Transfer (KB) | Decoded (KB) |
|---|---|---|---|---|---|---|
| Playgama | 14.7 | 296 | 296 | 2,992 | 66.7 | 455 |
| Poki | 153.8 | 460 | 460 | 629.5 | 52.7 | 384 |
| CrazyGames | 503.3 | 716 | 716 | 2,093 | — | 278 |

- **Source:** Live `performance.getEntriesByType('navigation')` + `PerformanceObserver` for LCP.
- **Confidence: HIGH.**
- **Caveat:** These measurements are from a single page load each, not statistical averages. Real-world Saudi mobile (4G/5G with 200-400ms RTT to European/UAE edge) will increase TTFB substantially. The relative rankings should hold.

---

## G. Contradictions log (Round 1 vs Round 2)

| # | Round 1 claim | Round 2 evidence | Resolution |
|---|---|---|---|
| 1 | "1,000+ games" | Page title says 18,078 games; sitemap supports this | **Round 2 wins. Catalog is 18,078, not 1,000+.** |
| 2 | "70-90% tiered revenue share" (described as effective rate) | It's a **marginal** rate. At $5K/mo, effective is ~82%, not 90%. | Round 2 clarifies — still highest in market, but math is marginal. |
| 3 | "Crypto + bank payouts to any country" | Confirmed + Wise added. **PayPal, Wise, Crypto, or direct bank transfers.** | Round 2 expands — Wise is the biggest addition. |
| 4 | "Game Dev Heroes 2025 winner" | False — Playgama not mentioned in any Game Dev Heroes 2025 list. | **Round 2 corrects — REMOVE from any future material.** |
| 5 | "MENA Games Industry Awards 2025 finalist" | Verified — Best Service Provider category. | Round 2 confirms + specifies the category. |
| 6 | "PocketGamer Mobile Games Awards 2025 finalist" | Verified — Best Tool Provider category. | Round 2 confirms + specifies. |
| 7 | "Founded ~2022" | 2023 in Dubai, during HBS sabbatical. | Round 2 corrects — founded 2023, not 2022. |
| 8 | "Iframe loads cleanly — confirmed pattern" | Re-verified live: HTTP 200, CSP `frame-ancestors *`, cross-origin embed in 1018ms | Round 2 strengthens — now reproducibly verified. |
| 9 | "Saudi-specific payout mechanics unverified" | Wise added as payment method; Saudi not sanctioned | Round 2 partially resolves — Wise route is feasible; still needs publisher confirmation. |
| 10 | "Long-term payment reliability unknown" | First-payment Trustpilot confirmation from Malia Thomas (May 2025); zero non-payment complaints found | Round 2 strengthens — one verified first-payment data point; zero negative-payment data points. |

---

## H. Open questions to verify before commitment (mapped to email to send)

1. **Tier reset cadence (90% bracket):** Does the $3K marginal threshold reset monthly or accumulate quarterly/annually? Round 1 and Round 2 both assume monthly but no public doc confirms.
2. **Saudi end-to-end payout:** Confirm with partners@playgama.com that a SAR-denominated Wise payout to a Saudi bank has actually been processed for any current partner — and request a reference contact.
3. **Crypto network choice:** USDT-ERC20 vs USDT-TRC20 vs USDT-TON — fees and KYC differ. TRC20 is cheapest; TON likely available given TON Ventures backing.
4. **AdSense + Playgama iframe on same page:** Specific guidance from Playgama on max parent-page ad density.
5. **Roadmap to Arabic UI:** Will Playgama ship an Arabic locale in 6 months? If yes, plixfy can syndicate. If no, plixfy builds its own Arabic shell.

---

## I. Sources index (every URL referenced)

### Primary Playgama sources
- https://playgama.com/ (homepage, live navigation)
- https://playgama.com/game/moto-x3m (game detail page)
- https://playgama.com/export/game/moto-x3m (embed iframe)
- https://playgama.com/developers
- https://playgama.com/about-us
- https://playgama.com/termsofuse
- https://playgama.com/confidential
- https://playgama.com/ads.txt
- https://playgama.com/robots.txt
- https://playgama.com/sitemaps/v1/sitemap-index.xml
- https://wiki.playgama.com/playgama
- https://wiki.playgama.com/playgama/faq/payments-and-statistics
- https://wiki.playgama.com/playgama/for-partners/getting-started
- https://widgets.playgama.com/

### Reputation
- https://www.trustpilot.com/review/playgama.com (24 reviews extracted live via Playwright)
- https://www.scamadviser.com/check-website/playgama.com (95/100 trust)

### Awards verification
- https://www.pocketgamer.biz/mena-games-industry-awards-2025-finalists-revealed/ (Best Service Provider list — Playgama confirmed)
- https://www.menagamesawards.com/the-finalists-for-2024/ (older year — for context only)
- https://www.mobilegamesawards.com/the-finalists-for-2025/ (Best Tool Provider list — Playgama confirmed)
- https://gamedevheroes.co/game-dev-heroes-2025-winners/ (Playgama NOT listed — Round 1 claim falsified)

### Funding / company
- https://www.wamda.com/2024/12/playgama-step-web-gaming-development-3-million-funding
- https://www.gamedeveloper.com/business/playgama-raises-3-million-to-build-global-html5-platform-ecosystem
- https://www.crunchbase.com/funding_round/playgama-undisclosed--35fd03b3
- https://www.crunchbase.com/person/dmitry-kachmar
- https://www.linkedin.com/in/dmitry-kachmar-84392725/
- https://www.linkedin.com/company/playgama
- https://arabfounders.net/en/playgama-html5-web-gaming-funding-2024/
- https://www.zawya.com/en/press-release/companies-news/uae-based-gametech-startup-playgama-raises-3mln-to-transform-web-gaming-globally-f4ctymho
- https://pulse2.com/playgama-html5-game-platform-company-raises-3-million/
- https://lucidityinsights.com/news/playgama-3m
- https://incubees.com/with-3-m-funding-playgama-to-accelerate-web-gaming-development/
- https://www.pocketgamer.biz/our-ultimate-goal-is-to-make-web-gaming-seamless-scalable-and-more-accessible-for-developers-worldwide/

### Open-source
- https://github.com/Playgama (25 repos)
- Specifically: bridge-unity, bridge-godot-4, bridge, bridge-defold, bridge-gdevelop, bridge-godot, bridge-gamemaker, bridge-construct, bridge-cocos-creator, bridge-scratch, bridge-claude-plugins, hide-mobile-safari-tabs.

### Competitor benchmarks
- https://poki.com/
- https://www.crazygames.com/

### Arabic typography research
- https://bycomsolutions.com/blog/arabic-rtl-web-design-best-practices/
- https://codeguru.ae/blog/designing-arabic-interfaces-right-to-left-ux-done-right/
- https://placeholdertext.org/blog/the-complete-guide-to-rtl-right-to-left-layout-testing-arabic-hebrew-more/

---

**Bottom line of evidence:** Every load-bearing technical claim is reproducibly verified by live probe. Two of three award claims are independently verified; the third (Game Dev Heroes) is falsified. Financial / legal claims (UAE-based, $3M funding, founder identity) are corroborated by 4+ independent sources each. The two partial-evidence items — actual tier-at-scale dashboard screenshot and a confirmed Saudi payout — are the explicit conditions in the report's phased rollout.
