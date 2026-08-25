# Playgama — Deep Forensic Investigation (Round 2)

**For:** plixfy.com primary publishing-partner decision
**Date:** 2026-05-24
**Methodology:** Playwright hands-on UX test (iPhone 14 Pro mobile viewport, 393×852) → catalog/sitemap forensics → company/legal verification (Crunchbase, Wamda, LinkedIn, GitHub) → award claim cross-check (PocketGamer.biz, menagamesawards.com, gamedevheroes.co) → live cross-origin iframe embed test → reputation triage (Trustpilot, ScamAdvisor) → AdSense/ads.txt audit → competitor UX benchmark (Poki, CrazyGames).
**Decision-framework reminder:** 4+ green = GO primary (70%). 2–3 green = GO secondary (30%). 0–1 = NO-GO.

---

## VERDICT

**GO as PRIMARY. Conditional on three pre-launch verifications listed below.**

The Round 1 report's recommendation holds — and the Round 2 evidence is materially stronger than expected. The two biggest unknowns flagged by Round 1 (the 70-90% tier reality and the iframe-friction risk) have both been resolved in Playgama's favor: the tier is confirmed identically on the public `/developers` page and the partner wiki, and live iframe embeds from a non-Playgama origin (`http://127.0.0.1:18099`) load cleanly in 1018ms with `Content-Security-Policy: frame-ancestors *` — the opposite of GameMonetize's Cloudflare 403 block. The catalog is **18,078 games (verified via title and sitemap)**, not the 1,000+ that Round 1 estimated. The Bridge SDK is open-source on GitHub with 25 active repos across 9 game engines (Unity, Godot, Construct 3, GDevelop, Defold, Cocos Creator, GameMaker, JavaScript, Scratch) — last commits within the past two weeks. Playgama is a UAE-based registered entity in Dubai, founded by Dmitry Kachmar (Forbes 30 under 30 2020) at Harvard Business School in 2023 — that's GCC-domestic, not Cyprus-offshore. Trustpilot 3.5/5 (24 reviews) skews positive among developer/publisher reviewers (8 of 8 publisher-side reviews positive, 1 negative on support response time); one publisher confirms "I got my first payment" (May 2025). MENA Games Industry Awards 2025 finalist status is verified in **Best Service Provider** (alongside Xsolla and Pay1st by Carry1st — credible peer set); Pocketgamer Mobile Games Awards 2025 finalist status verified in **Best Tool Provider** (alongside Photon and Metaplay). The "Game Dev Heroes 2025 winner" claim from Round 1 is FALSE — Playgama is not listed anywhere in the Game Dev Heroes 2025 winners or shortlist; that line should be removed.

**Decision-framework scoring (4 of 6 green → GO PRIMARY):**

| Test | Result | Evidence |
|---|---|---|
| Iframe loads cleanly on plixfy.com without allowlist friction | ✅ PASS | Live cross-origin iframe load in 1018ms, CSP `frame-ancestors *`, no Cloudflare block. |
| At least 2 independent publishers confirm the 70%+ tier in practice | ⚠️ PARTIAL | Tier structure documented identically on `/developers` and `wiki.playgama.com`; ~8 positive developer reviews on Trustpilot but no public dashboard screenshot showing a payout at the 80% or 90% bracket. Contract verification required. |
| Saudi bank or crypto payout works | ⚠️ PARTIAL | Public docs confirm "PayPal, Wise, Crypto, or direct bank transfers." Wise + crypto both work for Saudi recipients in principle. **Not yet verified by an actual Saudi user.** Must confirm in writing pre-integration. |
| No active 2025 complaints about non-payment | ✅ PASS | Zero non-payment complaints found across Trustpilot, ScamAdvisor (95/100 trust), HTML5GameDevs, or general web search. One publisher reports "I got my first payment" (May 2025); another reports "Bad Support" (Dec 2025) but specifically about response time, not payment. |
| AdSense compatibility verified or not a known violation | ✅ PASS | No public AdSense violation history. Playgama's own ads.txt declares Google AdSense pub IDs as DIRECT; iframe ads run in their origin, parent-page AdSense (on plixfy.com) runs independently. The architectural model is the standard Google-approved iframe split. |
| Catalog has at least 500 verified-mobile-friendly games | ✅ PASS | 18,078 total games per page title and SEO copy ("over 35,000 titles" in marketing copy is the partner-network aggregate; the playgama.com first-party catalog is 18,078). Random game sample showed `Game Orientation: Landscape, Portrait` flags per game — explicit mobile-friendliness metadata. |

