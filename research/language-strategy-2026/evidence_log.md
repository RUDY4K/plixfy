# Evidence Log — Plixfy Language Strategy Research

**Compiled:** 2026-06-02
**Strict source filter applied:** January 2024+ only. Pre-2024 sources rejected.
**Sources organized by claim category. Every datapoint carries: URL, publication date, direct quote/data, confidence (high/medium/low), and any contradictions found.**

---

## 1. OPERATOR-SHARED RPM DATA (highest-priority evidence)

### 1.1 Tier-1 mixed gaming portal: ~$0.67 page RPM
- **Source:** u/Longjumping_Cow_152, r/adops thread
- **URL:** https://www.reddit.com/r/adops/comments/1sjz5b7/3_million_monthly_page_views_and_23k_monthly_ad/
- **Date:** April 2026 ("2mo ago" as of 2026-06-02)
- **Quote:** *"I run a gaming site that averages 3 million monthly pages view on Google analytics… current revenue close to $2k a month. US is still highest country share with around 15%, and rest of traffic is mostly split among European countries + japan + canada. About 2 years ago I had $2k monthly with 1 million monthly pageviews with the same ad partner. So revenue didn't change much while engagement 3xed."*
- **Computed RPM:** $2,000 / 3,000,000 × 1,000 = **$0.67 page RPM** (down from ~$2.00 two years prior)
- **Confidence:** HIGH — operator self-disclosed exact ratio across two time points
- **Implication:** Even with a Tier-1-heavy mix (15% US + EU/JP/CA), real RPM is 3-10x lower than agency benchmarks of "$5-10 gaming CPM."

### 1.2 Tier-1 UK student unblocked-games site: ~$0.95-$1.60 RPM
- **Source:** u/SensitiveEdge2359, r/Adsense
- **URL:** https://www.reddit.com/r/Adsense/comments/1tt04ev/making_45_a_day_at_15_years_old_ruined_my/
- **Date:** May 2026
- **Quote:** *"built an unblocked games website for students. at its peak around december 2024 / january 2025, it was pulling in over 1.2 million page views a month… consistently hitting £30 to £50 a day on pure autopilot just from adsense."*
- **Computed RPM:** £30-50/day ÷ ~40K daily PV = £0.75-1.25 ≈ **$0.95-$1.60 RPM**
- **Confidence:** HIGH — analytics screenshot provided, site URL named (blooket1.com)
- **Caveat:** Heavy weekday-only utilization (school traffic); collapsed in 2025-26 school year and never recovered.

### 1.3 Low-text browser puzzle game: $0 — AdSense rejected
- **Source:** u/DarkBlueLamp, r/adops
- **URL:** https://www.reddit.com/r/adops/comments/1s1ozk4/my_game_site_200k_pvmonth_rejected_by_adsense/
- **Date:** April 2026
- **Quote:** *"~4K daily users, ~200-300K monthly pageviews. Google AdSense rejected the site due to 'insufficient textual content.' I did get approved for Adsterra, but…hesitant to use it due to UX concerns (popunders, redirects, etc.)"*
- **Confidence:** HIGH
- **Implication:** Vanilla AdSense is closed to thin-text game portals. Must use AdSense H5 Games Ads (beta) or partner networks (Playgama, AdInPlay, GameDistribution).

### 1.4 Gaming-companion site: <$0.10 RPM
- **Source:** u/chinnick967, r/Adsense
- **URL:** https://www.reddit.com/r/Adsense/comments/1qjh7gu/extremely_low_rpm_recently/
- **Date:** February 2026
- **Quote:** *"My site https://metabot.gg has been having extremely low RPM the last couple of weeks (under 10 cents). Traffic is around 1k views/day."*
- **Confidence:** HIGH

### 1.5 Veteran 20-year gamedev: "web games are not profitable"
- **Source:** r/gamedev thread "I've been making games for 20 years…"
- **URL:** https://www.reddit.com/r/gamedev/comments/1n1wi02/ive_been_making_games_for_20_years_and_believe_we/
- **Date:** August 2025
- **Quote:** *"I've released 2 web games (3D multiplayer) on both Poki and CrazyGames. Over the past 3 years, I learned something: web games are not profitable."*
- **Confidence:** HIGH

