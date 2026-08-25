# Saudi Language Research — Evidence Log

**Date:** 2026-05-24
**Purpose:** Source citations for every claim in `saudi_language_research.md`, with confidence levels.

---

## A. Google Trends data (primary, live-pulled)

All Google Trends queries set to **geo=SA, time=today 12-m, all categories, Web Search**. Data pulled live via Playwright on 2026-05-24, screenshots saved alongside this document.

### A1. ألعاب vs games

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=%D8%A3%D9%84%D8%B9%D8%A7%D8%A8,games&date=today%2012-m`
- **Result:** Arabic line consistently 60-100, English line consistently 5-15.
- **Screenshot:** `gt-alab-vs-games.png`
- **Related queries for ألعاب (top 5, all "Breakout"):** ألعاب المشاركة والحوار من الألعاب المهيئة للرياضة الجماعية; المسكة الصحيحة للمضرب تسمى بالمسكة المخالية أو الطائرة; ألعاب جسم الإنسان; ندريس الألعاب المهيئة للرياضة الجماعية; من أدوات جزم الفعل أم الأمر — these are school/educational queries, suggesting heavy student-aged search volume in Arabic.
- **Related queries for games (top 5, all "Breakout"):** b22 games; lidl near me; where to watch nfl games; best family board games; best board games for families — these are Western sports/board-game queries; not browser-game-aligned.
- **Confidence: HIGH** (direct live data).

### A2. ألعاب مجانية, free games, ألعاب أونلاين, online games (4-way comparison)

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=...&date=today%2012-m`
- **Average scores:** ألعاب مجانية = **12**, free games = **42**, ألعاب أونلاين = **0**, online games = **44**
- **Screenshot:** `gt-free-online-games.png`
- **Verbatim raw data extracted from page (sample week 14 Dec 2025 — Christmas-week peak):** "12 76 0 100" → that week, English "online games" hit its peak (100) while Arabic "ألعاب أونلاين" was 0. 
- **Related queries:**
  - "ألعاب مجانية" (top 5 rising, all Breakout): ألعاب مجانية بدون_نت; العاب تعليمية; ألعاب كرة القدم مجانية; تنزيل ألعاب مجانًا بدون نت; ألعاب مجانية بنات
  - "free games" (top 5 rising, all Breakout): play free games online without downloading; fog free online games; steam free games this week; car driving games online free; crazygames
  - "online games" (top 5 rising, all Breakout): casino online games www.900freespins.com; wikipedia; casino ohne oasis; msn games online; online casino paypal — **note the casino spam pollution; English "online games" has a casino-affiliate signal that doesn't translate to browser-game intent**.
- **Confidence: HIGH** (direct live data).
- **Caveat:** English "online games" volume is inflated by casino-spam queries that Saudi users might not actually click. Real intent is probably closer to 35 than 44.

### A3. العاب بنات, girls games, العاب سيارات, car games (4-way)

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20%D8%A8%D9%86%D8%A7%D8%AA,girls%20games,%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA,car%20games&date=today%2012-m`
- **Average scores:** العاب بنات = **72**, girls games = **8**, العاب سيارات = **63**, car games = **33**
- **Screenshot:** `gt-girls-cars.png`
- **Sample week (18 May 2025):** "81 19 73 42" → all four had measurable volume but Arabic dominated both genres.
- **Peak (13 July 2025):** Arabic العاب بنات hit 100, English girls games was 0. Sharp asymmetry.
- **Confidence: HIGH.**

### A4. العاب اطفال, kids games, العاب io, io games

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20%D8%A7%D8%B7%D9%81%D8%A7%D9%84,kids%20games,%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20io,io%20games&date=today%2012-m`
- **Average scores:** العاب اطفال = **69**, kids games = **13**, العاب io = **0**, io games = **4**
- **Screenshot:** `gt-kids-io.png`
- **Confidence: HIGH** for kids-games comparison. **LOW** for io-games — both terms register negligibly in Saudi search.

