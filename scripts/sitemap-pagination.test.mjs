import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const SITE = "https://www.plixfy.com";

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

function loadGames() {
  const require = (specifier) => {
    if (specifier === "@/data/playgama-games.json") {
      return { default: readJson("src/data/playgama-games.json") };
    }
    throw new Error(`Unexpected dependency: ${specifier}`);
  };

  return compileTypeScript("src/lib/games.ts", require);
}

function loadSitemap(games) {
  const require = (specifier) => {
    if (specifier === "@/lib/games") return games;
    if (specifier === "@/data/playgama-catalog-meta.json") {
      return { default: readJson("src/data/playgama-catalog-meta.json") };
    }
    // These routes are outside this collection-pagination contract.
    if (specifier === "@/lib/gameContent") return { hasEditorialGameContent: () => false };
    if (specifier === "@/lib/news") return { getSearchEligibleNews: () => [] };
    if (specifier === "@/lib/newsImage") return { newsImageHref: (slug) => `/api/news-image/${slug}` };
    if (specifier === "@/lib/blog") return { getAllPosts: () => [] };
    if (specifier === "@/lib/blogEn") return { getAllPostsEn: () => [] };
    if (specifier === "@/lib/blog-publication") return { getBlogSearchAlternates: () => null };
    throw new Error(`Unexpected dependency: ${specifier}`);
  };

  return compileTypeScript("src/app/sitemap.ts", require).default;
}

test("sitemap exposes every populated category page after page 1 in Arabic and English", () => {
  const games = readJson("src/data/playgama-games.json");
  const meta = readJson("src/data/playgama-catalog-meta.json");
  const gameLibrary = loadGames();
  const entries = loadSitemap(gameLibrary)();
  const categoryPages = gameLibrary.categories.map((category) => ({
    slug: category.slug,
    totalPages: Math.max(
      1,
      Math.ceil(gameLibrary.getCategoryGames(category.slug).length / gameLibrary.CATEGORY_PAGE_SIZE),
    ),
  }));
  const paginatedEntries = entries.filter((entry) =>
    categoryPages.some(({ slug }) =>
      [`${SITE}/category/${slug}?page=`, `${SITE}/en/category/${slug}?page=`]
        .some((prefix) => entry.url.startsWith(prefix)),
    ),
  );
  const expectedUrls = categoryPages.flatMap(({ slug, totalPages }) =>
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).flatMap((page) => [
      `${SITE}/category/${slug}?page=${page}`,
      `${SITE}/en/category/${slug}?page=${page}`,
    ]),
  );

  assert.deepEqual(
    Array.from(paginatedEntries, (entry) => entry.url).sort(),
    Array.from(expectedUrls).sort(),
  );

  const paginatedCategory = categoryPages.find(({ totalPages }) => totalPages > 1);
  assert.ok(paginatedCategory, "the fixture needs a category with page 2");
  const { slug, totalPages } = paginatedCategory;
  const arabicLastPageUrl = `${SITE}/category/${slug}?page=${totalPages}`;
  const englishLastPageUrl = `${SITE}/en/category/${slug}?page=${totalPages}`;
  assert.ok(entries.some((entry) => entry.url === arabicLastPageUrl));
  assert.ok(entries.some((entry) => entry.url === englishLastPageUrl));
  assert.equal(entries.some((entry) => entry.url === `${SITE}/category/${slug}?page=${totalPages + 1}`), false);
  assert.equal(entries.some((entry) => entry.url === `${SITE}/en/category/${slug}?page=${totalPages + 1}`), false);

  const arabicPage = entries.find((entry) => entry.url === `${SITE}/category/${slug}?page=2`);
  assert.deepEqual(JSON.parse(JSON.stringify(arabicPage?.alternates?.languages)), {
    ar: `${SITE}/category/${slug}?page=2`,
    en: `${SITE}/en/category/${slug}?page=2`,
    "x-default": `${SITE}/category/${slug}?page=2`,
  });
  assert.equal(arabicPage?.lastModified?.toISOString(), meta.syncedAt);
  assert.equal(games.length, meta.gameCount);
  assert.equal(entries.some((entry) => /\/category\/(?:top|trending)\?page=/.test(entry.url)), false);
});