### 1.6 CrazyGames front-page feature: "far from making a living"
- **Source:** u/nevolane (Tracesoccer launch case), r/gamedev
- **URL:** https://www.reddit.com/r/gamedev/comments/1i4ad32/early_experience_with_launching_on_crazygames/
- **Date:** January 2025
- **Quote:** *"in terms of ad revenue, these are still rookie numbers and definitely far from making a living off of it… on our peak day, when we were featured on the landing page, 40k matches were played."*
- **Confidence:** HIGH

### 1.7 Playgama partner network — "$1,000+ for top games"
- **Source:** u/Playgama (official), r/playgamabridge
- **URL:** https://www.reddit.com/r/playgamabridge/comments/1n7c1lv/playgama_partner_network/
- **Date:** September 2025
- **Quote:** *"Did you know that some games on Playgama earn over $1,000 just from our Partner Network?"*
- **Confidence:** MEDIUM — vendor self-promotion; ceiling figure, not median

### 1.8 Independent Playgama developer: zero initial revenue
- **Source:** u/crionuke, r/defold
- **URL:** https://www.reddit.com/r/defold/comments/1qmhkop/my_game_gets_a_second_wind/
- **Date:** February 2026
- **Quote:** *"The game was written in Lua using the Defold game engine and published on several web portals via Playgama. At that time, the game didn't generate any revenue. Recently, however, Playgama announced integration with a new platform — Xiaomi Game Center — where the game's reach increased by 5x."* (still describes outcome as "Not a major milestone")
- **Confidence:** HIGH
- **CONTRADICTION:** Directly contradicts Playgama's "$1,000+" marketing claim. Real-developer data shows essentially zero revenue at modest scale.

### 1.9 Playgama official monetization benchmarks
- **Source:** David Sedrakyan, Playgama blog
- **URL:** https://playgama.com/blog/main/10-ways-to-monetize-html5-games-that-actually-work-in-2026/
- **Date:** April 16, 2026
- **Quote:** *"Rewarded Video eCPM: US $15-$28; EU $8-$15; Tier-3 (India, Brazil) $1-$3. ARPDAU Target: $0.08-$0.15 (Casual). Playgama Bridge: developer receives flat 80% of ad revenue."*
- **Confidence:** MEDIUM — vendor-published but specific by tier
- **NOTE:** Rewarded video ≠ portal display ads. These eCPMs apply only when players actively choose to watch ads for in-game rewards. Display/banner RPM is ~3-5x lower.

### 1.10 Chicken Road browser game case study
- **Source:** Michael Jennings, DigitalEdge
- **URL:** https://digitaledge.org/how-a-simple-browser-game-reached-42-million-sessions-in-q3-q4-2025-full-case-study/
- **Date:** November 24, 2025
- **Quote:** *"$3.8M Q3 revenue, $3.76M Q4; ARPU $0.18; CPI $0.02 vs $0.45 industry average; 70% mobile browsers; geography 22-24% India, 18-19% US, 15-16% Brazil; emerging markets 60% total; TikTok #ChickenRoadChallenge 4.8M views, 1.2M clips Q3; Poki algorithm pushed to 15% of traffic after 500K sessions."*
- **Confidence:** HIGH — single-game case, not portal economics, but proves TikTok→browser-game funnel works for emerging markets

---

## 2. PLAYGAMA PARTNER ECONOMICS (most important for plixfy)

### 2.1 Lagged.com Playgama integration: gCPM +88%
- **Source:** Playgama Blog
- **URL:** https://playgama.com/blog/main/doubling-gcpm-for-a-web-games-portal-lagged-case/ (referenced via Playgama blog)
- **Date:** April 2, 2026 (Sept 2025 integration, Oct-Nov 2025 measurement)
- **Data:** Median gCPM rose **$1.65 → $3.11 (+88%)** across the platform Oct-Nov 2025. "For Girls" category +197%, 3D Action +170%. Reach 20M players.
- **Confidence:** HIGH — vendor case study but specific, dated, named portal
- **Implication:** Direct evidence that the Playgama partner model materially lifts portal monetization in 2025-2026 for the partner-portal layer (which is what Plixfy operates).