### A5. subway surfers, صبوي سيرفرز, moto x3m, موتو x3m

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=subway%20surfers,%D8%B5%D8%A8%D9%88%D9%8A%20%D8%B3%D9%8A%D8%B1%D9%81%D8%B1%D8%B2,moto%20x3m,%D9%85%D9%88%D8%AA%D9%88%20x3m&date=today%2012-m`
- **Average scores:** subway surfers = **68**, صبوي سيرفرز = **1**, moto x3m = **1**, موتو x3m = **0**
- **Screenshot:** `gt-named-games.png`
- **Confidence: HIGH.** Saudis search for game IPs in their English form, not transliterated to Arabic.

### A6. العاب فلاش, flash games, crazygames, poki

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20%D9%81%D9%84%D8%A7%D8%B4,flash%20games,crazygames,poki&date=today%2012-m`
- **Average scores:** العاب فلاش = **6**, flash games = **1**, crazygames = **1**, **poki = 77**
- **Screenshot:** `gt-brands.png`
- **Key insight:** Saudi users overwhelmingly recognize Poki as a brand (77 score). CrazyGames is 77× smaller in Saudi brand recognition. **Poki is the brand to compete against, not CrazyGames.**
- **Confidence: HIGH.**

### A7. ألعاب اون لاين / العاب اون لاين / games online / play games

- **URL:** `https://trends.google.com/trends/explore?geo=SA&q=%D8%A3%D9%84%D8%B9%D8%A7%D8%A8%20%D8%A7%D9%88%D9%86%20%D9%84%D8%A7%D9%8A%D9%86,%D8%A7%D9%84%D8%B9%D8%A7%D8%A8%20%D8%A7%D9%88%D9%86%20%D9%84%D8%A7%D9%8A%D9%86,games%20online,play%20games&date=today%2012-m`
- **Average scores:** ألعاب اون لاين = **0**, العاب اون لاين = **6**, games online = **44**, play games = **33**
- **Confidence: HIGH.** The English-transliterated "online" concept doesn't carry in Arabic search. "Online games" composite specifically uses English in Saudi search behavior.

---

## B. Saudi SERP audits (live, 2026-05-24)

### B1. SERP for `العاب مجانية` (Saudi geo, Arabic locale)

- **URL:** `https://www.google.com/search?q=%D8%A7%D9%84%D8%B9%D8%A7%D8%A8+%D9%85%D8%AC%D8%A7%D9%86%D9%8A%D8%A9&gl=sa&hl=ar`
- **Screenshot:** `serp-arabic.png`
- **Top 9 organic results (all Arabic-localized URLs):**

  | # | Domain | Title |
  |---|---|---|
  | 1 | poki.com/ar | Poki (بوكي) - موقع العاب مجانية عبر الإنترنت - العب الآن! |
  | 2 | crazygames.com/ar/ | ألعاب مجانية عبر الإنترنت على كريزي جيمز |
  | 3 | playhop.com/ar | ألعاب مجانية على الإنترنت — 20000+ لعبة متصفح |
  | 4 | microsoft.com/ar-dj/store | ألعاب مجانية \| Microsoft Store |
  | 5 | say.games/ar | ألعاب مجانية على الإنترنت |
  | 6 | playstation.com/ar-ae | أفضل الألعاب المجانية على PS4 وPS5 |
  | 7 | yandex.com/games/ar | Yandex Games |
  | 8 | facebook.com | (Arabic video) |
  | 9 | youtube.com | (Arabic YT short) |

- **Confidence: HIGH** (live audit).
- **Critical insight:** All seven non-video SERP results use `/ar` URL prefixes. Every title tag is Arabic. Plixfy entering this SERP MUST have Arabic title tags or it will not rank.

### B2. SERP for `free online games` (Saudi geo, English locale)

- **URL:** `https://www.google.com/search?q=free+online+games&gl=sa&hl=en`
- **Top 10 organic results:**

  | # | Domain | Saudi-targeted? |
  |---|---|---|
  | 1 | poki.com | No (global) |
  | 2 | crazygames.com | No (global) |
  | 3 | playhop.com | No (global) |
  | 4 | funbrain.com/games | **No — US-only** |
  | 5 | pbskids.org/games | **No — US public TV** |
  | 6 | arkadium.com | No |
  | 7 | gamesgames.com | No |
  | 8 | msn.com/en-in/play | **No — MSN India** |
  | 9 | addictinggames.com | No |
  | 10 | nick.com/games | **No — US Nickelodeon** |

- **Confidence: HIGH** (live audit).
- **Insight:** Half the English Saudi SERP is filled with US-targeted (PBS, Nick, Funbrain) or MSN-India content with no Saudi cultural targeting. There's a competitive opportunity gap here, but volume is much lower than Arabic.

---

## C. Top Saudi gaming YouTubers (language audit)

**Sources:**
- https://yoloco.io/gaming-youtube_channels-saudi+arabia
- https://www.speakrj.com/audit/top/youtube/sa/Video_game_culture
- https://vidiq.com/youtube-stats/top/country/sa/

