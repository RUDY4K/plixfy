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

test("automated Arabic social posts use canonical root-locale URLs", () => {
  const runner = read("scripts/cloud-social-runner.mjs");
  const capture = read("scripts/capture-gameplay-video.mjs");
  assert.match(runner, /\$\{SITE\}\/play\/\$\{encodeURIComponent\(game\.slug\)\}/);
  assert.match(runner, /\$\{SITE\}\/news\/\$\{encodeURIComponent\(news\.slug\)\}/);
  assert.doesNotMatch(runner, /\$\{SITE\}\/ar\/(?:play|news)\//);
  assert.match(capture, /plixfy\.com\/play\/\$\{game\.slug\}/);
  assert.doesNotMatch(capture, /plixfy\.com\/ar\/play\//);
});

test("IndexNow submits only the live sitemap allow-list", () => {
  const submitter = read("scripts/submit-indexnow.mjs");
  const workflow = read(".github/workflows/indexnow.yml");

  assert.match(submitter, /sitemap\.xml/);
  assert.doesNotMatch(submitter, /src["', ]+data["', ]+news\.json/);
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