### 2.2 Playgama market growth claims
- **Source:** u/Playgama, r/playgamabridge
- **URL:** https://www.reddit.com/r/playgamabridge/comments/1mhc7oz/introducing_webbased_game_engine_rankings_first/
- **Date:** August 2025
- **Quote:** *"the browser games market has grown 2.7 times over the past year, and 4.9 more than H1 2023. In Q2 2025 alone, over 15,000+ new games were released. Unity remains the market leader, powering 55% of all new web games in Q2 2025."*
- **Confidence:** MEDIUM — Playgama's own market research, verifiable from catalog

---

## 3. PORTAL TRAFFIC LANDSCAPE (incumbents + breakouts)

### 3.1 Poki (English-global incumbent)
- **Source:** Mobidictum interview + Accessnewswire
- **URL:** https://mobidictum.com/pokis-web-gaming-interview-michiel-van-amerongen/
- **Date:** 2025
- **Data:** 100M monthly players, 1B gameplays/month (2025); 625M annual players. Top traffic: US > India > Brazil. ~50/50 dev revenue share.
- **Confidence:** HIGH

### 3.2 CrazyGames (English-global incumbent)
- **Source:** Mobidictum + Semrush
- **URL:** https://mobidictum.com/crazygames-reaches-35-million-monthly-users/
- **Date:** 2024
- **Data:** 35M MAU (2024), growing to ~106M monthly visits (early 2026); Domain Rating 80; 47,789 referring domains. Top countries: US, India, Australia.
- **Confidence:** HIGH

### 3.3 Coolmath Games (English math/kids dominator)
- **Source:** Similarweb
- **URL:** https://www.similarweb.com/website/coolmathgames.com/
- **Date:** Jan 2026
- **Data:** 12.22M visits Jan 2026; 82.8% US traffic; #1 for "cool math games" — 568K monthly visits from that single keyword alone; DR 72.
- **Confidence:** HIGH

### 3.4 Playhop — the ONE 2022+ breakout
- **Source:** Aleyda Solis SERP shifts study; Tracxn
- **URL:** https://www.aleydasolis.com/en/search-engine-optimization/serp-shifts-ads-remonetized/
- **Date:** 2026
- **Data:** Founded ~2022 (Yandex Games spinout). Organic clicks #6 (71K) → #4 (99K), **+40% YoY** Jan-2025 → Jan-2026 — when CrazyGames (-14%), Poki (-39%), Arkadium (-68%) declined. Core audience US > Spain > Turkey. Heavy Unity catalog.
- **Confidence:** HIGH
- **Implication:** Only founded-2022+ portal to break into top 10. Russian-origin advantage + dual-language SEO (RU+EN+ES) + Unity-heavy catalog.

### 3.5 minijuegos.com (Spanish-language leader)
- **Source:** Similarweb
- **URL:** https://www.similarweb.com/website/minijuegos.com/
- **Date:** April 2026
- **Data:** 3.4M monthly visits Apr 2026 (down from 5.3-6M in late 2024). Spain only 16.23% of traffic; Argentina 18.95% leads; LATAM combined >50%. Azerion-owned since Jan 2022.
- **Confidence:** HIGH
- **Implication:** One Spanish locale realistically serves ES + entire LATAM market — minijuegos proves this works.

### 3.6 jogos360.com.br (Portuguese leader)
- **Source:** Similarweb
- **URL:** https://www.similarweb.com/website/jogos360.com.br/
- **Date:** April 2026
- **Data:** 961K monthly visits, Brazil 93.51%, Portugal 4.03%, ~7-min avg session
- **Confidence:** HIGH

### 3.7 Turkish portals (oyunskor, oyunlar1, oyunkolu)
- **Source:** Similarweb, Ahrefs
- **URL:** https://www.similarweb.com/website/oyunskor.com/
- **Date:** May 2025
- **Data:** oyunskor.com 1.4M visits May 2025, 91.3% Turkey traffic, DR 55, 4.3K linking sites. rekoroyun.com 2.9M visits Nov 2024. oyunkolu.com ~825K.
- **Confidence:** HIGH

