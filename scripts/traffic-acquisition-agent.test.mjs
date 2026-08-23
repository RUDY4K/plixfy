import assert from "node:assert/strict";
import test from "node:test";
import {
  ACQUISITION_CAMPAIGN,
  TrafficAcquisitionAgent,
  chooseHookVariant,
  fetchSaudiTrends,
  parseGoogleTrendsRss,
} from "./traffic-acquisition-agent.mjs";

const richDescription = "وصف مفيد ".repeat(50);

test("traffic agent parses Google Trends RSS without using external media", () => {
  const trends = parseGoogleTrendsRss(`
    <rss xmlns:ht="https://trends.google.com/trending/rss"><channel>
      <title>Daily Search Trends</title>
      <item><title>call of duty &amp; mw4</title><ht:approx_traffic>10K+</ht:approx_traffic><pubDate>Sun, 23 Aug 2026 01:00:00 GMT</pubDate></item>
      <item><title><![CDATA[الهلال ضد النصر]]></title><ht:approx_traffic>100K+</ht:approx_traffic></item>
    </channel></rss>
  `);
  assert.deepEqual(trends.map((trend) => trend.term), ["call of duty & mw4", "الهلال ضد النصر"]);
  assert.deepEqual(trends.map((trend) => trend.approximateTraffic), [10_000, 100_000]);
  assert.ok(trends.every((trend) => !("picture" in trend)));
});

test("trend scout safely falls back to catalog scoring when the feed is unavailable", async () => {
  const snapshot = await fetchSaudiTrends({
    fetchImpl: async () => { throw new Error("offline"); },
    now: new Date("2026-08-23T09:00:00Z"),
  });
  assert.equal(snapshot.source, "catalog_fallback");
  assert.equal(snapshot.status, "unavailable");
  assert.deepEqual(snapshot.trends, []);
});

test("traffic agent prioritizes a Saudi sports interest over an unrelated game", () => {
  const selected = new TrafficAcquisitionAgent().select({
    slot: "morning",
    games: [
      { slug: "puzzle", title: "Color Puzzle", categorySlug: "puzzle", description: richDescription, supportedDevices: "mobile-and-desktop", images: [] },
      { slug: "football", title: "Football Stars", categorySlug: "sports", description: richDescription, supportedDevices: "mobile-and-desktop", images: [] },
    ],
    newsItems: [],
    trends: [{ term: "الهلال ضد النصر", approximateTraffic: 100_000 }],
    seed: "2026-08-23:morning",
    referenceDate: "2026-08-23",
  });
  assert.equal(selected.item.slug, "football");
  assert.ok(selected.acquisition.reasons.includes("saudi_interest:sports"));
});

test("traffic agent matches a gaming trend to the most relevant fresh news", () => {
  const selected = new TrafficAcquisitionAgent().select({
    slot: "evening",
    games: [],
    newsItems: [
      { slug: "general", title: "خبر عن استوديو ألعاب", titleEn: "Studio update", summary: richDescription, publishedAt: "2026-08-23" },
      { slug: "mw4", title: "تفاصيل بيتا مودرن وورفير 4", titleEn: "Call of Duty Modern Warfare 4 beta", summary: richDescription, publishedAt: "2026-08-23" },
    ],
    trends: [{ term: "call of duty mw4 beta code", approximateTraffic: 10_000 }],
    seed: "2026-08-23:evening",
    referenceDate: "2026-08-23",
  });
  assert.equal(selected.item.slug, "mw4");
  assert.ok(selected.acquisition.reasons.includes("trend_match"));
});

test("traffic agent avoids a recently promoted page when fresh content exists", () => {
  const selected = new TrafficAcquisitionAgent().select({
    slot: "morning",
    games: [
      { slug: "recent-football", title: "Football", categorySlug: "sports", description: richDescription, supportedDevices: "mobile-and-desktop" },
      { slug: "fresh-racing", title: "Car Racing", categorySlug: "racing", description: richDescription, supportedDevices: "mobile-and-desktop" },
    ],
    newsItems: [],
    recentGames: ["recent-football"],
    trends: [{ term: "football league", approximateTraffic: 100_000 }],
    seed: "repeat-guard",
    referenceDate: "2026-08-23",
  });
  assert.equal(selected.item.slug, "fresh-racing");
});

test("traffic agent rejects a one-word coincidence with an unrelated trend", () => {
  const selected = new TrafficAcquisitionAgent().select({
    slot: "morning",
    games: [
      { slug: "toxic", title: "Toxic Arena", categorySlug: "action", description: "short", supportedDevices: "desktop-only" },
      { slug: "quality", title: "Color Merge", categorySlug: "puzzle", description: richDescription, supportedDevices: "mobile-and-desktop", thumbnailWide: "https://example.test/wide.jpg" },
    ],
    newsItems: [],
    trends: [{ term: "toxic movie", approximateTraffic: 100_000 }],
    seed: "false-positive-guard",
    referenceDate: "2026-08-23",
  });
  assert.equal(selected.item.slug, "quality");
  assert.ok(!selected.acquisition.reasons.includes("trend_match"));
});

test("traffic agent ignores generic marketing words and follows an actual game signal", () => {
  const selected = new TrafficAcquisitionAgent().select({
    slot: "morning",
    games: [
      { slug: "casual", title: "Duck Adventure", categorySlug: "casual", description: `${richDescription} play free online using your browser`, supportedDevices: "mobile-and-desktop" },
      { slug: "action", title: "City Action", categorySlug: "action", description: richDescription, genres: ["gta"], supportedDevices: "mobile-and-desktop" },
    ],
    newsItems: [],
    trends: [
      { term: "free accounts using national id verification", approximateTraffic: 1_000 },
      { term: "gta6 leaks", approximateTraffic: 500 },
    ],
    seed: "generic-word-guard",
    referenceDate: "2026-08-23",
  });
  assert.equal(selected.item.slug, "action");
  assert.ok(selected.acquisition.reasons.includes("saudi_interest:action"));
  assert.ok(selected.acquisition.reasons.includes("trend_match"));
  assert.deepEqual(selected.acquisition.matchedTrends, ["gta6 leaks"]);
});

test("hook variant is deterministic and campaign name is GA4-friendly", () => {
  const first = chooseHookVariant("2026-08-23:morning", "football-stars");
  assert.equal(chooseHookVariant("2026-08-23:morning", "football-stars"), first);
  assert.ok(["a", "b", "c"].includes(first));
  assert.equal(ACQUISITION_CAMPAIGN, "ar_acquisition_v1");
});