**Top 10 channels with subscriber counts and content language:**

| Channel | Subs | Username script | Content language |
|---|---|---|---|
| Arab Games Network (شبكة العاب العرب) | 21M | Arabic+Latin | Arabic |
| BanderitaX | 16.6M | Latin | Arabic |
| FANTOM Pro | — | Latin | Arabic |
| D-Gray (ديكراي) | — | Mixed | Arabic |
| صالح - OPiiLz | — | Mixed | Arabic |
| D7oomy_999 (دحومي٩٩٩) | — | Mixed | Arabic |
| YassPlays | — | Latin | Arabic |
| Yousef Ahmed | — | Latin | Arabic |
| TMFaisal | — | Latin | Arabic |
| Saud Brothers Gaming | — | Latin | Arabic |

- **Verbatim from yoloco.io research:** "Arab Games Network (شبكة العاب العرب) is the #1 video game culture YouTube channel in Saudi Arabia with 21 million subscribers."
- **Verbatim insight:** "BanderitaX, run by Bander (Banderita), a Saudi YouTuber from Jazan, showcases game streaming videos from titles like Fortnite, Poppy Playtime, and Resident Evil, with over 16.6 million subscribers and more than 3 billion views."
- **Confidence: HIGH** for content-language claim; **MEDIUM** for exact subscriber rank order (which fluctuates monthly).

---

## D. Saudi app store / Google Play data

**Sources:**
- https://app.appfigures.com/top-apps/google-play/saudi-arabia/games (April 2025)
- https://apptopia.com/store-insights/top-charts/google-play/games/saudi-arabia
- https://www.appbrain.com/stats/google-play-rankings/top_free/game/sa
- https://medium.com/googleplaydev/find-success-for-apps-and-games-in-the-middle-east-and-north-africa-e067c72cde47 (Google Play Apps & Games team)

**Verbatim from Google Play Apps & Games team Medium post:**
- *"achieving a top 5 spot in Google Play's 'New + Updated' section requires Arabic localization."*
- *"Strategy games are the top-grossing genre in MENA, and most of the top strategy games are localized to Arabic."*

**Top 3 free games in Saudi Arabia, April 2025:**
- Candy Crush Saga (English title, full Arabic localization)
- Ludo King (English title, full Arabic localization)
- PUBG Mobile (English title, full Arabic localization)

Also in top 10: **Yalla Ludo** (Arabic name "Yalla" = "let's go" — Saudi-built game), Roblox, Subway Surfers, Free Fire, Among Us.

- **Confidence: HIGH** for pattern of "English title + Arabic localization is the winning pattern."

---

## E. Saudi gaming web traffic (Similarweb / Semrush)

**Sources:**
- https://www.similarweb.com/top-websites/saudi-arabia/games/ (Dec 2024)
- https://www.semrush.com/website/top/saudi-arabia/games/ (Feb 2026)

**Top games-category sites in Saudi Arabia (Dec 2024 / Feb 2026 cross-reference):**

| Rank | Site | Monthly visits | Language |
|---|---|---|---|
| 1 | twitch.tv | 6.23M (Feb 2026) | English (global) |
| 2 | roblox.com | — | English |
| 3 | discord.com | 4.96M | English |
| 4 | steampowered.com | 1.83M | English |
| 5 | asuracomic.net | — | English (anime/manga) |
| 6 | epicgames.com | — | English (global, Arabic locale option) |