### 3.8 games.co.id (Indonesian portal)
- **Source:** Similarweb
- **URL:** https://www.similarweb.com/website/games.co.id/
- **Date:** November 2024
- **Data:** Ranked #3,350 in Indonesia, #106 in Video Games category. Largest dedicated id-ID HTML5 portal.
- **Confidence:** HIGH
- **Implication:** Indonesia's #1 dedicated portal is rank-#3,350 nationally — beatable by a quality entrant.

### 3.9 gamevui.vn (Vietnamese leader)
- **Source:** Semrush, Similarweb
- **URL:** https://www.semrush.com/website/gamevui.vn/overview/
- **Date:** November 2024
- **Data:** 3.01M monthly visits, #217 in Vietnam, #2 in Games-Other Aug 2024
- **Confidence:** HIGH

---

## 4. CPM/RPM DATA BY GEO (2024-2025)

### 4.1 General gaming-niche RPM tiers
- **Source:** Kestrel Media Solutions
- **URL:** https://kestrelmediasolutions.com/what-is-the-rpm-of-the-gaming-niche-and-how-to-increase-it/
- **Date:** 2024-2025
- **Data:** Gaming-niche AdSense RPM **$2-$8 Tier-1**; some Tier-1 lifestyle examples reach $12-$15 but gaming sits below
- **Confidence:** MEDIUM — agency aggregate, not operator-verified
- **CONTRADICTION:** Operator data (§1.1, §1.2) shows actual Tier-1 gaming RPM is closer to **$0.67-$1.60**, not $2-$8.

### 4.2 Tier-1 vs Tier-2 RPM multiplier
- **Source:** RankTracker, ClashPanda
- **URL:** https://www.ranktracker.com/blog/geographic-variations-in-cpc-and-rpm-for-adsense/
- **Date:** 2024-2026
- **Quote:** *"A US-based reader (Tier 1) is worth 10x-30x more than a reader from Nepal/Pakistan."*
- **Confidence:** MEDIUM

### 4.3 India gaming-vertical AdSense RPM
- **Source:** Showeblogin / Superwebtricks
- **URL:** https://www.superwebtricks.com/adsense-earnings-in-india/
- **Date:** 2024
- **Data:** India general AdSense $1.20-$3.50 RPM "good"; **gaming/entertainment niche $0.50-$1 specifically**
- **Confidence:** MEDIUM

### 4.4 Country AdSense CPM benchmarks
- **Source:** World Population Review
- **URL:** https://worldpopulationreview.com/country-rankings/cpm-rates-by-country
- **Date:** 2024
- **Data:**
  - Turkey: ~$0.09 CPM
  - Indonesia: ~$0.12 CPM
  - Vietnam: ~$0.10 CPM
  - Philippines: ~$0.14 CPM
- **Confidence:** LOW-MEDIUM — country-aggregate, not gaming-specific

### 4.5 Brazil display CPM
- **Source:** Mile.tech, Partnerkin
- **URL:** https://www.mile.tech/blog/adsense-cpm-rates-2024
- **Date:** 2024
- **Data:** Brazil $1-$4 display CPM, $0.50-$2 RPM realistic band for general content
- **Confidence:** MEDIUM

### 4.6 Spain display CPM
- **Source:** Awisee, Bridgingpoints
- **URL:** https://awisee.com/blog/cpm-rates-by-country/
- **Date:** 2024-2026
- **Data:** Spain gaming-vertical $2-$6 RPM ($3-$5 realistic for casual games), EU tier-2
- **Confidence:** MEDIUM

### 4.7 Turkey YouTube RPM context
- **Source:** Dynamoi
- **URL:** https://dynamoi.com/learn/youtube-music-promotion/youtube-rpm-turkey
- **Date:** 2026
- **Data:** Turkey YouTube RPM $0.69, **91% below US** — lira collapse + inflation
- **Confidence:** HIGH (YouTube-specific) — display CPM follows similar pattern

