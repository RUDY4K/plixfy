import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

test("home copy uses the live catalog count instead of a stale number", () => {
  const games = JSON.parse(read("src/data/playgama-games.json"));
  const catalogMeta = JSON.parse(read("src/data/playgama-catalog-meta.json"));
  const dictionary = read("src/lib/i18n.ts");
  const homePage = read("src/app/[locale]/page.tsx");
  const evergreenCopy = read("src/lib/siteContent.ts");
  const socialGuide = read("docs/SOCIAL-MEDIA-AR.md");

  assert.ok(Array.isArray(games) && games.length >= 2_000);
  assert.equal(catalogMeta.gameCount, games.length);
  assert.equal(catalogMeta.source, "playgama");
  assert.match(dictionary, /\{count\}/);
  assert.match(homePage, /replace\("\{count\}"/);
  assert.doesNotMatch(dictionary, /(?:أكثر من|more than)\s+380/i);
  assert.doesNotMatch(homePage, /(?:أكثر من|more than)\\s\+380/i);
  assert.doesNotMatch(evergreenCopy, /\b380\b/);
  assert.doesNotMatch(socialGuide, /\+370\b/);
});

test("mobile RTL layout cannot widen beyond the device viewport", () => {
  const homePage = read("src/app/[locale]/page.tsx");
  const globalStyles = read("src/app/globals.css");
  const installPrompt = read("src/components/InstallAppPrompt.tsx");

  assert.match(homePage, /lg:grid-cols-\[minmax\(0,1\.05fr\)_minmax\(0,1\.45fr\)\]/);
  assert.match(homePage, /<aside className="min-w-0">/);
  assert.match(homePage, /grid grid-cols-\[minmax\(0,1fr\)\] gap-3 sm:grid-cols-2/);
  assert.match(homePage, /group flex min-w-0 items-center gap-3/);
  assert.match(globalStyles, /html \{[\s\S]*?max-width: 100%;[\s\S]*?overflow-x: clip;/);
  assert.match(globalStyles, /body \{[\s\S]*?max-width: 100%;[\s\S]*?overflow-x: clip;/);
  assert.match(installPrompt, /max-w-\[calc\(100vw-1\.5rem\)\]/);
  assert.match(installPrompt, /relative mx-auto w-full max-w-md overflow-hidden/);
});

test("mobile game exits stay compact and above install prompts in every orientation", () => {
  const gameFrame = read("src/components/GameFrame.tsx");
  const launchPage = read("src/app/[locale]/play/[slug]/launch/page.tsx");
  const layout = read("src/app/[locale]/layout.tsx");

  assert.match(gameFrame, /title=\{locale === "ar" \? "خروج" : "Exit"\}/);
  assert.match(gameFrame, /inline-flex h-11 w-11 shrink-0/);
  assert.doesNotMatch(gameFrame, /<span>\{t\.gameFrame\.exitFullscreen\}<\/span>/);
  assert.match(launchPage, /data-game-exit[\s\S]{0,160}inline-flex h-11 w-11 shrink-0/);
  assert.doesNotMatch(launchPage, /<span>\{exitLabel\}<\/span>/);
  assert.match(
    layout,
    /<BottomNav \/>[\s\S]{0,120}<ConsentBanner \/>[\s\S]{0,120}<InstallAppPrompt locale=\{locale\} \/>/,
  );
});

test("Roblox-style mobile games lead daily, trending, and top discovery", () => {
  const games = read("src/lib/games.ts");
  const gameStats = read("src/lib/gameStats.ts");
  const homePage = read("src/app/[locale]/page.tsx");

  for (const signal of ["obby", "multiplayer", "tycoon", "parkour", "simulation", '"3d"', '"co-op"']) {
    assert.match(games, new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(games, /export function getRobloxStyleScore/);
  assert.match(games, /export function getRobloxStyleGames/);
  assert.match(games, /game\.supportedDevices !== "desktop-only"/);
  assert.match(games, /const priority = getRobloxStyleGames/);
  assert.match(gameStats, /getRobloxStyleGames\(\)\.slice\(0, 40\)/);
  assert.doesNotMatch(gameStats, /game\.badge === "top"/);
  assert.match(homePage, /قريبة من أجواء Roblox/);
  assert.match(homePage, /Roblox-like feel/);
});

test("catalog freshness and visible years stay data-driven", () => {
  const sitemap = read("src/app/sitemap.ts");
  const sync = read("scripts/sync-playgama-catalog.mjs");
  const categoryPage = read("src/app/[locale]/category/[slug]/page.tsx");
  const footer = read("src/components/Footer.tsx");

  assert.match(sitemap, /new Date\(catalogMeta\.syncedAt\)/);
  assert.doesNotMatch(sitemap, /GAME_CATALOG_LAST_MODIFIED = new Date\("20/);
  assert.match(sync, /playgama-catalog-meta\.json/);
  assert.match(categoryPage, /const YEAR = new Date\(\)\.getFullYear\(\)/);
  assert.match(footer, /replace\("\{year\}"/);
});

test("automated Arabic news posts use canonical root-locale URLs", () => {
  const runner = read("scripts/cloud-social-runner.mjs");
  assert.match(runner, /\$\{SITE\}\/news\/\$\{encodeURIComponent\(news\.slug\)\}/);
  assert.doesNotMatch(runner, /\$\{SITE\}\/ar\/news\//);
});

test("continuous social automation publishes measurable gaming news only", () => {
  const runner = read("scripts/cloud-social-runner.mjs");
  const workflow = read(".github/workflows/cloud-social.yml");
  const contentWorkflow = read(".github/workflows/content-engine.yml");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(runner, /campaign: "ar_gaming_news_24h_v1"/);
  assert.match(runner, /cleanContentId\(`news-\$\{news\.slug\}`\)/);
  assert.match(runner, /slot: "news"/);
  assert.match(runner, /games: \[\]/);
  assert.match(runner, /No unpublished gaming news/);
  assert.match(runner, /MIN_NEWS_INTERVAL_MS = 90 \* 60 \* 1000/);
  assert.match(runner, /MAX_NEWS_SILENCE_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(runner, /No public news post was recorded for 24 hours/);
  assert.doesNotMatch(runner, /platform: "tiktok"/);
  assert.match(workflow, /cron: "25,55 \* \* \* \*"/);
  assert.doesNotMatch(workflow, /slot=(?:morning|evening)/);
  assert.match(contentWorkflow, /cron: "5 \* \* \* \*"/);
  assert.match(packageJson.scripts["social:preflight"], /--dry-run.*--slot=news/);
  assert.match(packageJson.scripts["social:preflight"], /--offline/);
  assert.doesNotMatch(packageJson.scripts["social:preflight:live"], /--offline/);
  assert.match(packageJson.scripts["social:preflight:live"], /--live-read/);
});

test("gaming news comes from multiple current sources and preserves source time", () => {
  const updater = read("scripts/update-news.mjs");

  for (const source of ["GameSpot", "Eurogamer", "PlayStation Blog", "Xbox Wire", "Gematsu", "VGC"]) {
    assert.match(updater, new RegExp(`name: "${source}"`));
  }
  assert.match(updater, /sourcePublishedAt:/);
  assert.match(updater, /sort\(\(a, b\) => \(Date\.parse\(b\.pubDate\)/);
});

test("IndexNow mirrors the sitemap or submits only reviewed recent news", () => {
  const submitter = read("scripts/submit-indexnow.mjs");
  const workflow = read(".github/workflows/indexnow.yml");

  assert.match(submitter, /sitemap\.xml/);
  assert.match(submitter, /news-editorial\.json/);
  assert.match(submitter, /review\?\.searchEligible !== true/);
  assert.match(submitter, /args\.has\("--recent-news"\)/);
  assert.match(workflow, /submit-indexnow\.mjs --all/);
});

test("English category pages include original editorial guidance", () => {
  const content = read("src/lib/categoryContent.ts");
  const categoryPage = read("src/app/[locale]/category/[slug]/page.tsx");

  assert.match(content, /export const categoryContentEn/);
  assert.match(categoryPage, /locale === "ar" \? categoryContent : categoryContentEn/);
  for (const slug of ["racing", "action", "puzzle", "io", "girls", "casual", "sports", "shooting"]) {
    assert.match(content, new RegExp(`\\n  ${slug}: \\{`, "g"));
  }
});

test("Arabic category guidance avoids unsupported safety and gameplay claims", () => {
  const content = read("src/lib/categoryContent.ts");
  const arabicContent = content.split("export const categoryContentEn")[0];

  for (const unsupportedClaim of [
    /آمنة 100%/,
    /مجانية بنسبة 100%/,
    /يحفظ تقدّمك تلقائياً/,
    /آلاف اللاعبين/,
    /لاعبين من السعودية والخليج/,
    /زمن استجابة منخفض/,
  ]) {
    assert.doesNotMatch(arabicContent, unsupportedClaim);
  }

  assert.match(arabicContent, /تحقق من طريقة التحكم والجهاز المدعوم/);
  assert.match(arabicContent, /يُفضّل أن يراجع أحد الوالدين اللعبة/);
});

test("player data sync reads the latest local values after auth resolves", () => {
  const provider = read("src/components/PlayerDataProvider.tsx");

  assert.match(
    provider,
    /void syncCloudData\(user, readFavorites\(\), readRecent\(\)\)/,
  );
  assert.doesNotMatch(
    provider,
    /syncCloudData\(data\.user, localFavorites, localRecent\)/,
  );
});

test("game artwork uses responsive Next image optimization for the catalog host", () => {
  const config = read("next.config.ts");
  const artwork = read("src/components/GameArtwork.tsx");
  const brandLogo = read("src/components/BrandLogo.tsx");
  const homePage = read("src/app/[locale]/page.tsx");
  const playPage = read("src/app/[locale]/play/[slug]/page.tsx");
  const gameFrame = read("src/components/GameFrame.tsx");

  assert.match(config, /hostname: "static\.playgama\.com"/);
  assert.match(config, /pathname: "\/p-img\/\*\*"/);
  assert.doesNotMatch(config, /hostname: "\*\*\.playgama\.com"/);
  assert.match(artwork, /unoptimized=\{attempt\.direct\}/);
  assert.match(artwork, /if \(!attempt\.direct\)/);
  assert.match(artwork, /setAttempt\(\{ src: attempt\.src, direct: true \}\)/);
  assert.match(artwork, /setAttempt\(\{ src: fallbackSrc, direct: false \}\)/);
  assert.match(homePage, /<GameArtwork[^>]+\bpreload\b/);
  assert.match(gameFrame, /<GameArtwork[\s\S]{0,300}\bpreload\b/);
  assert.doesNotMatch(homePage, /<GameArtwork[^>]+\bpriority\b/);
  assert.match(config, /hostname: "static\.playgama\.com"/);
  assert.match(read("src/app/[locale]/layout.tsx"), /rel="preconnect" href="https:\/\/static\.playgama\.com"/);
  const gameCard = read("src/components/GameCard.tsx");
  assert.match(gameCard, /imageSizes\?: string/);
  assert.match(gameCard, /sizes=\{imageSizes\}/);
  assert.match(gameCard, /\(max-width: 767px\) 50vw/);
  assert.match(homePage, /\(max-width: 767px\) 33vw/);
  assert.match(read("src/components/CategoryStrip.tsx"), /\(max-width: 767px\) 142px, 104px/);
  assert.match(playPage, /imageSizes="130px"/);
  assert.match(playPage, /\(max-width: 1279px\) 14vw, 180px/);
  assert.match(brandLogo, /sizes="40px"/);
  assert.match(brandLogo, /loading="lazy"/);
  assert.match(brandLogo, /unoptimized=\{direct\}/);
  assert.doesNotMatch(read("src/components/Header.tsx"), /<BrandLogo locale=\{locale\} eager \/>/);
});

test("keyboard and screen-reader users keep context through gates and game loading", () => {
  const layout = read("src/app/[locale]/layout.tsx");
  const ageGate = read("src/components/AgeGate.tsx");
  const gameFrame = read("src/components/GameFrame.tsx");
  const gameCard = read("src/components/GameCard.tsx");

  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(ageGate, /<dialog/);
  assert.match(ageGate, /showModal\(\)/);
  assert.match(ageGate, /onKeyDown=\{trapFocus\}/);
  assert.match(ageGate, /aria-describedby="age-gate-description"/);
  assert.match(gameFrame, /role="status"/);
  assert.match(gameFrame, /setStatusMessage\(t\.gameFrame\.ready\)/);
  assert.match(gameFrame, /startButtonRef\.current\?\.focus\(\)/);
  assert.match(gameFrame, /<a[\s\S]{0,160}ref=\{startButtonRef\}[\s\S]{0,160}href=\{launchHref\}/);
  assert.match(gameFrame, /event\.preventDefault\(\);[\s\S]{0,80}start\(\);/);
  assert.doesNotMatch(gameFrame, /ref=\{startButtonRef\}[\s\S]{0,120}onClick=\{stop\}/);
  assert.match(gameCard, /alt=""/);
  assert.match(read("src/components/GameArtwork.tsx"), /alt \? \{ role: "img"/);
});

test("mobile games use an iPhone-safe full-viewport layer with an in-game exit", () => {
  const gameFrame = read("src/components/GameFrame.tsx");

  assert.match(gameFrame, /window\.visualViewport/);
  assert.match(gameFrame, /height: mobileViewport \? `\$\{mobileViewport\.height\}px` : "100dvh"/);
  assert.match(gameFrame, /env\(safe-area-inset-top\)/);
  assert.match(gameFrame, /env\(safe-area-inset-bottom\)/);
  assert.match(gameFrame, /calc\(env\(safe-area-inset-top\) \+ 3\.5rem\)/);
  assert.match(gameFrame, /aria-label=\{t\.gameFrame\.exitFullscreen\}/);
  assert.match(gameFrame, /frame\.requestFullscreen/);
  assert.match(gameFrame, /allowFullScreen/);
  assert.match(gameFrame, /onClick=\{stop\}/);
  assert.match(gameFrame, /setMobileExpanded\(false\)/);
  assert.match(gameFrame, /body\.style\.overflow = "hidden"/);
});

test("crawlers can render Next.js assets and pagination has distinct canonical URLs", () => {
  const robots = read("src/app/robots.ts");
  const categoryPage = read("src/app/[locale]/category/[slug]/page.tsx");

  assert.doesNotMatch(robots, /\/_next\//);
  assert.match(categoryPage, /const pageSuffix = currentPage > 1/);
  assert.match(categoryPage, /const path = "\/category\/" \+ slug \+ pageSuffix/);
  assert.match(categoryPage, /requestedPage > totalPages/);
});

test("analytics consent does not consume once-only events and acceptance reports the current page", () => {
  const analytics = read("src/components/GoogleAnalytics.tsx");
  const pageViews = read("src/components/PageViewTracker.tsx");
  const gameCard = read("src/components/GameCard.tsx");
  const trackedGameLink = read("src/components/TrackedGameLink.tsx");
  const consentCheck = analytics.indexOf("if (getConsent() !== 'accept') return;", analytics.indexOf("export function trackEventOnce"));
  const dedupWrite = analytics.indexOf("sessionStorage.setItem", analytics.indexOf("export function trackEventOnce"));

  assert.ok(consentCheck > 0 && consentCheck < dedupWrite);
  assert.match(pageViews, /onConsentChange\(\(choice\) =>/);
  assert.match(pageViews, /if \(choice === 'accept'\) reportCurrentPage\(\)/);
  assert.match(analytics, /queuedEvents\.forEach/);
  assert.match(analytics, /localStorage\.removeItem\('\$\{QUEUE_KEY\}'\)/);
  assert.doesNotMatch(analytics, /id="ga-init"[\s\S]{0,80}onLoad=/);
  assert.match(gameCard, /<TrackedGameLink/);
  assert.match(trackedGameLink, /trackEvent\("select_game"/);
  assert.match(trackedGameLink, /placement,/);
  assert.match(trackedGameLink, /position,/);
});

test("the primary play CTA starts the game once and recents reflect real starts", () => {
  const playPage = read("src/app/[locale]/play/[slug]/page.tsx");
  const playButton = read("src/components/PlayNowButton.tsx");
  const gameFrame = read("src/components/GameFrame.tsx");

  assert.match(playPage, /<PlayNowButton/);
  assert.doesNotMatch(playPage, /<TrackGamePlay/);
  assert.match(playButton, /new CustomEvent\(GAME_START_EVENT/);
  assert.match(gameFrame, /window\.addEventListener\(GAME_START_EVENT/);
  assert.match(gameFrame, /recordGamePlay\(slug\)/);
  assert.match(gameFrame, /trackEvent\("game_start"/);
  assert.match(gameFrame, /loadedForRoundRef\.current/);
  assert.match(gameFrame, /trackEvent\("game_loaded"/);
  assert.doesNotMatch(gameFrame, /trackEventOnce\(`game_(?:start|loaded)/);
});

test("paginated category JSON-LD describes the visible canonical page", () => {
  const categoryPage = read("src/app/[locale]/category/[slug]/page.tsx");

  assert.match(categoryPage, /const pagePath = "\/category\/" \+ slug/);
  assert.match(categoryPage, /const url = SITE \+ href\(pagePath\)/);
  assert.match(categoryPage, /numberOfItems: visibleGames\.length/);
  assert.match(categoryPage, /itemListElement: visibleGames\.map/);
  assert.match(categoryPage, /position: \(currentPage - 1\) \* PAGE_SIZE \+ idx \+ 1/);
});

test("home page uses the localized search-intent heading before the daily game", () => {
  const homePage = read("src/app/[locale]/page.tsx");

  assert.match(homePage, /<h1[^>]*>\{t\.home\.h1\}<\/h1>/);
  assert.match(homePage, /<h2[^>]*>\{dailyGame\.title\}<\/h2>/);
});

test("template roundups stay out while reviewed news uses a fail-closed search gate", () => {
  const sitemap = read("src/app/sitemap.ts");
  const blogIndex = read("src/app/[locale]/blog/page.tsx");
  const blogArticle = read("src/app/[locale]/blog/[slug]/page.tsx");
  const newsIndex = read("src/app/[locale]/news/page.tsx");
  const newsArticle = read("src/app/[locale]/news/[slug]/page.tsx");
  const newsGate = read("src/lib/news.ts");
  const indexNow = read("scripts/submit-indexnow.mjs");
  const adsenseLoader = read("src/components/DeferredAdSense.tsx");

  assert.match(blogIndex, /robots: \{ index: false, follow: true \}/);
  assert.match(blogArticle, /robots: \{ index: false, follow: true \}/);
  assert.match(newsIndex, /robots: \{ index: false, follow: true \}/);
  assert.match(newsArticle, /index: isSearchEligibleNews\(item, locale\)/);
  assert.match(newsGate, /approved === true/);
  assert.match(newsGate, /keyPoints\.length >= 3/);
  assert.match(sitemap, /getSearchEligibleNews\("ar"\)/);
  assert.match(indexNow, /args\.has\("--recent-news"\)/);
  assert.match(indexNow, /review\?\.searchEligible !== true/);
  assert.doesNotMatch(sitemap, /bilingual\("\/blog"/);
  assert.doesNotMatch(sitemap, /blogRoutes/);
  assert.match(adsenseLoader, /\(\?:play\|blog\|news\|search/);
});

test("news pages include Google preferred-source discovery and original context", () => {
  const preferredSource = read("src/components/PreferredSourceCard.tsx");
  const newsArticle = read("src/app/[locale]/news/[slug]/page.tsx");

  assert.match(preferredSource, /news\.google\.com\/swg\/js\/v1\/publisher\.js/);
  assert.match(preferredSource, /google-add-preferred-source-btn/);
  assert.match(preferredSource, /preferred_source_click/);
  assert.match(newsArticle, /newsKeyPoints/);
  assert.match(newsArticle, /newsWhyItMatters/);
  assert.match(newsArticle, /articleBody/);
});

test("ChatGPT search crawler is explicitly allowed", () => {
  const robots = read("src/app/robots.ts");
  assert.match(robots, /userAgent: "OAI-SearchBot"/);
  assert.match(robots, /allow: "\/"/);
});

test("answer-engine referrals are measured without double counting", () => {
  const tracker = read("src/components/AeoReferralTracker.tsx");
  const layout = read("src/app/[locale]/layout.tsx");

  assert.match(tracker, /chatgpt\.com/);
  assert.match(tracker, /perplexity\.ai/);
  assert.match(tracker, /trackEventOnce/);
  assert.match(tracker, /ai_referral_landing/);
  assert.match(layout, /<AeoReferralTracker \/>/);
});

test("generated English game copy cannot grant indexability or hreflang", () => {
  const contentGate = read("src/lib/gameContent.ts");
  const playPage = read("src/app/[locale]/play/[slug]/page.tsx");
  const sitemap = read("src/app/sitemap.ts");

  assert.match(contentGate, /en: new Set<string>\(\)/);
  assert.doesNotMatch(contentGate, /return locale === "ar" \|\| slug in topEnContent/);
  assert.match(playPage, /function editorialAlternates/);
  assert.match(playPage, /if \(!hasEditorialGameContent\(slug, locale\)\) return \{ canonical \}/);
  assert.match(sitemap, /const hasEn = hasEditorialGameContent\(game\.slug, "en"\)/);
});

test("dynamic game routes provide an accessible loading state", () => {
  const loadingPage = read("src/app/[locale]/play/[slug]/loading.tsx");

  assert.match(loadingPage, /role="status"/);
  assert.match(loadingPage, /aria-live="polite"/);
  assert.match(loadingPage, /aria-busy="true"/);
  assert.match(loadingPage, /bg-surface-elevated/);
  assert.match(loadingPage, /motion-reduce:animate-none/);
  assert.doesNotMatch(loadingPage, /bg-muted/);
});

test("primary interactive controls use readable dark foreground text", () => {
  const sources = [
    read("src/components/FavoriteButton.tsx"),
    read("src/app/[locale]/contact/page.tsx"),
    read("src/app/[locale]/play/[slug]/like/page.tsx"),
  ].join("\n");

  assert.doesNotMatch(sources, /bg-primary[^"\n]*text-white/);
  assert.match(sources, /bg-primary[^"\n]*text-\[#090913\]/);
});

test("reviewed game pages disclose the source before promoting related games", () => {
  const playPage = read("src/app/[locale]/play/[slug]/page.tsx");
  const disclosure = playPage.indexOf("دليل تحريري من فريق بليكسفاي");
  const related = playPage.indexOf('id="related-games"');

  assert.ok(disclosure > 0);
  assert.ok(related > disclosure);
  assert.match(playPage, /Playgama اللعبة وبياناتها الأساسية/);
  assert.match(playPage, /href\(\"\/editorial-policy\"\)/);
  assert.match(playPage, /catalogMeta\.syncedAt/);
});

test("trust pages explain sources, corrections, funding, and automation", () => {
  const about = read("src/app/[locale]/about/page.tsx");
  const editorial = read("src/app/[locale]/editorial-policy/page.tsx");

  assert.match(about, /مصدر الألعاب/);
  assert.match(about, /الإعلانات والاستقلالية/);
  assert.match(about, /تواصل وتصحيح/);
  assert.match(editorial, /مصدر البيانات وحدوده/);
  assert.match(editorial, /الأتمتة والذكاء الاصطناعي/);
  assert.match(editorial, /25 أغسطس 2026/);
});