- **Insight:** The top Saudi-traffic "games" websites are global English-named services (Twitch, Discord, Steam, Epic). These serve **hardcore/console/PC gamers** — a different audience from plixfy's casual browser-game niche.
- **The "Games - Other" sub-category** (which is closer to plixfy's space) has different leaders: sng.link, g2a.com, steamdb.info, kammelna.com, fortnite.com — still mostly English. But this is hardcore gaming, NOT browser-casual which is plixfy's segment.
- **Confidence: HIGH** on the data itself, **MEDIUM** on relevance to plixfy specifically.

---

## F. Saudi linguistic / cultural research (peer-reviewed)

### F1. Jouf University 2024 code-switching study

- **Source:** Kais Sultan Mousa Alowidha, "English-Arabic Code Switching and Identity in Bilingual ..." (2024), via Arab News coverage: https://www.arabnews.com/node/2608210/saudi-arabia
- **Verbatim findings (Arab News summary):** *"In Saudi Arabia's increasingly globalized society, especially among young people in major cities, there is an easy blending of languages, often switching between Arabic and English in the same conversation, a phenomenon known as code-switching that has become a linguistic norm reflecting shifting social dynamics, culture and identity."*
- **Verbatim research finding:** *"bilingual Saudis often switch between Arabic and English depending on the context, particularly in casual or professional settings. ... in casual settings, code-switching takes place according to the topic."*
- **Verbatim research finding:** *"bilingual Saudis strongly identify with both languages and do not believe that speaking English negates their cultural identity. Code-switching, especially in the Kingdom, appears to be less about identity loss and more about functionality."*
- **Confidence: HIGH** (peer-reviewed academic source).

### F2. Saudi children/family English-Arabic learning preference

- **Source:** Saudi Journal of Language Studies, "Educational language choice and the role of technology" (2025)
- **Verbatim finding:** *"50% of surveyed mothers would prefer to use a mix of English and Arabic when speaking to their children at home and 70% believe that the age of four or five is ideal for starting to learn English."*
- **Implication:** Saudi families are explicitly raising bilingual children. The next generation will have higher English exposure. But this is bilingual, not English-dominant.
- **Confidence: HIGH.**

### F3. Vision 2030 English-language push

- **Source:** Frontiers in Communication, "English language in Saudi Arabia: vision 2030 in the historical prism of a clash between cultures" (2024) — https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1205167/full
- **Insight:** Saudi government strategically promoting English while preserving Arabic. The trend is bilingualism, not language shift.
- **Confidence: MEDIUM-HIGH.**

---

## G. Saudi consumer services language audits

### G1. Food delivery (HungerStation, Jahez, Mrsool)

- **HungerStation:** Per `apps.apple.com/sa/app/hungerstation-food-delivery/` and user reviews: app supports Arabic and English UI, **defaults to Arabic for Saudi geo / Arabic-default-device users**. Customer service is Arabic-first.
- **Jahez, Mrsool:** Saudi-built, Arabic-first by default.
- **Confidence: HIGH** for HungerStation Arabic-default claim; **MEDIUM** for Jahez/Mrsool (less specific public documentation, but pattern is consistent with the category).

### G2. International services in Saudi market

- **Amazon.sa** — Arabic UI default on the .sa TLD.
- **Noon.com** — Arabic UI default in Saudi.
- **Netflix** — Arabic UI default for Saudi accounts; Arabic-dubbed/subtitled content dramatically over-indexes engagement.
- **YouTube** — Arabic UI default; Saudi feed serves predominantly Arabic creators.
- **TikTok / Snapchat** — Arabic UI default; Saudi #1 user country for Snapchat globally.
- **Confidence: HIGH** for the consistent pattern.

---

## H. Saudi smartphone & internet penetration (DataReportal 2024)

- **Source:** https://datareportal.com/reports/digital-2024-saudi-arabia, https://www.statista.com/statistics/494616/smartphone-users-in-saudi-arabia/
- **Smartphone penetration 2024:** 92% of Saudi adults own a smartphone
- **Smartphone users (2024):** 33.55 million
- **Market share:** Apple 46%, Samsung 24%, Huawei 12%; iOS ~46% / Android ~54%
- **Implication:** Mobile-first product is mandatory. iOS Safari + Arabic rendering need explicit testing.
- **Confidence: HIGH.**

---

## I. Native Arabic-first gaming portals (existing competitors)

Found in Saudi Arabic SERP for "العاب مجانية":

| Domain | Catalog size | Language |
|---|---|---|
| gamesbarq.com (العاب فلاش برق) | 1,000+ games | 100% Arabic |
| jawalgames.com | (smaller) | 100% Arabic |
| mizogames.com | 250+ games | 100% Arabic |

- **Confidence: HIGH** that these exist and are Arabic-native; **MEDIUM** on catalog claims (self-declared).
- **Implication:** Native Arabic-first portals exist and rank. Plixfy's catalog advantage (18K Playgama games) significantly out-scales them, but plixfy must match their Arabic UI to compete.

---

## J. Open questions / verification gaps

1. **No public data on actual search-volume absolute numbers** (Google Trends gives relative, not absolute). Estimates here use ratio-weighted assumptions about category share.
2. **No city-specific keyword data for Riyadh vs Jeddah vs Dammam** beyond the broad sub-region rankings on Google Trends. To get tighter geo data would require a paid Semrush or Ahrefs subscription.
3. **No real-time user-level data on plixfy's prospective audience.** First 30 days of plixfy launch traffic should be measured separately for Arabic-UI vs English-UI usage to confirm/refine these estimates.
4. **No published "% of Saudi devices defaulting to Arabic keyboard" stat.** Inferred from market-share data (Apple/Samsung dominance + Saudi-locale defaults).

---

## K. Contradictions log

| Finding | Contradicting signal | Resolution |
|---|---|---|
| "Arabic dominates Saudi gaming search" | Top games-category Saudi web traffic (Twitch, Discord, Steam) is English | The high-traffic English sites serve hardcore/PC/console gamers — a different segment from plixfy's casual browser-game niche. Both can be true. |
| "Arabic SERP is competitive (Poki, CrazyGames, Playhop all localized)" | English SERP for "free online games" is competitively soft (PBS Kids, MSN India, Nick) | True — there IS an English-niche opportunity in Saudi. But it's a niche, and the volume is lower than the Arabic niche. Recommend Arabic-first, English toggle later, not English-only. |
| "Saudi younger users (Gen Z) are bilingual" | Same Saudi younger users search "العاب بنات" 9× more than "girls games" | Bilingualism doesn't mean equal preference. Code-switching theory predicts language CHOICE depends on topic — and games-as-leisure is an Arabic-leaning topic for Saudi audiences. |
| "Specific game names are searched in English" | Specific game names within the Arabic-UI gaming sites display fine in English | Plixfy keeps game names in English; that's the recommendation. No contradiction — they're consistent. |
| "30% search in English overall" | English SERP is full of US-targeted sites | The 30% English share is real; the SERP competitive gap is the opportunity Plixfy can exploit secondarily. |

---

## L. Full source index

### Google Trends (live, 2026-05-24)
- https://trends.google.com/trends/explore?geo=SA&q=ألعاب,games
- https://trends.google.com/trends/explore?geo=SA&q=ألعاب مجانية,free games,ألعاب أونلاين,online games
- https://trends.google.com/trends/explore?geo=SA&q=العاب بنات,girls games,العاب سيارات,car games
- https://trends.google.com/trends/explore?geo=SA&q=العاب اطفال,kids games,العاب io,io games
- https://trends.google.com/trends/explore?geo=SA&q=subway surfers,صبوي سيرفرز,moto x3m,موتو x3m
- https://trends.google.com/trends/explore?geo=SA&q=العاب فلاش,flash games,crazygames,poki
- https://trends.google.com/trends/explore?geo=SA&q=ألعاب اون لاين,العاب اون لاين,games online,play games

### Google SERP audits (live, 2026-05-24)
- https://www.google.com/search?q=العاب+مجانية&gl=sa&hl=ar
- https://www.google.com/search?q=free+online+games&gl=sa&hl=en

### Industry data
- https://www.similarweb.com/top-websites/saudi-arabia/games/
- https://www.semrush.com/website/top/saudi-arabia/games/
- https://app.appfigures.com/top-apps/google-play/saudi-arabia/games
- https://apptopia.com/store-insights/top-charts/google-play/games/saudi-arabia
- https://www.appbrain.com/stats/google-play-rankings/top_free/game/sa
- https://medium.com/googleplaydev/find-success-for-apps-and-games-in-the-middle-east-and-north-africa-e067c72cde47

### YouTube creator rankings
- https://yoloco.io/gaming-youtube_channels-saudi+arabia
- https://www.speakrj.com/audit/top/youtube/sa/Video_game_culture
- https://vidiq.com/youtube-stats/top/country/sa/

### Linguistic research
- https://www.arabnews.com/node/2608210/saudi-arabia (Saudi code-switching, 2024)
- https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1205167/full (English in Saudi Arabia)
- https://doi.org/10.1108/SJLS-05-2025-0037 (Saudi Journal of Language Studies, parental attitudes)
- https://saudijournals.com/media/articles/SIJLL_74_120-144_qWIpD4e.pdf (Gen Z UAE linguistic study — cross-reference)
- https://www.arjhss.com/wp-content/uploads/2024/05/M758996.pdf (English-Arabic code-switching study)

### Saudi digital landscape
- https://datareportal.com/reports/digital-2024-saudi-arabia
- https://www.statista.com/statistics/494616/smartphone-users-in-saudi-arabia/
- https://saudigazette.com.sa/article/657974 (SDAIA Arabic language models 2025)

### Native Arabic gaming portals (discovered in SERP)
- https://gamesbarq.com/
- https://jawalgames.com/
- https://www.mizogames.com/
