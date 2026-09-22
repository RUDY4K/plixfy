import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildFastNewsPack,
  parseOfficialFeed,
  requireCompleteFastNewsDelivery,
  reviewFastNewsRights,
  selectNextFastNews,
} from "./fast-social-news.mjs";
import { EditorialAgent } from "./social-agents.mjs";
import { trackedUrl } from "./social-publisher.mjs";

const now = new Date("2026-09-22T09:00:00.000Z");
const rss = `<?xml version="1.0"?><rss><channel>
  <item><title>New official game update &amp; release date</title><link>https://blog.playstation.com/2026/09/22/update/</link><pubDate>Tue, 22 Sep 2026 08:45:00 GMT</pubDate><description><![CDATA[Official details from the publisher.]]></description><guid>ps-update</guid></item>
</channel></rss>`;

test("official RSS parsing keeps only source-owned HTTPS links", () => {
  const items = parseOfficialFeed(rss, {
    id: "playstation-blog",
    nameAr: "بلايستيشن",
    feedUrl: "https://blog.playstation.com/feed/",
    allowedHosts: ["blog.playstation.com"],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "New official game update & release date");
  assert.equal(items[0].url, "https://blog.playstation.com/2026/09/22/update/");
  assert.equal(items[0].sourceId, "playstation-blog");

  const poisoned = rss.replace("https://blog.playstation.com/2026/09/22/update/", "https://example.com/copied-story");
  assert.deepEqual(parseOfficialFeed(poisoned, {
    id: "playstation-blog",
    nameAr: "بلايستيشن",
    feedUrl: "https://blog.playstation.com/feed/",
    allowedHosts: ["blog.playstation.com"],
  }), []);
});

test("fast-news completes only after every requested delivery succeeds", () => {
  assert.doesNotThrow(() => requireCompleteFastNewsDelivery({
    ok: true,
    counts: { publishedPublic: 2, acceptedByBuffer: 2 },
  }));
  assert.throws(() => requireCompleteFastNewsDelivery({
    ok: false,
    counts: { publishedPublic: 1, acceptedByBuffer: 0, fallbackAdmin: 1, skippedDisconnected: 1, failed: 1 },
  }), /delivery incomplete.*published=1.*fallback=1.*disconnected=1.*failed=1/);
});

test("fast-news selection is fresh, newest-first, and deduplicated", () => {
  const candidates = [
    { id: "older", publishedAt: "2026-09-22T08:20:00.000Z" },
    { id: "newest", publishedAt: "2026-09-22T08:55:00.000Z" },
    { id: "stale", publishedAt: "2026-09-21T20:00:00.000Z" },
  ];
  assert.equal(selectNextFastNews(candidates, { published: {} }, { now, maxAgeMs: 3_600_000 }).id, "newest");
  assert.equal(selectNextFastNews(candidates, { published: { newest: { completedAt: now.toISOString() } } }, { now, maxAgeMs: 3_600_000 }).id, "older");
  assert.equal(selectNextFastNews(candidates, { published: { newest: {}, older: {} } }, { now, maxAgeMs: 3_600_000 }), null);
  assert.equal(selectNextFastNews(candidates, { published: {}, attempts: { newest: { count: 3 } } }, { now, maxAgeMs: 3_600_000 }).id, "older");
});

test("fast-news packs use source links, Arabic summaries, and no borrowed media", () => {
  const pack = buildFastNewsPack({
    item: {
      id: "playstation-blog-abc",
      title: "Official title",
      url: "https://blog.playstation.com/2026/09/22/update/",
      sourceNameAr: "بلايستيشن",
      publishedAt: "2026-09-22T08:45:00.000Z",
    },
    date: "2026-09-22",
    platforms: ["telegram", "discord", "x", "facebook"],
  });
  assert.equal(pack.campaign, "ar_fast_news_v1");
  assert.deepEqual(pack.items.map((item) => item.platform), ["telegram", "discord", "x", "facebook"]);
  assert.ok(pack.items.every((item) => item.url.startsWith("https://blog.playstation.com/")));
  assert.ok(pack.items.every((item) => !item.image && !item.video));
  assert.ok(pack.items.find((item) => item.platform === "x").text.length <= 240);
  assert.doesNotThrow(() => new EditorialAgent().review(pack));
  assert.doesNotThrow(() => reviewFastNewsRights(pack, {
    id: "playstation-blog-abc",
    title: "Official title",
    url: "https://blog.playstation.com/2026/09/22/update/",
    sourceNameAr: "بلايستيشن",
  }));
});

test("fast-news defaults to X only", () => {
  const pack = buildFastNewsPack({
    item: {
      id: "xbox-default",
      title: "Official title",
      url: "https://news.xbox.com/en-us/update/",
      sourceNameAr: "إكس بوكس",
      publishedAt: now.toISOString(),
    },
    date: "2026-09-22",
  });
  assert.deepEqual(pack.items.map((item) => item.platform), ["x"]);
});

test("fast-news external links are allowlisted and never receive Plixfy tracking parameters", () => {
  const pack = buildFastNewsPack({
    item: { id: "xbox-abc", title: "Official title", url: "https://news.xbox.com/en-us/update/", sourceNameAr: "إكس بوكس", publishedAt: now.toISOString() },
    date: "2026-09-22",
    platforms: ["x"],
  });
  assert.equal(trackedUrl(pack.items[0], pack), "https://news.xbox.com/en-us/update/");

  const untrusted = structuredClone(pack);
  untrusted.items[0].url = "https://example.com/copied-news";
  assert.throws(() => new EditorialAgent().review(untrusted), /official source/);
});

test("the fast-news workflow checks every five minutes and excludes image-only channels", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/fast-social-news.yml", import.meta.url), "utf8");
  assert.match(workflow, /cron: "\*\/5 \* \* \* \*"/);
  assert.doesNotMatch(workflow, /GEMINI_API_KEY/);
  assert.match(workflow, /SOCIAL_PLATFORMS: x(?:\r?\n|$)/);
  assert.doesNotMatch(workflow, /SOCIAL_PLATFORMS:.*(?:telegram|discord|facebook|instagram)/);
  assert.match(workflow, /\.social\/fast-news-state\.json/);
  assert.match(workflow, /fast-news-state/);
  assert.doesNotMatch(workflow, /npm ci/);
});