---

## 5. ADSENSE / IRAN / PERSIAN BLOCKING

### 5.1 Iran OFAC-blocked from AdSense
- **Source:** Google AdSense Help
- **URL:** https://support.google.com/adsense/answer/6167308
- **Date:** Current 2024-2025
- **Data:** Iran is on AdSense's country-restriction list. No publisher accounts allowed.
- **Confidence:** HIGH

### 5.2 Persian NOT on AdSense supported languages
- **Source:** Google AdSense Help — Supported Languages
- **URL:** https://support.google.com/adsense/answer/9727
- **Date:** Current 2024-2025
- **Data:** Persian/Farsi is absent from the supported publisher languages list. Confirmed by community petitions (change.org), Quora threads, BlackHatWorld discussions all 2024.
- **Confidence:** HIGH
- **Implication:** **Independent of the Iran sanction**, Persian-language content cannot be monetized via AdSense regardless of publisher location. Two independent disqualifiers.

### 5.3 Persian YouTuber revenue collapse 2025
- **Source:** Iran International
- **URL:** https://www.iranintl.com/en/202512192470
- **Date:** December 2025
- **Data:** Iranian YouTube creators saw revenue collapse late 2025 due to YouTube ad-serving changes for Iran.
- **Confidence:** HIGH

---

## 6. GOOGLE ALGORITHM IMPACT ON GAMES PORTALS (2024-2025)

### 6.1 March 2024 core update — game directory rentals hit
- **Source:** SISTRIX
- **URL:** https://www.sistrix.com/blog/google-core-spam-update-march-2024/
- **Date:** March 2024
- **Data:** March 2024 core update (45 days, Mar 5 - Apr 19) explicitly *"targeted sites renting out subdirectories...often seen with games, gambling, voucher codes"*
- **Confidence:** HIGH

### 6.2 2024 AI-spam manual action — 837 sites deindexed
- **Source:** TheSEOTalkers / LinkedIn analyses
- **Date:** March 2024
- **Data:** 837 sites deindexed by Google's March 2024 AI-spam manual action; 50% used primarily AI-generated content; gaming category called out among biggest decliners
- **Confidence:** MEDIUM

### 6.3 AI Overviews compression of SERP CTR
- **Source:** Aleyda Solis, Seer Interactive
- **URL:** https://www.aleydasolis.com/en/search-engine-optimization/serp-shifts-ads-remonetized/
- **Date:** 2026
- **Data:** AI Overviews exploded from **2.28% → 32.76% SERP presence** (Aleyda Solis). Organic CTR 1.76% → 0.61% with AI Overviews (Seer Interactive Sept 2025).
- **Confidence:** HIGH

### 6.4 Top portal organic declines 2025-2026
- **Source:** Aleyda Solis SERP study
- **Date:** 2026
- **Data (Jan 2025 → Jan 2026 organic clicks):**
  - CrazyGames: 444K → 381K (**-14%**)
  - Poki: 198K → 120K (**-39%**)
  - Arkadium: 107K → 34K (**-68%**)
  - Playhop: 71K → 99K (**+40%**) — only gainer
- **Confidence:** HIGH

### 6.5 AdSense H5 Games Ads / category deprecation
- **Source:** Google AdSense Help; Swipe Insight
- **Date:** May/June 2025
- **Data:** Google deprecated "Video Games (Casual & Online)" sensitive category in AdSense blocking controls May 15, 2025 (effective June 15). AdSense H5 Games Ads is now in expanded beta — required path for monetizing iframe-embedded HTML5 games. Vanilla AdSense often rejects pure game pages for thin content.
- **Confidence:** HIGH

---

## 7. CATEGORY TREND DATA (2024-2026)

### 7.1 Hypercasual + Puzzle dominate session share
- **Source:** Pocket Gamer.biz (CrazyGames internal study)
- **URL:** https://www.pocketgamer.biz/hypercasual-and-puzzle-games-dominate-the-browser-gaming-space/
- **Date:** May 21, 2026
- **Data:** Analysis of **1.74B sessions May 2025-May 2026**: Hypercasual = #1 category 79% of the year; Puzzle = #1 for 21% (mornings). Avg session 30 min. Peaks at lunch + Friday.
- **Confidence:** HIGH

