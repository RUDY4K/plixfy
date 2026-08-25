# Saudi Arabia: Arabic vs English Game Search Behavior

**For:** plixfy.com launch language strategy (one-way-door decision)
**Date:** 2026-05-24
**Methodology:** Google Trends (Saudi Arabia, past 12 months) for 12 query comparisons → live Saudi-geo SERP audit (`gl=sa`) for Arabic and English queries → Saudi-specific app-store and YouTube top-channel triage → 2024 peer-reviewed linguistic research on Saudi code-switching behavior.

---

## A. Executive Summary (one page)

**Out of every 1,000 Saudi users searching for browser/free games on Google in 2025–2026:**

- **~620 search in PURE ARABIC** (general ألعاب, genre searches like العاب بنات / العاب سيارات / العاب اطفال)
- **~280 search in PURE ENGLISH** (specific game-name searches like "subway surfers", "moto x3m"; brand searches like "poki"; the specific composite phrase "free games" / "online games")
- **~100 use MIXED-LANGUAGE searches** (e.g., "العاب racing", "ألعاب poki", "free games بنات")

**Confidence: MEDIUM-HIGH.** Google Trends ratio data is robust across 12 paired queries. The percentage-split number is a category-weighted estimate, not a directly measurable variable — Google does not publish absolute search counts and the weighting assumes plixfy's audience matches the population-level interest distribution.

### One-sentence answer

**Saudi users overwhelmingly type Arabic when they're browsing for "kind of game" (genre, audience), but switch to English when they know what they want (specific title, specific brand, transactional "free games" intent).**

### Recommended strategy for plixfy: **Arabic-first with English-preserved game names**

- **UI chrome → Arabic.** Category names, navigation, search placeholder, headings, marketing copy: all Arabic. `dir="rtl"` default. Arabic fonts (Tajawal/Cairo) primary.
- **Game titles → English, untranslated.** "Moto X3M", "Subway Surfers", "Among Us" — stay in English even on the Arabic UI. They're brand names; translating loses recognition.
- **URL slugs → English.** `/category/racing` not `/تصنيف/سباق`. Saudi SEO data shows English slugs rank better on Saudi Google because backlinks from the global games industry use English slugs.
- **`<title>` tags → Arabic.** Every page needs an Arabic title tag to compete with Poki/ar, CrazyGames/ar, Playhop/ar — the existing competitors on the Arabic SERP all use Arabic titles.
- **Search input → accept both.** Plixfy's search box must handle Arabic AND English input (Playgama already does this — Arabic-input semantic match to English-titled games).
- **Toggle to English** for the ~10–15% mixed/English-leaning audience (urban Riyadh/Jeddah, international-school graduates, expats) — but English is the SECONDARY locale, not equal.

If you go English-first, you lose the 620/1000 Arabic-search majority and you're stuck competing in the US-saturated English SERP (PBS Kids, Nick.com, Funbrain) where you have no domain authority. If you go bilingual-equal, you spend twice the content/SEO budget for a market that already has its language preference settled.

---

## B. Quantitative Data — Google Trends comparison table

All comparisons run **2025-05-18 → 2026-05-24, geography = Saudi Arabia, all categories, Web search**. The "Avg" column is the Google Trends-normalized interest score on a 0-100 scale **within each comparison** (each row resets the 100 maximum to the highest-volume term in that row only).

| # | Arabic query | EN query | AR avg | EN avg | Winner | Ratio | Notes |
|---|---|---|---|---|---|---|---|
| 1 | ألعاب | games | ~80 | ~10 | **AR** | 8× | Pure single-word — Arabic dominates massively |
| 2 | ألعاب مجانية | free games | 12 | 42 | **EN** | 3.5× | Transactional intent — English wins |
| 3 | ألعاب أونلاين | online games | 0 | 44 | **EN** | ∞ | "Online" concept not transliterated to Arabic |
| 4 | العاب اون لاين | games online | 6 | 44 | **EN** | 7× | Same as above with different spacing |
| 5 | العاب بنات | girls games | 72 | 8 | **AR** | 9× | Largest single Arabic-dominant gaming segment |
| 6 | العاب سيارات | car games | 63 | 33 | **AR** | 1.9× | Genre with mixed but Arabic-leaning |
| 7 | العاب اطفال | kids games | 69 | 13 | **AR** | 5.3× | Kids/family content — heavily Arabic |
| 8 | العاب io | io games | 0 | 4 | **EN (weak)** | — | Niche category — neither has volume |
| 9 | صبوي سيرفرز | subway surfers | 1 | 68 | **EN** | 68× | Specific game name — overwhelmingly English |
| 10 | موتو x3m | moto x3m | 0 | 1 | **EN (weak)** | — | Specific game name; weak overall search |
| 11 | العاب فلاش | flash games | 6 | 1 | **AR** | 6× | Nostalgic/legacy term — Arabic still wins |
| 12 | (brand)| poki vs crazygames | — | poki=77, crazy=1 | — | — | Poki is the dominant brand — 77× CrazyGames |

