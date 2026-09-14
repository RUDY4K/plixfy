import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getPublishedNews } from "./news-publication.mjs";

const slug = "melty-blood-twi-lumina-release-date";
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

test("the reviewed story is published in Arabic and English", () => {
  const news = readJson("src/data/news.json");
  const editorial = readJson("src/data/news-editorial.json");
  const reviews = readJson("src/data/news-publication-review.json");
  const item = news.find((entry) => entry.slug === slug);

  assert.ok(item, "reviewed story must be present in news data");
  assert.equal(getPublishedNews(news, editorial, reviews, "ar").some((entry) => entry.slug === slug), true);
  assert.equal(getPublishedNews(news, editorial, reviews, "en").some((entry) => entry.slug === slug), true);
});

test("the story meets the search-quality and first-party artwork gates", () => {
  const news = readJson("src/data/news.json");
  const editorial = readJson("src/data/news-editorial.json")[slug];
  const item = news.find((entry) => entry.slug === slug);

  assert.ok(item.summary.length >= 450);
  assert.ok(item.summaryEn.length >= 450);
  assert.equal(editorial.searchEligible, true);
  assert.equal(editorial.searchEligibleEn, true);
  assert.ok(editorial.keyPoints.length >= 3);
  assert.ok(editorial.keyPointsEn.length >= 3);
  assert.ok(editorial.whyItMatters.length >= 90);
  assert.ok(editorial.whyItMattersEn.length >= 90);
  assert.equal(new URL(item.image).hostname, "www.plixfy.com");
  assert.match(item.imageCaption, /ليس لقطة من اللعبة/);
  assert.match(item.imageCaptionEn, /not a screenshot from the game/i);
  assert.equal(fs.existsSync("public/news/melty-blood-twi-lumina-release-date.webp"), true);
});

test("the article page visibly labels original illustrative artwork", () => {
  const page = fs.readFileSync("src/app/[locale]/news/[slug]/page.tsx", "utf8");

  assert.match(page, /<figcaption/);
  assert.match(page, /imageCaptionEn/);
});
