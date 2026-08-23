import assert from "node:assert/strict";
import test from "node:test";
import { ContentScoutAgent, EditorialAgent, PublicationAuditAgent, deliveryCounts } from "./social-agents.mjs";
import { buildBufferPostInput } from "./buffer-client.mjs";
import { buildDiscordPayload } from "./discord-client.mjs";
import { loadPlaygamaGames, normalizePlaygamaGames } from "./playgama-social-games.mjs";

const baseItem = {
  platform: "x", kind: "game", contentId: "game-test",
  text: "🎮 جرّب لعبة اليوم مجانًا من المتصفح بدون تحميل أو تسجيل وشاركنا نتيجتك.",
  url: "https://www.plixfy.com/play/test", image: "https://www.plixfy.com/opengraph-image",
};

test("social catalog loads current Playgama JSON", () => {
  const games = loadPlaygamaGames();
  assert.ok(games.length > 0);
  assert.ok(games.every((game) => game.source === "playgama"));
  assert.ok(games.every((game) => game.slug && game.title && game.thumbnail && game.categorySlug));
  assert.ok(games.some((game) => game.supportedDevices === "mobile-and-desktop"));
  assert.ok(games.some((game) => game.description.length >= 300 && game.thumbnailWide));
});

test("social catalog rejects an invalid structure", () => {
  assert.throws(() => normalizePlaygamaGames({ games: [] }), /expected an array/);
  assert.throws(() => normalizePlaygamaGames([]), /no valid games/);
});

test("ScoutAgent chooses fresh news in the evening", () => {
  const selected = new ContentScoutAgent().select({ slot: "evening", games: [{ slug: "game-a" }], newsItems: [{ slug: "old" }, { slug: "fresh" }], recentGames: [], recentNews: ["old"], seed: "2026-08-09:evening" });
  assert.equal(selected.kind, "news"); assert.equal(selected.item.slug, "fresh");
});

test("ScoutAgent falls back to a game when no news is eligible", () => {
  const selected = new ContentScoutAgent().select({ slot: "evening", games: [{ slug: "game-a" }], newsItems: [], recentGames: [], recentNews: [], seed: "2026-08-09:evening" });
  assert.equal(selected.kind, "game"); assert.equal(selected.item.slug, "game-a");
});

test("EditorAgent accepts a valid Arabic social pack", () => {
  const pack = new EditorialAgent().review({ date: "2026-08-09", campaign: "ar_growth_cloud", items: [baseItem] });
  assert.equal(pack.items[0].text, baseItem.text);
});

test("EditorAgent rejects broken Arabic encoding", () => {
  assert.throws(() => new EditorialAgent().review({ date: "2026-08-09", campaign: "ar_growth_cloud", items: [{ ...baseItem, text: "Ã˜Â£Ã™â€žÃ˜Â¹Ã˜Â§Ã˜Â¨ broken encoding" }] }), /broken encoding/);
});

test("EditorAgent rejects duplicate platform posts", () => {
  assert.throws(() => new EditorialAgent().review({ date: "2026-08-09", campaign: "ar_growth_cloud", items: [baseItem, { ...baseItem, contentId: "game-two" }] }), /duplicate x/);
});

test("EditorAgent rejects external landing pages", () => {
  assert.throws(() => new EditorialAgent().review({ date: "2026-08-09", campaign: "ar_growth_cloud", items: [{ ...baseItem, url: "https://example.com/phishing" }] }), /Plixfy HTTPS URL/);
});

test("EditorAgent rejects mostly-English text in an Arabic campaign", () => {
  assert.throws(() => new EditorialAgent().review({ date: "2026-08-09", campaign: "ar_growth_cloud", items: [{ ...baseItem, text: "This is a long English gaming post with only كلمات عربية قليلة جدًا" }] }), /enough Arabic/);
});

