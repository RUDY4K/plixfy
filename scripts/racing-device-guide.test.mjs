import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

test("review evidence keeps a cross-platform hash after checkout", () => {
  const evidencePath = "docs/editorial-evidence/2026-09-14-racing-device-guide.md";
  const evidence = readFileSync(path.join(ROOT, evidencePath));
  const reviews = JSON.parse(read("src/data/blog-publication-review.json"));
  const hashes = new Set(
    reviews
      .filter((review) => review.slug === "alaab-sibaq-jawal-w-computer-2026")
      .map((review) => review.evidenceSha256),
  );

  assert.match(read(".gitattributes"), /^docs\/editorial-evidence\/\*\.md text eol=lf$/m);
  assert.deepEqual([...hashes], [createHash("sha256").update(evidence).digest("hex")]);
});

test("the racing device guide is factual, bilingual, and links only verified dual-device games", () => {
  const posts = JSON.parse(read("src/data/blog-generated.json"));
  const catalog = JSON.parse(read("src/data/playgama-games.json"));
  const post = posts.find((item) => item.slug === "alaab-sibaq-jawal-w-computer-2026");

  assert.ok(post, "the reviewed racing device guide must exist");
  assert.deepEqual(post.featuredGameSlugs, [
    "bike-stunt-game",
    "a-deadly-car-crash",
    "bmg-crash-test",
  ]);

  for (const slug of post.featuredGameSlugs) {
    const game = catalog.find((item) => item.slug === slug);
    assert.ok(game, `missing catalog game: ${slug}`);
    assert.equal(game.categorySlug, "racing");
    assert.equal(game.supportedDevices, "mobile-and-desktop");
  }

  for (const locale of ["ar", "en"]) {
    const content = post[locale];
    assert.ok(content.title && content.h1 && content.description && content.intro);
    assert.ok(content.primaryCtaLabel);
    assert.ok(content.featuredGamesHeading);
    assert.ok(content.featuredGamesIntro);
    assert.ok(content.sections.length >= 3);
    assert.ok(content.faq.length >= 3);
  }

  const arabic = JSON.stringify(post.ar);
  const english = JSON.stringify(post.en);
  assert.match(arabic, /Adventure Crazy Ramp Bike Stunt Game.{0,80}للحاسوب فقط/u);
  assert.match(arabic, /Bicycle Mountain Xtreme.{0,80}للهاتف فقط/u);
  assert.match(english, /Adventure Crazy Ramp Bike Stunt Game.{0,80}desktop only/i);
  assert.match(english, /Bicycle Mountain Xtreme.{0,80}mobile only/i);

  for (const unsupported of [
    /نصائح مجربة/u,
    /جميع ألعاب السباق/u,
    /مجانية بالكامل/u,
    /works flawlessly/i,
    /all racing games/i,
    /completely free/i,
  ]) {
    assert.doesNotMatch(arabic + english, unsupported);
  }
});

test("the blog page measures curated game links without internal UTM parameters", () => {
  const page = read("src/app/[locale]/blog/[slug]/page.tsx");
  const generatedTypes = read("src/lib/generatedBlog.ts");
  const promotion = read("scripts/content-promote.mjs");

  assert.match(page, /<TrackedGameLink/);
  assert.match(page, /blog-primary-cta/);
  assert.match(page, /blog-featured-games/);
  assert.match(page, /<GameCard/);
  assert.doesNotMatch(page, /utm_(?:source|medium|campaign)/i);

  for (const field of [
    "featuredGameSlugs",
    "primaryCtaLabel",
    "featuredGamesHeading",
    "featuredGamesIntro",
  ]) {
    assert.match(generatedTypes, new RegExp(field));
    assert.match(promotion, new RegExp(field));
  }
});

test("only the reviewed racing guide is explicitly search eligible in both locales", () => {
  const reviews = JSON.parse(read("src/data/blog-publication-review.json"));
  const eligible = reviews.filter((entry) => entry.searchEligible === true);
  assert.deepEqual(
    eligible.map(({ slug, locale }) => ({ slug, locale })),
    [
      { slug: "alaab-sibaq-jawal-w-computer-2026", locale: "ar" },
      { slug: "alaab-sibaq-jawal-w-computer-2026", locale: "en" },
    ],
  );

  const page = read("src/app/[locale]/blog/[slug]/page.tsx");
  const sitemap = read("src/app/sitemap.ts");
  assert.match(page, /getBlogSearchAlternates/);
  assert.match(page, /eligibleLanguages\?\.\[locale\]/);
  assert.match(sitemap, /new Set\(\[\.\.\.arabicPosts\.map/);
  assert.match(sitemap, /\.\.\.englishPosts\.map/);
  assert.match(sitemap, /getBlogSearchAlternates/);
  assert.match(sitemap, /lastModified: new Date\(arPost\.updatedAt\)/);
  assert.match(sitemap, /lastModified: new Date\(enPost\.updatedAt\)/);
});
