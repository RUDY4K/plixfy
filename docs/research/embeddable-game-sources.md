# Embeddable Game Sources — Master Research Report

**Date:** 2026-05-20
**Scope:** Distribution platforms, standalone .io games, open-source self-hostable games, popular named titles, multi-portal embed URLs.
**Methodology:** WebSearch → publisher-page WebFetch → HTTP header analysis (curl) → real-browser iframe probe (Playwright) for ambiguous cases. Tested from a non-allowlisted origin (`localhost:3000`), the same posture Plixfy presents.
**Disclaimer:** Some sites (1v1.lol, flyordie.io) are unreachable from the test environment — likely Saudi geo-block + bot detection. They may behave differently elsewhere. Flagged as "unreachable" rather than "blocked" where appropriate.

---

## 1 · Distribution platforms

Tier ranking: **A** = ready to use today, no friction. **B** = usable with caveats. **C** = blocked, paywalled, or impractical.

| # | Platform | Catalog | Embed mechanism | API | Rev share | Signup | Tier |
|---|---|---|---|---|---|---|---|
| 1 | **GameDistribution** (already in use) | 3,244 in our registry, 20K+ available | `https://html5.gamedistribution.com/{id}/` direct iframe | Sitemap + DGI feed | 50% | Open | **A** |
| 2 | **GameMonetize** | 36,976+ | iframe (URL pattern documented in their SDK, not on landing) | SDK + dashboard | 45% (90% if dev = publisher) | Open, no traffic floor | **A** |
| 3 | **OnlineGames.io** | 258 (verified count from feed) | Direct CDN iframe: `https://www.onlinegames.io/games/{year}/{engine}/{slug}/index.html` | **Public JSON catalog** at `/media/plugins/genGames/embed.json` (169 KB, no auth) | Their ads run in-iframe | None required — just embed | **A** |
| 4 | **Playgama** | 1,000+ | Per-game iframe with `clid` partner ID injected | "Distribution API" — JSON download of catalog. 100+ partners | Yes (dashboard) | Free signup | **A** |
| 5 | **Y8** | "Thousands" (45+ pages of `/games_for_your_website`) | `https://y8.com/embed/{slug}` (verified clean headers) | None public — iframe-only | Mentioned but rate not disclosed | Free | **A** |
| 6 | **Gamezop** | "Extensive" | Three modes: unique link `https://<id>.play.gamezop.com/g/<code>`, iframe, or API | REST `https://api.gamezop.com/v3/games` (key required) | Yes — ad rev share | Free signup | **A** |
| 7 | **Miniplay** | Large (many popular titles) | `https://www.miniplay.com/embed/{slug}` (verified — Smash Karts loaded full UI in iframe) | None public | Their ads inline | None required, but respect ToS | **B** (re-host of others' games — review licensing) |
| 8 | **GameFlare** | Hundreds | `https://www.gameflare.com/embed/{slug}/` (verified clean) | Yes — distribution platform | Yes | Free signup | **A** |
| 9 | **SilverGames** | Many | `https://www.silvergames.com/en/{slug}/iframe?t=1` (verified clean) | None public | Their ads inline | None visible | **B** (no public publisher program — uncertain ToS) |
| 10 | **RocketGames.io** | Hundreds | `https://www.rocketgames.io/embed/{slug}` — `Content-Security-Policy: frame-ancestors *` (intentionally permissive) | None public | Their ads inline | None | **B** |
| 11 | **GamePix** | 400+ to thousands | Direct play page `gamepix.com/play/{slug}` is **SAMEORIGIN-blocked**. Must use their JSON API which returns embeddable URLs | JSON API (endpoint not publicly documented; requires dashboard registration) | 45% | Dashboard signup | **B** (API required, no public docs leak) |
| 12 | **Famobi / html5games.com** | 300+ premium | `games.famobi.com/{slug}` and `html5games.com/Game/...` are header-clean | JSON feed for affiliates | Not disclosed | **🚫 Requires 50,000+ monthly visits** | **C** (gated by traffic floor — blocked for launch) |
| 13 | **CrazyGames** | 20M players | SDK for developers exposing games on `crazygames.com` — no external embed mechanism documented | None for embedding their catalog | Pays developers | Developer signup, not publisher | **C** for our use case |
| 14 | **Snokido** | Hundreds | `snokido.com/game/{slug}` → `frame-ancestors 'self'` blocked | None | — | — | **C** |
| 15 | **Kongregate** | Massive legacy + HTML5 | `/embed` suffix is **X-Frame-Options: SAMEORIGIN** | API for hosted games only | Pays devs | Developer-side | **C** for embedding from outside |
| 16 | **itch.io** | Vast indie catalog | Per-creator widget — each game opts in via dashboard. Widget links *back* to itch.io | Per-game | Per-game license | Per-game basis | **B** (case-by-case) |
| 17 | **CoolGames** | Hundreds | "For publishers" landing page exists; no public iframe URL pattern | Partnership-based | — | Contact required | **C** for self-serve |
| 18 | **Softgames** | "Largest", 10M+ MAU | White-label distribution to brands | Partnership-based | — | Contact required | **C** |
| 19 | **BoosterMedia** | 50+ countries | Partnership-based | — | — | Contact required | **C** |

### What stays "A"-tier after this audit

These six are the new distribution lanes Plixfy can add today, with no contract negotiation:

1. **OnlineGames.io** — 258 free direct-CDN iframes, public JSON, **no signup**. Iframe-verified (Highway Traffic loaded inside our test page).
2. **Y8 /embed/** — clean header, mature catalog.
3. **GameMonetize** — same pattern as GameDistribution; sign up to get the publisher feed.
4. **Playgama** — 1,000+ games, JSON download after free signup.
5. **Gamezop** — REST API at `api.gamezop.com/v3/games`.
6. **GameFlare** — `/embed/{slug}/`, clean headers; sign up for revenue share.

---

## 2 · Standalone .io games (header + iframe audit)

22 .io URLs probed beyond the original 9. Header check: missing `X-Frame-Options` and missing/permissive `frame-ancestors`.

### Tier A — header-clean, recommend after one-time iframe sanity check

| URL | Status | Genre | Notes |
|---|---|---|---|
| `paper.io` (also `paper-io.com`) | 200, clean | territory.io | Voodoo IP — official site embeddable, no Turnstile observed |
| `bonk.io` | 200, clean | physics PvP | Header-clean |
| `yohoho.io` | 200, clean | pirate battle royale | Header-clean |
| `zombsroyale.io` | 200, clean | battle royale | End Game Studios |
| `powerline.io` | 200, clean | tron snake | |
| `splix.io` | 200, clean | territory paint | |
| `hole-io.com` | 200, clean | swallow city | Voodoo IP |
| `wormate.io` | 200, clean | snake/candy | |
| `moomoo.io` | 200, clean | survival craft | |
| `deeeep.io` | 200, clean | underwater eat | |
| `mope.io` | 200, clean | animal food chain | |
| `lordz.io` | 200, clean | RTS | |
| `taming.io` | 200, clean | survival tame | |
| `florr.io` | 200, clean | bug battle | |
| `territorial.io` | 200, clean | strategy | |
| `narrow.one` | 200, clean | medieval bow PvP | |
| `ducklings.io` | 200, clean | duck race | |
| `smashkarts.io` | 200, clean | kart battle | Also via `miniplay.com/embed/smash-karts` (iframe-verified) |

### Tier C — blocked / unreachable

| URL | Verdict | Cause |
|---|---|---|
| `bloxd.io` | **Blocked** | `X-Frame-Options: SAMEORIGIN`, returns 403 to outside origins |
| `flyordie.io` | **Unreachable from SA** | TCP timeout — likely geo-block |
| `agar.io` | **Blocked** | `frame-ancestors` allowlist (crazygames, miniclip, fb only) — confirmed in prior round |
| `1v1.lol` | **Unreachable from SA** | Likely geo + bot defense |
| `diep.io` | **Soft-blocked** | Cloudflare Turnstile (`600010` sitekey mismatch) prevents Play |

⚠️ **Caveat:** Header-clean ≠ guaranteed playable. About 1 in 5 of the previously-tested header-clean games had a Cloudflare Turnstile or CMP gate that broke gameplay inside iframes. Spot-check the marquee picks (paper.io, yohoho.io, bonk.io, smashkarts.io) with a real iframe load before publishing.

---

## 3 · Multi-portal embed sources (re-publishers with permissive headers)

These aggregator portals expose `/embed/{slug}` pages with permissive frame headers — they've negotiated the licensing, you piggyback. Their ads run inside the iframe (not yours), but the iframe loads cleanly from anywhere.

| Portal | URL pattern | Verified | Catalog feel | Notes |
|---|---|---|---|---|
| **Miniplay** | `https://www.miniplay.com/embed/{slug}` | ✅ Iframe-verified (Smash Karts) | Wide — includes Subway Surfers, Crossy Road, Geometry Dash, Retro Bowl, Cut the Rope, Smash Karts, LOL Beans, Worms Zone, Madalin Stunt Cars, Drift Hunters, Fall Guys, plus many .io titles | ToS says respect game-creator licensing |
| **GameFlare** | `https://www.gameflare.com/embed/{slug}/` | ✅ Header-verified | Hundreds | Has publisher program — sign up for clean integration |
| **SilverGames** | `https://www.silvergames.com/en/{slug}/iframe?t=1` | ✅ Header-verified | Hundreds | No public publisher program — uncertain ToS for re-embedding |
| **Y8** | `https://y8.com/embed/{slug}` | ✅ Header-verified | Thousands; has separate `/games_for_your_website` publisher page | Cleanest licensing posture |
| **RocketGames** | `https://www.rocketgames.io/embed/{slug}` | ✅ Header allows (`frame-ancestors *`) | Hundreds | Iframe-by-default model |
| **OnlineGames.io direct CDN** | `https://www.onlinegames.io/games/{year}/{engine}/{slug}/index.html` | ✅ Iframe-verified (Highway Traffic) | 258 in JSON feed | Their own interstitial ads play inside the iframe |

---

## 4 · Open-source / self-hostable games

These can be **cloned into the Plixfy repo** (or hosted on our own CDN) — no third-party iframe, full control, no monetization split. Verified at the named GitHub URLs.

### MIT / permissive (drop-in ready)

| Repo | Genre | Tech |
|---|---|---|
| `gabrielecirulli/2048` | Puzzle | Vanilla JS (we have our own port already) |
| `ellisonleao/clumsy-bird` | Flappy clone | MelonJS |
| `BKcore/HexGL` | WebGL racer | Three.js (impressive 3D, real game) |
| `juliangarnier/3D-Hartwig-chess-set` | Chess | CSS 3D + JS |
| `kenrick95/c4` | Connect Four | JS with AI |
| `ondras/custom-tetris` | Puzzle | Configurable Tetris |
| `dmcinnes/HTML5-Asteroids` | Arcade | Pure JS |
| `budnix/ball-and-wall` | Arkanoid | Canvas |
| `MattSurabian/DuckHunt-JS` | Arcade | Canvas + level creator |
| `EnclaveGames/Captain-Rogers` | Arcade shooter | ImpactJS |
| `binarymax/anagramica` | Word puzzle | + API |
| `wwwtyro/Astray` | WebGL maze | Three.js, Box2DWeb |
| `Q42/0hh1` | Logic puzzle | JS |
| `AlexNisnevich/untrusted` | Puzzle/RPG | Meta-JS adventure |
| `doublespeakgames/adarkroom` | Text RPG | Very high quality, cult classic |
| `mozilla/BrowserQuest` | MMORPG | HTML5 multiplayer (server too) |
| `FreezingMoon/AncientBeast` | Strategy | Turn-based combat |
| `4site-interactive-studios/wordle-for-good` | Word | Web component — drop-in Wordle clone |

### GPL (requires source-disclosure if modified)

| Repo | Genre |
|---|---|
| `Hextris/hextris` | Puzzle (Tetris variant) — high polish |

### Discovery sources

- **leereilly/games** (archived) — 250+ games on GitHub
- **kaigani/HTML5-games-list** — curated quality bar
- **michelpereira/awesome-open-source-games** — broad collection
- **GitHub Topic: `html5-games`** — sorted by recent activity

---

## 5 · Popular named-games verdicts

The user listed 21 specific games. Verdicts and embed paths:

| Game | Verdict | Embed path |
|---|---|---|
| **Subway Surfers** | ⚠️ Poki exclusive — no public embed | Use a clone via GameDistribution if needed |
| **Temple Run** | ⚠️ Same as above | Clone via GD |
| **Crossy Road** | ⚠️ Poki exclusive | `miniplay.com/embed/crossy-road` returns 200 but **licensing-risky** for a launching brand |
| **Fruit Ninja browser** | ⚠️ Kongregate-hosted HTML5 port; `/embed` is SAMEORIGIN-blocked | Use a Famobi or GameDistribution clone |
| **Cut the Rope** | ✅ **Licensed via Famobi** as "Cut The Rope Experiments" at `famobi.com/cut-the-rope-experiments/` (200 OK, clean headers). Famobi needs 50K visits to be your channel, but the game IS on GameDistribution catalog too — search there | |
| **Geometry Dash** | 🚫 RobTop IP — "unblocked" sites are unofficial. **Don't embed**. | — |
| **Among Us** | 🚫 Innersloth IP — no official browser version. **Don't embed**. | — |
| **Fall Guys** | ✅ **LOLBeans.io** is the playable Fall Guys-style clone — `miniplay.com/embed/lolbeans-io` (header-clean) or direct at `lolbeans.io` | |
| **Flappy Bird** | ✅ Use OSS clone `ellisonleao/clumsy-bird` (MIT) — self-host on Plixfy CDN | |
| **Wordle** | ✅ Use OSS web component `4site-interactive-studios/wordle-for-good`, or clone hosted at `wordleunlimitedgame.org/embed/` | |
| **Retro Bowl** | 🚫 New Star Games IP — "unblocked" hosts are unofficial; the official school-friendly version is at `retrobowl.school` but that one is **SAMEORIGIN-blocked**. Skip. | — |
| **BitLife** | ✅ Already on **GameDistribution** at `html5.gamedistribution.com/2e44fb60fd3f4606b1b06c17a2b9d60d/` — add to your existing channel | |
| **Drift Hunters** | ✅ `miniplay.com/embed/drift-hunters` (header-clean), or `gameflare.com/embed/drift-hunters/` | |
| **Madalin Stunt Cars (1/2/3)** | ✅ `miniplay.com/embed/madalin-stunt-cars`, `gameflare.com/embed/madalin-stunt-cars-2/`, `silvergames.com/en/madalin-stunt-cars-2/iframe?t=1` — all clean | |
| **Narrow One** | ✅ Direct `narrow.one` (header-clean) | |
| **Smash Karts** | ✅ Iframe-verified: `miniplay.com/embed/smash-karts` plus direct `smashkarts.io` | |
| **LOL Beans** | ✅ See Fall Guys row | |
| **Bloxd.io** | 🚫 SAMEORIGIN-blocked | — |
| **Territorial.io** | ✅ Direct (header-clean) | |
| **Powerline.io** | ✅ Direct (header-clean) | |
| **Flyordie.io** | ❓ Unreachable from our env (likely SA geo) — re-test from your prod region | |
| **Ducklings.io** | ✅ Direct (header-clean) | |

---

## 6 · How unblocked-game sites actually source content

(Phase 4 finding.) Sites like Unblocked Games 76, classroom6x, snokido aggregate content via three channels:

1. **GameDistribution Direct Game Integration (DGI)** — copy-paste iframe of `html5.gamedistribution.com/{id}/`. This is the legitimate path.
2. **Scraping + self-hosting CDN copies** — many "unblocked" sites scrape WebGL/Unity build folders and host them on their own infrastructure (this is what `onlinegames.io/games/{year}/{engine}/{slug}/index.html` looks like). Legal grey area.
3. **iframe of /embed/ portals** — Miniplay, GameFlare, Y8 are the upstream sources for many "unblocked" listings.

**No new licensing-clean source emerged from this thread that wasn't covered above.**

---

## 7 · Recommended add order for Plixfy

### Phase A — this week, zero-friction additions

These need no new signups; ship by EOW:

1. **Add the 5 standalone .io games we already verified** (slither, shellshock, skribbl, surviv, venge) — embed URLs from the previous report.
2. **Add 8–10 marquee Miniplay /embed/ titles**: Drift Hunters, Madalin Stunt Cars 2, Smash Karts, LOL Beans, Cut the Rope, Subway Surfers (Miniplay path, with the licensing caveat below), Crossy Road, Worms Zone, Fall Guys. **Spot-check each in an iframe first** — same probe method as before. Approx category coverage: racing (3), puzzle (1), arcade (3), action (1), io (2).
3. **Add 12 header-clean standalone .io games** from §2 Tier A (paper.io, bonk.io, yohoho.io, zombsroyale.io, hole-io.com, wormate.io, moomoo.io, territorial.io, powerline.io, narrow.one, smashkarts.io, lordz.io). One sanity-iframe-check per game.

### Phase B — next sprint, sign up + integrate

4. **Plug in OnlineGames.io's public JSON feed** — fetch `embed.json` at build time in `scripts/harvest-onlinegames.mjs`; it gives you 258 instant entries with thumbnails. No auth, no signup. Highest-ROI integration in this report.
5. **Sign up for Playgama** — 1,000+ games, JSON download, partner ID auto-injected for revenue.
6. **Sign up for GameMonetize** — second 45%-rev-share lane after GameDistribution; 36K+ games doubles the catalog.

### Phase C — once you have traction

7. **Sign up for Gamezop** — REST API integration; needs a key.
8. **Add 4-5 OSS games self-hosted on the Plixfy CDN** — HexGL (3D racer), Hextris, Clumsy Bird, A Dark Room, Wordle-for-good. These become differentiators: 100% Plixfy-owned, no third-party ads, no third-party tracking, no Turnstile to worry about.
9. **Re-attempt Famobi when you hit 50K MAU** — high-quality premium catalog (Cut the Rope Experiments etc).

### Phase D — defer / skip

- **CrazyGames, Softgames, CoolGames, BoosterMedia, MarketJS** — partnership-only, not self-serve. Re-visit after launch.
- **Snokido, Kongregate, Y8 game pages (non-/embed), GamePix /play pages** — header-blocked. Use only their API where available.
- **Subway Surfers / Crossy Road / Geometry Dash / Among Us / Retro Bowl** via unofficial channels — IP risk, don't ship on a brand you're launching.

---

## 8 · Confidence levels

- **High confidence (iframe-verified or strong header signal):** OnlineGames.io feed, Miniplay /embed/, Y8 /embed/, the 18 Tier-A .io games, the 5 from the prior report, OSS GitHub games.
- **Medium confidence (header signal only, need iframe spot-check):** Bonk, Yohoho, Paper, Powerline, Territorial, Narrow, Smash Karts standalone, SilverGames/RocketGames /embed/.
- **Verdict pending (geo-affected):** flyordie.io, 1v1.lol — re-probe from your production environment.
- **Hard no:** agar.io, bloxd.io, diep.io (Turnstile), Geometry Dash, Among Us, Retro Bowl (IP risk), Snokido /game pages, Kongregate /embed.

Say the word and I'll proceed to Phase A — write the iframe sanity-check script, then add the verified games to `games/registry-embed.ts` in batches with proper categories, thumbnails, and the verified embed URL + sandbox attributes.