test("EditorAgent requires measurable metadata for acquisition campaigns", () => {
  assert.throws(
    () => new EditorialAgent().review({ date: "2026-08-23", campaign: "ar_acquisition_v1", items: [baseItem] }),
    /acquisition campaign metadata/,
  );
  const pack = new EditorialAgent().review({
    date: "2026-08-23",
    campaign: "ar_acquisition_v1",
    acquisition: {
      agent: "traffic-acquisition-v1",
      score: 80,
      hookVariant: "b",
      reasons: ["trend_match"],
      trendStatus: "live",
    },
    items: [baseItem],
  });
  assert.equal(pack.acquisition.hookVariant, "b");
});

test("AuditAgent never counts Telegram fallback as a public post", () => {
  const report = { deliveries: [{ platform: "instagram", status: "fallback_admin", public: false }, { platform: "tiktok", status: "skipped_disconnected", public: false }] };
  assert.throws(() => new PublicationAuditAgent().evaluate(report), /zero public posts/);
});

test("AuditAgent accepts one real public post and reports fallbacks separately", () => {
  const report = { deliveries: [{ platform: "x", status: "published_public", public: true }, { platform: "instagram", status: "fallback_admin", public: false }] };
  const result = new PublicationAuditAgent().evaluate(report);
  assert.equal(result.counts.publishedPublic, 1); assert.equal(result.counts.fallbackAdmin, 1);
  assert.deepEqual(deliveryCounts(report.deliveries), result.counts);
});

test("AuditAgent reports Buffer acceptance separately from confirmed publishing", () => {
  const result = new PublicationAuditAgent().evaluate({ deliveries: [{ platform: "x", status: "accepted_by_buffer", public: true, externalId: "post-1" }] });
  assert.equal(result.counts.publishedPublic, 0); assert.equal(result.counts.acceptedByBuffer, 1);
});

test("Buffer Facebook posts include the required post type", () => {
  const input = buildBufferPostInput({ channelId: "facebook-1", platform: "facebook", text: "test" });
  assert.deepEqual(input.metadata, { facebook: { type: "post" } });
});

test("Buffer Instagram posts request an automatic feed post", () => {
  const input = buildBufferPostInput({ channelId: "instagram-1", platform: "instagram", text: "test" });
  assert.deepEqual(input.metadata, {
    instagram: { type: "post", shouldShareToFeed: true, isAiGenerated: false },
  });
});

test("Buffer X posts include the Plixfy-hosted branded card", () => {
  const input = buildBufferPostInput({
    channelId: "x-1",
    platform: "x",
    text: "جرّب اللعبة https://www.plixfy.com/play/test",
    image: "https://www.plixfy.com/api/social-card?kind=game&id=test",
  });
  assert.deepEqual(input.assets, [{ image: { url: "https://www.plixfy.com/api/social-card?kind=game&id=test" } }]);
  assert.match(input.text, /plixfy\.com/);
});

test("Buffer TikTok video posts use the hosted MP4 instead of the image card", () => {
  const input = buildBufferPostInput({
    channelId: "tiktok-1",
    platform: "tiktok",
    text: "Plixfy game",
    title: "Plixfy game",
    image: "https://www.plixfy.com/card.png",
    video: "https://www.plixfy.com/social/videos/game.mp4",
  });
  assert.equal(input.assets.length, 1);
  assert.equal(input.assets[0].video.url, "https://www.plixfy.com/social/videos/game.mp4");
  assert.equal(input.assets[0].video.metadata.thumbnailOffset, 1_200);
  assert.equal(input.metadata.tiktok.isAiGenerated, false);
});

test("EditorAgent accepts Discord as a public social destination", () => {
  const pack = new EditorialAgent().review({
    date: "2026-08-11",
    campaign: "ar_growth_cloud",
    items: [{ ...baseItem, platform: "discord" }],
  });
  assert.equal(pack.items[0].platform, "discord");
});

test("Discord payload carries the branded image and blocks mentions", () => {
  const payload = buildDiscordPayload({
    text: "خبر جديد على بليكسفاي https://www.plixfy.com/news/test",
    title: "خبر ألعاب جديد",
    image: "https://www.plixfy.com/api/social-card?kind=news&id=test",
    url: "https://www.plixfy.com/news/test",
  });
  assert.equal(payload.embeds[0].image.url, "https://www.plixfy.com/api/social-card?kind=news&id=test");
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
});
