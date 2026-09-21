import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getPublishedNews } from "./news-publication.mjs";

const slug = "xbox-releases-september-21-25-2026";
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

test("the reviewed Xbox weekly report is visible in both locales", () => {
  const news = readJson("src/data/news.json");
  const editorial = readJson("src/data/news-editorial.json");
  const reviews = readJson("src/data/news-publication-review.json");
  const item = news.find((entry) => entry.slug === slug);

  assert.ok(item);
  assert.equal(getPublishedNews(news, editorial, reviews, "ar").some((entry) => entry.slug === slug), true);
  assert.equal(getPublishedNews(news, editorial, reviews, "en").some((entry) => entry.slug === slug), true);
});

test("the report keeps its official source, original value, and first-party artwork", () => {
  const news = readJson("src/data/news.json");
  const editorial = readJson("src/data/news-editorial.json")[slug];
  const item = news.find((entry) => entry.slug === slug);

  assert.equal(new URL(item.sourceUrl).hostname, "news.xbox.com");
  assert.match(item.summary, /Game Pass/);
  assert.match(item.summary, /Play Anywhere/);
  assert.match(item.summaryEn, /service’s catalog/i);
  assert.match(item.summaryEn, /supported digital game/i);
  assert.equal(editorial.searchEligible, true);
  assert.equal(editorial.searchEligibleEn, true);
  assert.ok(editorial.keyPoints.length >= 4);
  assert.ok(editorial.keyPointsEn.length >= 4);
  assert.equal(new URL(item.image).hostname, "www.plixfy.com");
  assert.match(item.imageCaption, /مولّد/);
  assert.match(item.imageCaptionEn, /generated illustration/i);
  assert.equal(fs.existsSync("public/news/xbox-releases-september-21-25-2026-v3.webp"), true);
});