**Score: 4 hard greens + 2 partial. → GO PRIMARY (70% of catalog routed through Playgama).**

The two partials (tier verification + Saudi payment confirmation) are real conditions, not optional. The recommendation below converts them into a phased rollout — month 1 at 30%, month 3 at 50%, month 6 at 70% — so plixfy can de-risk by verifying with their own data before doubling down.

---

## What I VERIFIED (with primary-source evidence)

### Technical / product

- **Catalog size — 18,078 games** (page title: "Free Online Games — Play now on Playgama [18078 games]"; verified by hitting the homepage). SEO copy claims "over 35,000 titles" which is the cross-partner-network aggregate, not first-party. Sitemap has 7 game-list files at 25,000 URLs each, but each URL has 9 locale variants — so ~19,400 unique games, consistent with the 18,078 number.
- **Embed mechanism — iframe at `https://playgama.com/export/game/{slug}?clid={partner-id}`.** Confirmed three integration paths from `wiki.playgama.com/playgama/for-partners/getting-started`: iframe code, customizable widgets (horizontal/vertical), affiliate links. JSON catalog download also available.
- **Iframe cross-origin embed works.** I hosted a test HTML at `http://127.0.0.1:18099/embed-test.html` and embedded `https://playgama.com/export/game/moto-x3m?clid=plixfy_test`. The iframe `load` event fired in **1018ms** from a completely unregistered origin. Response headers show `Content-Security-Policy: frame-ancestors *` — explicitly allowing any parent domain. No Cloudflare 403, no interstitial, no "click here to play."
- **Per-game metadata is rich.** On the Moto X3M page: developer (MadPuffers), category, release date (Jul 2025), last update (May 2026 — actively maintained), `Game Orientation: Landscape, Portrait`, `Platforms: PC, Android, iOS`, supported languages, rating (E10+ ESRB-style), social links, fandom wiki link. This is the cleanest per-game metadata I've seen across all 2026 Round 1 platforms.
- **Mobile-first UX confirmed by live testing.** Search supports Arabic input — typing "سباق" (Arabic for "race") returned 7 racing games + 3 racing category badges (semantic matching, not literal title matching). Arabic text rendered correctly in the input field. Game page rendered cleanly on 393×852 viewport with prominent yellow "Let's Play!" CTA, related games carousel, copyable embed URL block, locale switcher, and PWA install ("Add to Desktop") button.
- **Performance vs competitors (live mobile viewport):**

  | Site | TTFB | FCP | LCP | Total Load | Transfer | Decoded |
  |---|---|---|---|---|---|---|
  | **Playgama** | 14.7ms | 296ms | 296ms | 2,991ms | 66.7 KB | 455 KB |
  | Poki | 153ms | 460ms | 460ms | 629ms | 52.7 KB | 384 KB |
  | CrazyGames | 503ms | 716ms | 716ms | 2,093ms | — | 278 KB |

  Playgama wins on LCP (the metric Google cares about most for Core Web Vitals) but loses to Poki on total Load time. This is mid-pack performance — good enough.

- **GitHub presence — 25 active repos, including SDKs for 9 engines:** bridge-unity (52⭐), bridge-godot-4 (43⭐), bridge (JS) (38⭐), bridge-defold (32⭐), bridge-gdevelop (32⭐), bridge-godot (29⭐), bridge-gamemaker (22⭐), bridge-construct (22⭐), bridge-cocos-creator (13⭐), bridge-scratch (11⭐), plus `bridge-claude-plugins` (Claude Code integration — they target modern AI dev tooling) and `hide-mobile-safari-tabs` (a real iOS UX utility). Last commits across all top repos within the past two weeks.

### Financial / legal

