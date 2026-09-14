import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const SITE = "https://www.plixfy.com";
const CATEGORY_SLUGS = ["racing", "action", "puzzle", "io", "girls", "casual", "sports", "shooting"];

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function compileTypeScript(relativePath, require) {
  const source = readFileSync(path.join(ROOT, relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { exports: module.exports, module, require });
  return module.exports;
}

function loadSitemap() {
  let games;
  const require = (specifier) => {
    if (specifier === "@/lib/games") {
      games ??= compileTypeScript("src/lib/games.ts", require);
      return games;
    }
    if (specifier === "@/data/playgama-games.json") {
      return { default: readJson("src/data/playgama-games.json") };
    }
    if (specifier === "@/data/playgama-catalog-meta.json") {
      return { default: readJson("src/data/playgama-catalog-meta.json") };
    }
    // These routes are outside this collection-pagination contract.
    if (specifier === "@/lib/gameContent") return { hasEditorialGameContent: () => false };
    if (specifier === "@/lib/news") return { getSearchEligibleNews: () => [] };
    if (specifier === "@/lib/newsImage") return { newsImageHref: (slug) => `/api/news-image/${slug}` };
    throw new Error(`Unexpected dependency: ${specifier}`);
  };

  return compileTypeScript("src/app/sitemap.ts", require).default;
}

test("sitemap exposes every populated category page after page 1 in Arabic and English", () => {
  const games = readJson("src/data/playgama-games.json");
  const meta = readJson("src/data/playgama-catalog-meta.json");
  const entries = loadSitemap()();
  const paginatedEntries = entries.filter((entry) =>
    CATEGORY_SLUGS.some((slug) =>
      [`${SITE}/category/${slug}?page=`, `${SITE}/en/category/${slug}?page=`]
        .some((prefix) => entry.url.startsWith(prefix)),
    ),
  );

  // The current catalog has 32 additional category collections, each localized twice.
  assert.equal(paginatedEntries.length, 64);
  assert.ok(entries.some((entry) => entry.url === `${SITE}/category/puzzle?page=13`));
  assert.ok(entries.some((entry) => entry.url === `${SITE}/en/category/puzzle?page=13`));

  const arabicPuzzlePage = entries.find((entry) => entry.url === `${SITE}/category/puzzle?page=2`);
  assert.deepEqual(JSON.parse(JSON.stringify(arabicPuzzlePage?.alternates?.languages)), {
    ar: `${SITE}/category/puzzle?page=2`,
    en: `${SITE}/en/category/puzzle?page=2`,
    "x-default": `${SITE}/category/puzzle?page=2`,
  });
  assert.equal(arabicPuzzlePage?.lastModified?.toISOString(), meta.syncedAt);
  assert.equal(games.length, meta.gameCount);
  assert.equal(entries.some((entry) => /\/category\/(?:top|trending)\?page=/.test(entry.url)), false);
});