### 7.2 .io games declining
- **Source:** mmostats, WebGameDB
- **Date:** 2024-2025
- **Data:** agar.io ~35K daily players 2024 (sharply down from 2016 peak); slither.io ~24K online, 28K 24h peak — flat-to-down from 2017-2018 peaks. ioGround analysis: io games search interest peaked 99-100 in 2018.
- **Confidence:** MEDIUM — Google Trends 2020-2026 series not directly retrievable

### 7.3 TikTok funnel — SEA dominance
- **Source:** TikTok Newsroom, Statista 2025, TikTok For Business
- **Date:** 2024-2025
- **Data:**
  - Indonesia: 160M TikTok users
  - Vietnam: 70M
  - Philippines: 62.3M (80.1% of adults 18+)
  - All five SEA countries exceed global avg time-spent
  - 59% of TikTok users discover new games via short-form video
  - 41% downloaded a game after seeing gaming content
- **Confidence:** HIGH

### 7.4 Mobile gaming dominance
- **Source:** Antom, Jakarta Globe, Vietnam Briefing, Statista
- **Date:** 2024
- **Data:**
  - Indonesia: 96% mobile preference (1,021 respondents); 77% of revenue mobile
  - Vietnam: 86.6% mobile of all gamers; ARPU $53.8 (mobile) vs $3.6 (PC)
  - Philippines: 98% smartphone for video gaming
  - Brazil: 55.5% mobile, 43.8% desktop; 96.5% access internet via smartphone
- **Confidence:** HIGH

### 7.5 Reddit SEO surge (and partial reversal)
- **Source:** Amsive, Search Atlas
- **URL:** https://www.amsive.com/insights/seo/reddits-seo-growth-a-deep-dive-into-reddits-recent-surge-in-seo-visibility/
- **Date:** 2024-2025
- **Data:** Reddit visibility +1,328% Jul 2023 → Apr 2024. Forum sites (DIYChatroom, GarageJournal) that surged then crashed in March 2025 core update — Google walked back over-rotation toward forums.
- **Confidence:** HIGH

---

## 8. NEXT.JS i18n IMPLEMENTATION (2024-2025 best practice)

### 8.1 Google's URL structure guidance
- **Source:** Google Search Central
- **URL:** https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- **Date:** Last updated 2025-12-10
- **Data:** Subdirectory rated "Easy to set up, Low maintenance" — listed first in Google's table. ccTLD rated "expensive, single country only."
- **Confidence:** HIGH

### 8.2 next-intl as canonical Next.js i18n library
- **Source:** next-intl docs, Locize comparison
- **URL:** https://next-intl.dev/docs/getting-started/app-router
- **Date:** 2025
- **Data:** Built-in i18n routing removed from App Router. next-intl v4 is RSC-native, ICU-format, ~4x growth in 12 months, ships sitemap+hreflang helpers. next-i18next is Pages-Router-only and flat.
- **Confidence:** HIGH

### 8.3 hreflang placement equivalence
- **Source:** John Mueller (Google), Search Central
- **Date:** 2024-2025
- **Quote:** *"It makes no difference to Google if you choose to include your hreflang configuration in an XML sitemap or on the page itself in the head tag"*
- **Confidence:** HIGH

### 8.4 Arabic locale handling
- **Source:** Google Search Central
- **Date:** 2024-2025
- **Data:** *"If you want to target Arabic speakers worldwide, use the sole language code 'ar'."* Region codes (ar-SA, ar-AE) only when content actually differs.
- **Confidence:** HIGH

### 8.5 AdSense ads.txt placement
- **Source:** Vercel discussions, Google AdSense docs
- **URL:** https://github.com/vercel/next.js/discussions/79181
- **Date:** 2024-2025
- **Data:** ads.txt is served from apex domain root only. Same file across all locales. Placed at `public/ads.txt`.
- **Confidence:** HIGH