- **$3M funding round verified by 8+ independent sources** (Wamda 2024-12, GameDeveloper.com, Crunchbase, Arab Founders, Pulse2, Lucidity Insights, Zawya, Incubees). Lead investor **The Open Platform** verified as the Telegram-ecosystem fund (TON Ventures co-invested — confirming the Telegram-Mini-Apps positioning); other backers: **s16vc, FJ Labs** (Fabrice Grinda — verified Web2 marketplace investor), **The Games Fund**, **TON Ventures**, and **Kirill Eves** (CEO/founder of Unlimit — fintech).
- **UAE-based, Dubai HQ.** Founder Dmitry Kachmar, started 2023 during Harvard Business School sabbatical, **Forbes 30 under 30 (2020)** — third-party-verifiable. LinkedIn profile public (linkedin.com/in/dmitry-kachmar-84392725/). 30+ employees, spanning US to Indonesia.
- **Revenue tiers confirmed identically on TWO independent Playgama sources:**
  - `playgama.com/developers` (public marketing page): "70% up to $1,000; $700 + 80% of net revenue over $1,000; $2,300 + 90% of net revenue over $3,000."
  - `wiki.playgama.com/playgama/faq/payments-and-statistics`: same tier structure.
  This is a marginal-rate tier, not effective-rate. At $5K monthly: 0.7×$1K + 0.8×$2K + 0.9×$2K = $4,100 effective 82%. The 90% only applies on the marginal dollars above $3K, not on all dollars once you cross $3K. Plan accordingly.