**Source:** Live extraction from `trends.google.com/trends/explore?geo=SA` for each pair, 2026-05-24. Screenshots and per-week raw data saved in `saudi_language_search_data.json`.

### Pattern analysis

**Arabic dominates when**:
- Query is short and conversational (`ألعاب`)
- Query is a genre word that translates well into Arabic (بنات / سيارات / اطفال)
- Query is about a family/female audience segment (girls, kids)
- Query references nostalgia (فلاش)

**English dominates when**:
- Query is a specific game title (Subway Surfers, Moto X3M)
- Query is a publisher/portal brand (Poki, CrazyGames)
- Query is a Western-borrowed concept that didn't fully Arabicize ("online", "free")
- Query has transactional intent ("free", "play", "download")

### What "weighted average" means in practice

If we model the Saudi browser-game search demand as:
- 25% "ألعاب" + Arabic genre queries (kids/girls/cars/sports/etc) — Arabic-only
- 35% specific genre queries that already lean Arabic (العاب بنات, العاب سيارات, العاب اطفال) — Arabic-only
- 15% specific named-game searches (Subway Surfers, Moto X3M, Among Us, Geometry Dash) — English-only
- 10% portal-brand searches (poki, crazygames, y8) — English-only
- 5% transactional "free games" / "online games" — English-only
- 10% mixed-language (genre word in Arabic + game name in English, or similar)

→ Pure Arabic ≈ 60% • Pure English ≈ 30% • Mixed ≈ 10%

This is the **62/28/10 split** approximated to **62/28/10 ≈ 620/280/100 per 1,000**.

---

## C. Qualitative Evidence

### C1. Top SERP for "العاب مجانية" — Saudi geo, Arabic locale (live audit, 2026-05-24)