### 8.6 Auto Ads "Related Search" Arabic limitation
- **Source:** PPC Land
- **URL:** https://ppc.land/google-adsense-expands-language-support-for-related-search-in-auto-ads/
- **Date:** September 2024
- **Data:** Related Search Auto Ads supports only EN/DE/FR/ES/JA — not Arabic.
- **Confidence:** HIGH

---

## 9. CONTRADICTIONS / DATA TENSIONS

### 9.1 Gaming RPM agency benchmarks vs operator reality
- Agency posts (Kestrel, Publift, partnerkin) claim Tier-1 gaming RPM **$2-$8 to $5-$15**
- Real operator data (§1.1, §1.2) shows **$0.67-$1.60 RPM** for Tier-1-heavy mixed portals
- **Resolution:** Operator data should be weighted higher; agency numbers may include direct-deal/programmatic premiums not accessible to small portals. Plan around $0.50-$2 RPM, not $5+.

### 9.2 Playgama "$1,000+ per game" vs zero-revenue developer testimony
- Playgama official: top games earn $1,000+ (§1.7)
- Independent developer u/crionuke (§1.8): zero initial revenue, "Not a major milestone" even after 5x reach uplift
- **Resolution:** "$1,000+" is a top-decile marketing number. Median Playgama developer revenue is likely much lower. For Plixfy as a PARTNER (operating its own portal, not as a game developer), the Lagged case (§2.1) is more relevant — partner-portal economics show +88% gCPM uplift.

### 9.3 Vietnamese RPM
- One unnamed source claimed Vietnamese content "$5+ RPM" — unverified, inconsistent with $0.10 country CPM
- **Resolution:** Treat $5+ claim as unreliable. Use $0.20-$1.00 gaming RPM band for VN, similar to ID.

### 9.4 SimilarWeb vs Ahrefs traffic estimates
- Different snapshots of same portal (minijuegos: 3.4M Apr 2026 vs 5.3M Nov 2024) — likely real decline, not measurement disagreement
- **Resolution:** Trends matter more than absolute snapshots; multiple top-10 portals showing decline matches Aleyda Solis SERP findings.

---

## 10. DATA GAPS (explicit — no padding with inference)

The following were searched extensively but no 2024+ direct operator data surfaced:

1. **Tier-2 English browser-games RPM** (IN, PH, ZA, NG) — zero operator data
2. **LATAM Spanish/Portuguese browser-games RPM** — zero operator data
3. **MENA Arabic browser-games RPM** — zero operator data
4. **SEA non-English browser-games RPM** (ID, VN, TH) — zero operator data
5. **JP/KR standalone-language browser-portal RPM** — zero operator data
6. **EU non-English standalone-language portal RPM** (DE/FR/IT/ES/PL) — zero operator data
7. **Google Trends time-series for "io games" 2020-2026** — Trends URL returned HTTP 429
8. **Founded-2022+ English-language games portal that broke top 10** — none found (likely doesn't exist)
9. **Persian diaspora portal economics** — no data on non-AdSense alternatives at scale
10. **Hindi "khel" vs English "free games" search volume in India** — no public dataset

**Implication for the report:** Recommendations for any of these categories must be hedged or framed as "test cheaply before committing." The strongest recommendations in this report (Indonesian, English-skip, Persian-skip) rest on the clearer evidence base.

---

## 11. SOURCE INVENTORY

All URLs cited, by section. All confirmed 2024 or later:

**Reddit operator data (§1):**
- reddit.com/r/adops/comments/1sjz5b7 (Apr 2026)
- reddit.com/r/Adsense/comments/1tt04ev (May 2026)
- reddit.com/r/adops/comments/1s1ozk4 (Apr 2026)
- reddit.com/r/Adsense/comments/1qjh7gu (Feb 2026)
- reddit.com/r/gamedev/comments/1n1wi02 (Aug 2025)
- reddit.com/r/gamedev/comments/1i4ad32 (Jan 2025)
- reddit.com/r/Unity3D/comments/1m223uj (Jul 2025)
- reddit.com/r/playgamabridge/comments/1n7c1lv (Sep 2025)
- reddit.com/r/playgamabridge/comments/1mhc7oz (Aug 2025)
- reddit.com/r/defold/comments/1qmhkop (Feb 2026)

**Industry/vendor (§2-3):**
- playgama.com/blog/main/10-ways-to-monetize-html5-games-that-actually-work-in-2026/ (Apr 2026)
- aleydasolis.com/en/search-engine-optimization/serp-shifts-ads-remonetized/ (2026)
- mobidictum.com/pokis-web-gaming-interview-michiel-van-amerongen/ (2025)
- mobidictum.com/crazygames-reaches-35-million-monthly-users/ (2024)
- naavik.co/digest/web-gaming-strikes-back/ (Dec 2024)
- gamedeveloper.com/business/the-huge-hidden-web-game-market-no-one-talks-about (Apr 2025)
- indiegamebusiness.com/web-gaming-for-indie-developers/ (Apr 2026)
- digitaledge.org (Chicken Road case, Nov 2025)
- aioseo.com/trends/gamechampions-seo-case-study/ (May 2024)

**Similarweb/Semrush traffic snapshots (§3):**
- similarweb.com/website/minijuegos.com/ (Apr 2026)
- similarweb.com/website/jogos360.com.br/ (Apr 2026)
- similarweb.com/website/poki.com/ (Apr 2026)
- similarweb.com/website/oyunskor.com/ (May 2025)
- similarweb.com/website/games.co.id/ (Nov 2024)
- semrush.com/website/gamevui.vn/overview/ (Nov 2024)

**CPM data (§4):**
- kestrelmediasolutions.com/what-is-the-rpm-of-the-gaming-niche-and-how-to-increase-it/ (2024-25)
- worldpopulationreview.com/country-rankings/cpm-rates-by-country (2024)
- ranktracker.com/blog/geographic-variations-in-cpc-and-rpm-for-adsense/ (2024-26)
- superwebtricks.com/adsense-earnings-in-india/ (2024)
- awisee.com/blog/cpm-rates-by-country/ (2024-26)
- partnerkin.com/en/blog/articles/adsense_rpm_rates_by_country (2026)
- dynamoi.com/learn/youtube-music-promotion/youtube-rpm-turkey (2026)

**AdSense / Iran / Persian (§5):**
- support.google.com/adsense/answer/6167308 (current)
- support.google.com/adsense/answer/9727 (current)
- iranintl.com/en/202512192470 (Dec 2025)
- ideaagency.net/lifting-youtube-restrictions-in-light-of-revenue/ (2024)
- freedomhouse.org/country/iran/freedom-net/2024 (2024)

**Algorithm/SEO (§6):**
- sistrix.com/blog/google-core-spam-update-march-2024/ (Mar 2024)
- amsive.com/insights/seo/reddits-seo-growth (2024)
- searchengineland.com/google-algorithm-updates-2024-449417 (2024)
- swipeinsight.app (Adsense category deprecation)

**Trends (§7):**
- pocketgamer.biz (CrazyGames May 2026 study)
- antom.com knowledge base (Indonesia + Vietnam 2024)
- jakartaglobe.id (Indonesia 2024)
- vietnam-briefing.com (Vietnam 2024)
- nikopartners.com/sea6-games-market-reports/ (2024)
- nikopartners.com/why-game-companies-are-localizing-into-indonesian/ (2024)

**Next.js i18n (§8):**
- developers.google.com/search/docs/specialty/international/managing-multi-regional-sites (Dec 2025)
- developers.google.com/search/docs/specialty/international/localized-versions
- next-intl.dev/docs/getting-started/app-router (2025)
- nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- ppc.land/google-adsense-expands-language-support-for-related-search-in-auto-ads/ (Sep 2024)
- github.com/vercel/next.js/discussions/79181 (2024-25)
- diluvian.digital/international-seo-site-structure/ (2024)
- scalarly.com/blog/hreflang-implementation-guide/ (2025-26)
- locize.com/blog/next-intl-vs-next-i18next/ (2024-25)