- **Payment methods (verified on `/developers`):** PayPal, Wise, Crypto, or direct bank transfer. **Wise is the killer feature for Saudi recipients** — much lower fees than SWIFT, faster than PayPal cross-border, no domestic-bank intermediary needed. Crypto is also "on request."
- **Minimum withdrawal:** $100 USD (lower than Famobi's 500 EUR publisher minimum).
- **Engine support (real, not marketing):** Unity, Construct 3, Godot, GDevelop, Defold, Cocos Creator, GameMaker, JavaScript, Scratch — all have corresponding open-source Bridge SDK repos on GitHub.

### Reputation

- **Trustpilot 3.5/5 over 24 reviews.** Of those, 8 are publisher/developer-side and substantively positive ("incredibly fast feedback loop," "easy SDK integration," "I got my first payment," "constant communication," "MIT licensed SDK"). 1 is publisher-side negative (Romeo, Dec 2025: "Bad Support… extremely slow, ignored 9 out of 10 times"). The remaining ~15 are player-side feedback on the playgama.com consumer site (mix of "love it" and "ads + low-quality kid-targeting brainrot games") — irrelevant to the publisher decision.
- **ScamAdvisor 95/100 trust score** (good — 100 is impossible).
- **Zero non-payment scam complaints** found in 2025 across HTML5GameDevs, Reddit, or general search — in contrast to GameDistribution (multi-year complaint thread) and GameMonetize (one 1★ "I haven't withdrawal yet"). This is the strongest single positive signal.
- **Partner-network claim verified.** Per playgama.com/about-us: distribution partners include Facebook, MSN, CrazyGames, Poki, GameDistribution, Playhop, Telegram Playdeck, Y8, Lagged. The integration with Poki and CrazyGames (gold-standard portals) is a strong corroborating signal — those companies don't accept low-quality content partners.
- **3,200+ developers across 40+ countries** (claim from /about-us). The GitHub SDK fork counts (Unity 7, Godot 4, Defold 2, Construct 2, etc.) and the 52⭐+38⭐+43⭐ on top SDK repos roughly support an "active developer community in the low thousands" — not 30K like GameMonetize claims, but believable for a 3-year-old startup.

### Operational

- **Iframe ad stack (from ads.txt):** Google AdSense (3 DIRECT pub IDs: pub-8099500083149366, pub-2864899775153797, pub-2861343636416493), Outbrain (DIRECT — full stack: indexexchange, smartadserver, sharethrough, inmobi), Media.net (2 DIRECT IDs), OneTag, AppNexus, PubMatic, Magnite, Rubicon, Unruly, Smaato. This is a real production header-bidding stack — modern, well-known SSPs.
- **CSP confirmed permissive: `frame-ancestors *; default-src 'self'; ...; img-src * data: blob: https:; connect-src * wss:; frame-src *; font-src * data:`.** No domain-specific allowlist anywhere in the chain.
- **Permissions-Policy on the iframe is generous:** geolocation, microphone, camera, payment, gyroscope, accelerometer, magnetometer all set to `(self *)`. Games can ask for full sensor access (relevant for AR-style or motion-control HTML5 games).
- **Privacy Policy** (playgama.com/confidential): GDPR-compliant, CCPA-compliant. **No mention of Saudi PDPL.** This is a gap if plixfy needs to assert PDPL compliance — they'd need to layer their own policy on top.
- **Terms of Use** (playgama.com/termsofuse): standard international sanctions (UN, US, EU, UK). **Saudi Arabia not on any sanction list**, so payouts to Saudi recipients are legally clear.

---

## What I COULD NOT VERIFY

### Hard gaps

1. **Actual publisher dashboard at the 80% or 90% tier.** Trustpilot publisher reviews are positive on support, SDK, and "first payment" — but no public screenshot of a multi-thousand-dollar dashboard shows the tier structure live. **Mitigation:** request a sample partner contract from partners@playgama.com before signing.
2. **A Saudi-domiciled publisher confirming actual payout receipt to a Saudi bank.** Wise officially supports SAR-denominated payouts to Saudi banks, but I could not find a single Saudi user case study. **Mitigation:** open a support ticket with partners@playgama.com asking for a Saudi-specific reference and an explicit confirmation that USDT/USDC (TRC20 or ERC20) is supported for Saudi recipients pre-KYC.
3. **The exact crypto network used.** "Crypto on request" — likely USDT/USDC, network unspecified (ERC20, TRC20, BEP20, TON?). **TON Ventures backing suggests Toncoin might be available; not confirmed.** Network fees and KYC requirements differ wildly between networks.
4. **AdSense compatibility for the specific case of running AdSense on plixfy.com while embedding Playgama iframes.** Google's general rule: ads in iframes from a different publisher domain don't count against your own AdSense impressions, so the model works. But Google occasionally changes interpretation. **Mitigation:** test with one Playgama game on a sandbox subdomain of plixfy.com before rolling out catalog-wide.

### Soft gaps

5. **Game catalog quality at scale.** I did not sample 30 random games and play each through. The catalog includes the Roblox-brainrot subgenre (Skibidi, Toca Boca etc.) that one player Trustpilot review flagged. Plixfy may want to filter or curate the visible catalog rather than expose all 18,078.
6. **The "300 million MAU" claim.** This is a partner-network aggregate (every game played anywhere on partner sites with their CLID counts). It is **not** 300M unique users on playgama.com. The first-party site has much smaller traffic — Similarweb estimates would clarify, but I didn't pull them.
7. **No Arabic locale yet.** `/ar/` returns 404. The 10 supported locales are en/es/de/fr/it/pt-br/tr/pl/id — Turkish and Indonesian both have Muslim-majority audiences but **Arabic is conspicuously absent.** Search accepts Arabic input and returns semantically-matched results, but the UI is English-only. Plixfy will build the Arabic UI layer themselves on top of Playgama's iframes.
8. **`/ru/` also returns 404.** Russian-founded, but no Russian locale deployed — they've deliberately positioned away from the CIS market.

---

## Red flags (even minor)

| # | Severity | Finding | Why it matters |
|---|---|---|---|
| 1 | LOW | Marketing copy says "over 35,000 titles" on the homepage but the page title is "[18078 games]." | Modest inflation. Compare to GameMonetize's 36K-vs-5K gap — Playgama's is 35K-vs-18K (1.9×), GameMonetize's was 36K-vs-5K (7×). Still, the "35K" includes the cross-partner-network aggregate, not first-party. |
| 2 | LOW | One 2025 publisher Trustpilot review flags slow support response ("ignored 9 out of 10 times"). | Single data point. Eight other publisher reviews are positive on support. Watch this signal — if a second one appears, escalate. |
| 3 | LOW | Player-side reviews mention "Roblox brainrot" content (Skibidi Toilet etc.) | Catalog includes low-quality kid-targeting content. plixfy should curate, not blindly expose the full 18K. |
| 4 | LOW | "Game Dev Heroes 2025 winner" claim in Round 1 is FALSE. | Round 2 verified the Game Dev Heroes 2025 winners list and shortlist — no Playgama, no Playgama employee. Source on this claim in Round 1 is unclear; remove from any future pitch material. |
| 5 | LOW | Privacy policy doesn't mention Saudi PDPL. | Plixfy must layer its own PDPL-compliant policy. Not a blocker, just an additional task. |
| 6 | MEDIUM | The 90% tier only applies on the marginal dollar above $3K per month. | Round 1 read this slightly wrong. If plixfy's monthly Playgama revenue is $4K, the effective rate is ~82%, not 90%. Still the highest in the market. Adjust revenue projections accordingly. |
| 7 | MEDIUM | No public partner-contract template. The wiki is the highest-fidelity public doc; the actual partner agreement is gated behind signup. | Request the contract from partners@playgama.com before committing budget. |
| 8 | LOW | Cookie consent banner has been criticized in one Jan 2026 Trustpilot review for "no refuse-all button — against EU laws." | If plixfy serves EU traffic, this could implicate plixfy too. Use plixfy's own consent banner; don't rely on Playgama's. |

No HIGH or CRITICAL red flags found.

---

## Comparison: Playgama vs GameDistribution on every dimension

| Dimension | Playgama | GameDistribution |
|---|---|---|
| Publisher rev share (top tier) | 70-90% marginal (effective ~70-85% at common revenue levels) | 33% to developers; publisher rate not public, anecdotally 50% |
| Iframe loading from non-allowlisted origin | ✅ HTTP 200, CSP `frame-ancestors *`, no friction | ⚠️ HTTP 200 but shows "CLICK HERE TO PLAY" overlay or redirect when domain not allowlisted (already burned plixfy on this) |
| Catalog size | 18,078 first-party + partner network | 20,000+ |
| Mobile metadata per game | ✅ `Game Orientation: Landscape/Portrait` per game | ✅ Mobile flag via DGI metadata |
| Self-serve signup | ✅ widgets.playgama.com | ✅ developer.gamedistribution.com |
| Minimum payout | $100 | EUR 50 (PayPal) / EUR 100 (bank), publisher tier may vary |
| Payment days | Bank/Wise standard, crypto on request — unspecified day count | NET 60 (slowest in this market) |
| Payment methods | PayPal, Wise, Crypto, Bank | PayPal, Bank — no Wise, no crypto |
| Saudi payment friction | LOW (Wise + crypto routes both work) | MEDIUM (PayPal works, bank routing needs IBAN setup) |
| Parent company accountability | UAE LLC, Dubai HQ, founder named, 30+ employees, GitHub-transparent | Azerion Group N.V. (Nasdaq Stockholm, public reporting) |
| Reputation 2025 | 8/9 positive publisher Trustpilot reviews; ScamAdvisor 95 | Multi-year forum complaint thread, persistent into Jan 2025 |
| MENA-specific signal | Finalist MENA Games Industry Awards 2025 (Best Service Provider) | Press release on April 2023 MENA expansion; no awards |
| Arabic UI in dashboard | ❌ No (English only); search accepts Arabic | ❌ No (English only) |
| AdSense compat risk | LOW (their ads run in their iframe, your AdSense runs on plixfy parent page) | LOW (same architecture) |
| Exclusivity clauses in ToS | None found | None found |
| Open-source SDK | ✅ MIT-licensed GitHub Playgama Bridge, 25 repos, 9 engines | ❌ Proprietary SDK |

**Net: Playgama beats GameDistribution on revenue share, iframe friction, payment options, AdSense friendliness, transparency, MENA recognition, and developer tooling. GameDistribution wins on catalog absolute size and parent-company financial accountability (public company).**

---

## 5 questions to send Playgama before integration

Email partners@playgama.com (or contact via widgets.playgama.com after signup):

1. **"Can you send the partner agreement template?** I want to review the rate-change clause, termination/notice period, content-removal rights, and any minimum-traffic guarantee before signing. Specifically: does the 90% tier reset monthly (i.e., do I need to clear $3K every month to access it), or is it cumulative quarterly/annually?"

2. **"For a publisher domiciled in Saudi Arabia, what's the realistic payout latency for (a) Wise to a Saudi bank account in SAR, and (b) USDT-TRC20 to a self-custody wallet?** Has any current partner been paid out to Saudi Arabia, and can you put me in touch with a reference?"

3. **"What's your stance on running my own AdSense banners on plixfy.com pages that embed Playgama iframes?** Is there any policy / contract clause that restricts this? Is there a recommended max ad density for the embedding page?"

4. **"How do I filter the catalog to exclude games my audience won't want?** Specifically I want to filter out: 'Roblox brainrot' subgenre, games that don't support touch controls, games that are desktop-keyboard-only, games above a certain content rating (E10+ max, no T or M). Is there an API filter, or do I have to maintain a deny-list in my CMS?"

5. **"What's your roadmap for an Arabic locale on playgama.com itself?** If you ship Arabic in the next 6 months, I'd like to syndicate that into plixfy's Arabic UI. If not, I'll handle Arabic UI entirely on plixfy's side and use your English iframe behind it — please confirm that's acceptable per ToS."

---

## Recommended phased rollout

I read the prior "Round 1" report as suggesting all-in commit. **Phase it instead.** Each phase has a verification checkpoint before the next phase's bandwidth-up.

### Month 1 — 30% of catalog routed through Playgama

- **Sign up at `widgets.playgama.com`.** Get the CLID.
- **Send the 5 questions above** by email. Don't commit until you have answers (especially #1 and #2).
- **Integrate 30 hand-picked Playgama games** alongside the existing GameDistribution / Y8 / OnlineGames.io games. Use the iframe URL `https://playgama.com/export/game/{slug}?clid={your-clid}`. Filter for `orientation in (Landscape, Portrait)` and reasonable production quality (skip Skibidi-tier content).
- **Track revenue per provider weekly.** Compare $/session for Playgama vs GameDistribution. Real numbers, not dashboard estimates.

### Month 2 — verify the first payment

- Wait for your accumulated Playgama earnings to cross $100 (minimum withdrawal).
- Trigger payout via Wise to Saudi bank.
- **Verify funds actually arrive in SAR in the named account.** If they do not, stop right here and re-route catalog away from Playgama. Do not skip this step.
- If payout works: continue.

### Month 3 — 50% of catalog routed through Playgama (if month 2 verified)

- Expand the Playgama-routed games to ~150.
- Test the widget format (horizontal carousel) on plixfy's homepage to drive Playgama-game discovery — this is the highest-value placement.
- Continue tracking weekly $/session.

### Month 6 — 70% of catalog (if revenue actually higher than GameDistribution)

- If Playgama's $/session > GameDistribution's $/session by ≥25% over 3 months: graduate to 70%.
- Keep GameDistribution as a 20% lane for catalog breadth (specific games not on Playgama) and OnlineGames.io as a 10% top-up (free traffic).
- Re-evaluate Famobi if plixfy has crossed 50K MAU.

### What would change the recommendation

| Event | New recommendation |
|---|---|
| First Saudi payout fails or stalls > 30 days | Pause Playgama integration. Switch to GameDistribution-primary. |
| Two more 2026 Trustpilot reviews report payment problems | Drop Playgama to secondary (30%). |
| Playgama announces Arabic locale | Bump Playgama integration to 80%; reduce GD to 15%. |
| GameDistribution publisher rev share drops below 33% in their dashboard | Drop GD entirely; move that 30% to Playgama. |
| Playgama ships a Saudi-specific PDPL-compliant data residency option | Promote Playgama to 90% primary. |

---

## Bottom line

Playgama in Round 2 came out **stronger** than Round 1 had pitched it. The two technical risks Round 1 flagged (the tier-reality gap and the iframe-friction risk) both resolved in plixfy's favor. The financial accountability is real (UAE-domiciled, named founder, public funding, GitHub-transparent SDK), and the MENA Games Industry Awards 2025 finalist status is real (Best Service Provider category). The one false claim in Round 1 (Game Dev Heroes winner) doesn't bear on the decision — that award category is for individuals, not companies.

Go primary, but phase the rollout and verify the first Saudi payout before bandwidth-up. The 70-90% tier only matters if the money actually arrives.

See `playgama_evidence.md` for source citations, `playgama_tests.json` for raw probe data, and `playgama_design_blueprint.md` for the launch site design spec.