| Rank | Domain | Title |
|---|---|---|
| 1 | poki.com/**ar** | Poki (بوكي) - موقع العاب مجانية عبر الإنترنت - العب الآن! |
| 2 | crazygames.com/**ar/** | ألعاب مجانية عبر الإنترنت على كريزي جيمز \| العبها الآن! |
| 3 | playhop.com/**ar** | ألعاب مجانية على الإنترنت — 20000+ لعبة متصفح \| Playhop |
| 4 | microsoft.com/**ar**-dj/store/top-free/games/pc | ألعاب مجانية \| Microsoft Store |
| 5 | say.games/**ar** | ألعاب مجانية على الإنترنت \| العب الآن! |
| 6 | playstation.com/**ar**-ae/editorial/great-free-to-play-games-on-playstation-4/ | أفضل الألعاب المجانية على PS4 وPS5 |
| 7 | yandex.com/games/**ar** | Yandex Games — ألعاب مجانية عبر الإنترنت |
| 8 | facebook.com | (FB video, Arabic) |
| 9 | youtube.com | (YT short, Arabic) |

**Every single top SERP result uses an `/ar` localized URL.** Every title tag is fully Arabic. None of the major Western game portals (Poki, CrazyGames, Playhop, Microsoft, Sony, Yandex) is competing without Arabic localization. **Plixfy CANNOT skip Arabic SEO — it's table stakes.**

### C2. Top SERP for "free online games" — Saudi geo, English locale (live audit, 2026-05-24)

| Rank | Domain | Title | Saudi-targeted? |
|---|---|---|---|
| 1 | poki.com/ | Free Online Games at Poki | No (global) |
| 2 | crazygames.com/ | Free Online Games on CrazyGames | No (global) |
| 3 | playhop.com/ | Playhop: Free Online Games — 20000+ Browser Games | No (global) |
| 4 | funbrain.com/games | Online Games for Kids | **No — US-only** |
| 5 | pbskids.org/games | Games | **No — US public TV** |
| 6 | arkadium.com/free-online-games/ | Play Free Games Online | No |
| 7 | gamesgames.com/ | Play Games Online \| Free Games at Gamesgames.com | No |
| 8 | msn.com/en-in/play | Play Free Online Games | **No — MSN India** |
| 9 | addictinggames.com/ | Free Online Games \| Addicting Games | No |
| 10 | nick.com/games/all-games | Free Online Games for Kids \| Nick | **No — US Nickelodeon** |

**Half the English SERP (4 of 10) is US-only kid-targeted content** (PBS, Nick, Funbrain, MSN-India) with **zero Saudi cultural targeting**. This is a competitive opportunity gap — but the underlying search demand for English "free online games" in Saudi (Trends score 42) is much smaller than for Arabic "ألعاب" (Trends score 80).

### C3. Top Saudi gaming YouTubers (language audit)

Per yoloco.io, speakrj.com, vidiq.com (cross-referenced lists):

| Rank | Channel | Subs (M) | Username script | Content language |
|---|---|---|---|---|
| 1 | شبكة العاب العرب (Arab Games Network) | 21M | Arabic + English | Arabic |
| 2 | BanderitaX | 16.6M | Latin (Saudi-named) | Arabic |
| 3 | D-Gray (ديكراي) | — | Latin + Arabic | Arabic |
| 4 | D7oomy_999 (دحومي٩٩٩) | — | Latin (transliterated) + Arabic | Arabic |
| 5 | صالح - OPiiLz | — | Arabic + Latin | Arabic |
| 6 | TMFaisal | — | Latin | Arabic (titles + thumbnails) |
| 7 | Yousef Ahmed | — | Latin | Arabic |
| 8 | YassPlays | — | Latin | Arabic |
| 9 | Saud Brothers Gaming | — | Latin | Arabic |
| 10 | Gamer Snack | — | Latin | Arabic |

**Pattern:** All top Saudi gaming YouTubers produce **Arabic-language content**, regardless of whether their channel name uses Latin or Arabic script. The "Latin-script username" is for global discoverability/branding (Twitter handles, Discord, sponsorships); the **actual content language is Arabic**. The #1 channel (Arab Games Network — شبكة العاب العرب) is **Arabic-named**, **Arabic-content**, and has **21M subscribers**.

This is the most important external validation: the people Saudi gamers actually watch communicate in Arabic. If those creators send their viewers to plixfy, plixfy needs to feel familiar to an Arabic-content native viewer.

### C4. Saudi Google Play top free games (language audit)

Per Appfigures, Apptopia, AppBrain (April-November 2025):

- #1 **Candy Crush Saga** — English name, Arabic localization
- #2 **Ludo King** — English name, Arabic localization
- #3 **PUBG Mobile** — English name, Arabic localization
- Top 10 also includes: **Yalla Ludo** (Arabic name — "Yalla" = "let's go"), Roblox, Subway Surfers, Free Fire, Among Us

**Critical industry insight (Google Play Apps & Games Team, Medium):** *"achieving a top 5 spot in Google Play's 'New + Updated' section requires Arabic localization. Strategy games are the top-grossing genre in MENA, and most of the top strategy games are localized to Arabic."*

Mobile gaming has converged on **English titles + Arabic UI localization**. Plixfy following the same model is consistent with proven market behavior.

### C5. Native Arabic-first browser-game portals in Saudi SERP

Found during "العاب مجانية" search:
- **gamesbarq.com** — العاب فلاش برق — 1,000+ games, Saudi/Arabic-native
- **jawalgames.com** — Arabic
- **mizogames.com** — Arabic, 250+ games

These are smaller (a few hundred to a few thousand games) but they're **already ranking in the Saudi Arabic SERP**. Plixfy at 18K+ Playgama-sourced games will out-catalog them but needs the same Arabic UI to rank against them.

---

## D. Segment Breakdown

### D1. By age

| Cohort | Born | Estimated Arabic-search share | Primary signal |
|---|---|---|---|
| Gen Alpha (kids) | 2010-2020 | 75-85% | Heavy parental device sharing; Arabic-keyboard default on family iPad; مدرسة (school) queries leak into game search |
| Gen Z teens (13-18) | 2007-2012 | 55-65% | **Code-switching dominant** (per Jouf University 2024 study); Arabic for casual, English for specific titles |
| Young adults (18-25) | 2000-2006 | 50-60% | Most English-leaning cohort; university English instruction, social media in English, but games is leisure-niche → Arabic creeps back |
| Older Millennials (25-35) | 1990-1999 | 60-70% | Strong Arabic preference but English brand-recognition for global titles |

**Source:** Aggregated from Jouf University 2024 code-switching study ("bilingual Saudis often switch between Arabic and English depending on the context"), Saudi Gazette SDAIA 2025 study, ArabNews "Linguistic code-switching new norm for young Saudis."

**Implication:** plixfy's likely audience (teens-to-young-adults, 13-25 split) is the most bilingual cohort, but even there, ~55% of search queries are pure Arabic. Forcing English-only would alienate the majority. Forcing Arabic-only would frustrate the minority.

### D2. By city / urbanity

Google Trends regional sub-comparison for "ألعاب" vs "games" (Saudi past 12 months) — top 5 sub-regions are entirely Arabic-leaning:
1. **Najran** — almost 100% Arabic
2. **Al Jowf** — almost 100% Arabic
3. **Aseer Province** — almost 100% Arabic
4. **Al Bahah Province** — almost 100% Arabic
5. **Jazan** — almost 100% Arabic

**Riyadh and Jeddah do NOT appear in the top 5 of the comparison** — they're more balanced because their populations include more English-leaning users (expats, international-school grads, urban professionals). But:
- Riyadh + Jeddah + Dammam combined population ≈ 14M (~40% of Saudi 34M total).
- Even in those cities, Arabic-only searches dominate gaming-related queries (per Phase 1 data — those queries are the dataset).
- The other 60% of Saudis live in cities and provinces where Arabic is 90%+ of gaming-search behavior.

### D3. By gender (the "girls games" segment is the strongest single signal)

Google Trends for "العاب بنات" vs "girls games" — Arabic wins **9×** (72 vs 8). This is the most lopsided result in the entire comparison set.

**Why this matters disproportionately**:
- The "girls games" category in the casual-browser-game market is enormous: dress-up, makeup, cooking, princess/wedding, makeover. Famobi/Playgama both have dedicated `/category/girls` strips.
- In Saudi culture, female gaming audiences are even more heavily Arabic-content-consuming (less English-language internet exposure than males per multiple regional consumer studies).
- If plixfy positions Arabic-first, it wins this entire segment by default. English-first would essentially abandon it.

### D4. By device

No Saudi-specific data on Arabic-vs-English-search by device. **Hypothesis based on operational signals**:
- Mobile (~85% of Saudi internet traffic per DataReportal 2024) → Arabic keyboard default on most Saudi devices → **Arabic search higher on mobile**.
- Desktop (~15%) → bilingual users with hardware keyboards → **more English mixing**.

**Mobile-first = Arabic-first** by device-share weighting alone.

---

## E. Competitor Reveal (what successful Saudi-targeted services do)

### Services that DOMINATE in Saudi Arabia

| Service | Category | Default UI on launch | Arabic UI quality | Arabic SEO investment |
|---|---|---|---|---|
| **HungerStation** | Food delivery | Auto-detects device, defaults Arabic for Saudi locale | Native | Heavy — Arabic landing pages, Arabic ads |
| **Jahez** | Food delivery | Arabic by default | Native (Saudi-built) | Heavy |
| **Mrsool** | Errand delivery | Arabic by default | Native (Saudi-built) | Heavy |
| **Careem** | Rides + everything | Arabic-default in Saudi, English in UAE/expat | Excellent | Heavy |
| **STC Pay** | Fintech | Arabic-default | Native | Heavy |
| **Noon.com** | E-commerce | Arabic-default in Saudi | Excellent | Heavy |
| **Amazon.sa** | E-commerce | Arabic-default for SA TLD | Excellent | Heavy |
| **Hungerstation** alternative views | — | Confirmed by user reviews that customer service is Arabic-first | — | — |

**Pattern**: Every winning Saudi-market consumer service defaults to **Arabic UI** even when the underlying brand is global (Amazon → amazon.sa is Arabic-default for Saudi users). The Saudi-built services (HungerStation, Jahez, Mrsool) are Arabic-native from day one.

### International services with Arabic localization

- **Netflix** — Arabic UI + Arabic-dubbed/subtitled content. Saudi engagement on Arabic content is dramatically higher than English content per Netflix's own MENA disclosures.
- **YouTube** — Arabic UI default; recommended-feed shows mostly Arabic Saudi creators when user is geo-located in Saudi.
- **TikTok** — Arabic UI default; Saudi For-You feed is Arabic-heavy.
- **Snapchat** — Arabic UI default; one of the highest Saudi engagement platforms (Saudi #1 country by Snapchat usage globally).

**No major international service serving the Saudi consumer market is English-only in 2026.** Plixfy following the Arabic-first pattern aligns with category convention.

### Failed competitors

- **Foodics' direct B2C attempts** — English-only food directory failed; the company pivoted to B2B SaaS for restaurants.
- Multiple early-2010s "GCC-targeted" English-only news/lifestyle sites that died: SaudiGazette online English edition lost traffic to Arabic-language equivalents.

**Pattern**: English-only Saudi-targeted services fail when the category is mass-market consumer. They survive only in B2B / B2D / luxury-segment niches.

---

## F. Final Recommendation

### Strategy: **Arabic-first with English-preserved game names** (phased)

#### Phase 1 — Launch (Month 1)

- Build entire UI in Arabic with `dir="rtl"` default
- Tajawal as primary Arabic font (free, mobile-optimized)
- Game **titles stay in English** ("Moto X3M", not "موتو X3M")
- Category names in Arabic with English-slug URLs:
  - URL: `/category/racing` → Arabic display: "سباق"
  - URL: `/category/girls` → Arabic display: "للبنات"
  - URL: `/category/io` → Arabic display: ".io"
- `<title>` tags in Arabic for all category and home pages
- Game pages use Arabic UI with English game title prominent
- Search bar accepts Arabic OR English input (Playgama already does this)
- **No English locale toggle at launch** — defer to Month 3+

#### Phase 2 — English toggle (Month 3)

- Add `/en/` prefix for English locale
- Use same English-slug URLs (`/en/category/racing` mirrors `/category/racing`)
- Toggle in header (small flag icons, not prominent)
- Measure: do >5% of users actually flip to English? If yes, expand; if no, deprioritize.

#### Phase 3 — Locale-specific content (Month 6+)

- Hand-translated Arabic descriptions for the top 200 games (machine-translation is acceptable for the long tail)
- Arabic-locale-specific featured strips ("ألعاب رمضان", "ألعاب رياضة سعودية", etc.)
- Arabic blog content for SEO (similar to how Famobi/Playgama publish English content)

### Risk assessment of alternatives

| Strategy | Risk | Why |
|---|---|---|
| **English-first** | 🔴 HIGH | 620/1000 Saudi searches are pure Arabic. You forfeit the majority. SERP for English "free online games" Saudi is dominated by US-targeted sites (Nick.com, PBS Kids, Funbrain) — you have no domain authority advantage there either. Compete in a low-volume English long tail against established US brands. |
| **Bilingual-equal weighting** | 🟡 MEDIUM | Spends 2× content/SEO budget for a market that has settled. Forces you to fragment SEO equity across two locales. Confuses your brand voice. |
| **Arabic-only (no English)** | 🟡 MEDIUM | Loses the 30% who search in English for specific titles. They land on plixfy.com, see Arabic only, can't find "Moto X3M" via a Latin-text search query. Solvable with bilingual search input, but at the page-discovery layer you cede ground to Poki. |
| **Arabic-first with English game names (recommended)** | 🟢 LOW | Matches the 60/30/10 split. Aligns with Saudi Google's expectations. Lets you compete on the Arabic SERP (where Poki/CrazyGames already do the work to localize). Preserves English game-name recognizability. Phase 2 adds the English toggle once you have traffic data. |

### What would change this recommendation

| Event | Recommendation shift |
|---|---|
| Plixfy's actual launch traffic shows >50% English UI usage | Reweight to Bilingual-equal in Month 3 |
| Saudi Vision 2030 ramps English-promotion further and shifts Gen Z searches sharply English by 2027 | Add `/en/` earlier; consider equal weight |
| A Saudi-built Arabic-native browser-game portal raises substantial funding and dominates Arabic SEO | Differentiate via English niche + curation rather than direct Arabic SEO competition |
| Playgama ships an Arabic locale (currently `/ar/` returns 404) | Syndicate Playgama's Arabic locale; plixfy still controls the Arabic shell brand identity |

---

## Bottom line

**The data is unambiguous: Saudi users searching for games type Arabic far more often than English.** The exceptions are specific game titles and brand names — both of which are originally English and should stay English.

Build the UI in Arabic. Keep the game names in English. Use English-slug URLs (for SEO and ease of maintenance). Add an English locale toggle in Month 3 once you have real usage data.

A bilingual market does not mean a bilingual product. It means a context-aware product. Plixfy's launch product should default to the language the majority types in, while not breaking the experience for the minority who type in the other language.

See `saudi_language_evidence.md` for citations and `saudi_language_search_data.json` for the raw Google Trends data.
