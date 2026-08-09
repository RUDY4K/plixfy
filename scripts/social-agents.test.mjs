import assert from "node:assert/strict";
import test from "node:test";
import { ContentScoutAgent, EditorialAgent, PublicationAuditAgent, deliveryCounts } from "./social-agents.mjs";

const baseItem = {
  platform: "x", kind: "game", contentId: "game-test",
  text: "🎮 جرّب لعبة اليوم مجانًا من المتصفح بدون تحميل أو تسجيل وشاركنا نتيجتك.",
  url: "https://www.plixfy.com/ar/play/test", image: "https://www.plixfy.com/opengraph-image",
};

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
