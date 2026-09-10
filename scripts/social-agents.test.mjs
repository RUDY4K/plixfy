import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { newsContentHash } from "./news-publication.mjs";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

test("publisher dry-run exits before credentials or connected channels are inspected", () => {
  const source = fs.readFileSync(new URL("./social-publisher.mjs", import.meta.url), "utf8");
  const environmentLoad = source.indexOf("if (!dryRun) loadEnvLocal();");
  const dryRunGuard = source.indexOf("if (dryRun) {");
  const channelDiscovery = source.indexOf("if (isBufferConfigured()) {");

  assert.ok(environmentLoad > -1);
  assert.ok(dryRunGuard > environmentLoad);
  assert.ok(channelDiscovery > dryRunGuard);
});

test("publisher dry-run performs no network request even when a channel key exists", (context) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-social-dry-run-"));
  context.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const packFile = path.join(temporaryDirectory, "pack.json");
  const reportFile = path.join(temporaryDirectory, "report.json");
  fs.writeFileSync(
    packFile,
    JSON.stringify({ date: "2026-08-27", campaign: "ar_growth_cloud", items: [baseItem] }),
  );

  const sentinel = "PLIXFY_DRY_RUN_NETWORK_FORBIDDEN";
  const preload = `data:text/javascript,${encodeURIComponent(`globalThis.fetch=async()=>{throw new Error("${sentinel}")}`)}`;
  const childEnvironment = {
    ...process.env,
    BUFFER_API_KEY: "dry-run-test-key",
    SOCIAL_PLATFORMS: "x",
  };
  for (const key of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_CHANNEL_ID", "DISCORD_WEBHOOK_URL"]) {
    delete childEnvironment[key];
  }

  const result = spawnSync(
    process.execPath,
    [
      "--import",
      preload,
      path.resolve("scripts/social-publisher.mjs"),
      packFile,
      "--dry-run",
      `--report=${reportFile}`,
    ],
    {
      cwd: temporaryDirectory,
      encoding: "utf8",
      env: childEnvironment,
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(sentinel));
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  assert.equal(report.dryRun, true);
  assert.deepEqual(report.connectedPublicPlatforms, []);
  assert.deepEqual(report.deliveries.map((delivery) => delivery.status), ["dry_run"]);
});

test("cloud dry-run only selects evidence-approved news and remains offline", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-review-"));
  context.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("plixfy-cloud-review-"));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  // Copy only public source modules; no credentials, state or environment files.
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  const item = { slug: "reviewed-fixture", title: "تحديث جديد للعبة يضيف مراحل وتجربة تحكم جديدة للاعبين", summary: "أعلنت الشركة عن تحديث جديد للعبة يضيف مراحل وتعديلات على التحكم. نراجع هنا تفاصيل التغيير وما يعنيه للاعبين قبل بدء التجربة في الإصدار الجديد.", sourceName: "مصدر الاختبار", sourceUrl: "https://example.com/news", publishedAt: new Date().toISOString().slice(0, 10), sourcePublishedAt: new Date(Date.now() - 1000).toISOString() };
  const data = path.join(root, "src/data");
  fs.writeFileSync(path.join(data, "news.json"), JSON.stringify([item]));
  fs.writeFileSync(path.join(data, "news-editorial.json"), "{}");
  fs.writeFileSync(path.join(data, "news-publication-review.json"), "[]");
  const sentinel = "PLIXFY_OFFLINE_PREFLIGHT_NETWORK_FORBIDDEN";
  const preload = `data:text/javascript,${encodeURIComponent(`globalThis.fetch=async()=>{throw new Error("${sentinel}")}`)}`;
  const childEnvironment = { ...process.env, SOCIAL_PLATFORMS: "x", NODE_OPTIONS: `--import=${preload}` };
  for (const key of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_CHANNEL_ID", "DISCORD_WEBHOOK_URL", "BUFFER_API_KEY"]) delete childEnvironment[key];
  const run = () => spawnSync(process.execPath, [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--slot=news", "--date=2026-09-01"], { cwd: root, encoding: "utf8", env: childEnvironment });
  const unapproved = run();
  assert.equal(unapproved.status, 0, unapproved.stderr || unapproved.stdout);
  assert.match(unapproved.stdout, /nothing to send/);
  assert.doesNotMatch(unapproved.stdout + unapproved.stderr, new RegExp(sentinel));
  const reportFile = path.join(root, ".social/2026-09-01-news-delivery.json");
  assert.equal(fs.existsSync(reportFile), false);
  const evidencePath = "docs/editorial-evidence/fixture.md";
  const evidence = "Fixture evidence of source review and original analysis.";
  fs.mkdirSync(path.join(root, "docs/editorial-evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, evidencePath), evidence);
  fs.writeFileSync(path.join(data, "news-publication-review.json"), JSON.stringify([{ slug: item.slug, locale: "ar", contentSha256: newsContentHash(item), evidencePath, evidenceSha256: createHash("sha256").update(evidence).digest("hex"), reviewer: "Fixture reviewer", reviewedAt: new Date().toISOString() }]));
  const result = run();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(sentinel));
  assert.match(result.stdout, /offline mode skipped public URL verification/);
  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  assert.equal(report.dryRun, true);
  assert.deepEqual(report.connectedPublicPlatforms, []);
  assert.deepEqual(report.deliveries.map((delivery) => delivery.status), ["dry_run"]);
});

test("cloud dry-run selects an allowlisted evergreen page after 24 hours without approved news", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-evergreen-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  fs.writeFileSync(path.join(root, "src/data/news.json"), "[]");
  fs.writeFileSync(path.join(root, "src/data/news-editorial.json"), "{}");
  fs.writeFileSync(path.join(root, "src/data/news-publication-review.json"), "[]");
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [],
      recentNews: [],
      runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    }),
  );

  const date = "2026-09-10";
  const sentinel = "PLIXFY_EVERGREEN_NETWORK_FORBIDDEN";
  const preload = `data:text/javascript,${encodeURIComponent(`globalThis.fetch=async()=>{throw new Error("${sentinel}")}`)}`;
  const childEnvironment = { ...process.env, SOCIAL_PLATFORMS: "x", NODE_OPTIONS: `--import=${preload}` };
  for (const key of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_CHANNEL_ID", "DISCORD_WEBHOOK_URL", "BUFFER_API_KEY"]) delete childEnvironment[key];

  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", "--slot=news", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: childEnvironment },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(sentinel));
  const pack = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news.json`), "utf8"));
  assert.equal(pack.source.kind, "evergreen");
  assert.ok([
    "https://www.plixfy.com/guides/browser-games",
    "https://www.plixfy.com/all-games",
    "https://www.plixfy.com/category/puzzle",
  ].includes(pack.items[0].url));
  const report = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news-delivery.json`), "utf8"));
  assert.deepEqual(report.deliveries.map((delivery) => delivery.status), ["dry_run"]);
});

test("evergreen fallback skips a platform that already published today", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-daily-cap-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [], recentNews: [], runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      platformHistory: {
        x: [{ url: "https://www.plixfy.com/all-games", publishedAt: new Date().toISOString() }],
      },
    }),
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x,facebook" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const packFile = path.join(root, `.social/${date}-news.json`);
  assert.equal(fs.existsSync(packFile), true, result.stdout);
  const pack = JSON.parse(fs.readFileSync(packFile, "utf8"));
  assert.deepEqual(pack.items.map((item) => item.platform), ["facebook"]);
});

test("evergreen fallback does not reuse a platform link within seven days", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-link-cap-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [], recentNews: [], runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      platformHistory: {
        x: [{
          url: "https://www.plixfy.com/guides/browser-games",
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }],
      },
    }),
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pack = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news.json`), "utf8"));
  assert.equal(pack.items[0].platform, "x");
  assert.notEqual(pack.items[0].url, "https://www.plixfy.com/guides/browser-games");
});

test("evergreen fallback chooses the allowlisted page that can reach every eligible platform", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-fallback-coverage-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [], recentNews: [], runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      platformHistory: {
        x: [{
          url: "https://www.plixfy.com/guides/browser-games",
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }],
      },
    }),
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x,facebook" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pack = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news.json`), "utf8"));
  assert.deepEqual(pack.items.map((item) => item.platform), ["x", "facebook"]);
  assert.ok(pack.items.every((item) => item.url !== "https://www.plixfy.com/guides/browser-games"));
});

test("successful evergreen delivery records per-platform history without marking it as news", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-fallback-state-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [], recentNews: [], runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    }),
  );
  const preloadSource = `
    globalThis.fetch = async (url, options = {}) => {
      const value = String(url);
      if (value.includes("trends.google.com")) {
        return new Response("<rss><channel><item><title>ألعاب ألغاز</title><ht:approx_traffic>1000</ht:approx_traffic><pubDate>Wed, 10 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>", { status: 200 });
      }
      if (value.includes("api.telegram.org")) {
        return Response.json({ ok: true, result: { message_id: 42 } });
      }
      if (options.method === "HEAD" && value.startsWith("https://www.plixfy.com/")) {
        return new Response(null, { status: 200 });
      }
      throw new Error("Unexpected test request: " + value);
    };
  `;
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs")],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        SOCIAL_PLATFORMS: "telegram",
        TELEGRAM_BOT_TOKEN: "fixture-token",
        TELEGRAM_CHANNEL_ID: "fixture-channel",
        NODE_OPTIONS: `--import=data:text/javascript,${encodeURIComponent(preloadSource)}`,
      },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const state = JSON.parse(fs.readFileSync(path.join(root, ".social/cloud-state.json"), "utf8"));
  assert.equal(state.platformHistory.telegram.length, 1);
  assert.match(state.platformHistory.telegram[0].url, /^https:\/\/www\.plixfy\.com\//);
  assert.deepEqual(state.recentNews, []);
});

test("evergreen fallback honors documented manual posts outside cloud state", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-manual-history-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  fs.writeFileSync(
    path.join(root, "src/data/social-publication-history.json"),
    JSON.stringify([{
      platform: "x",
      url: "https://www.plixfy.com/guides/browser-games",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      externalUrl: "https://x.com/plixfycom/status/fixture",
    }]),
  );
  fs.writeFileSync(
    path.join(root, ".social/cloud-state.json"),
    JSON.stringify({
      recentGames: [], recentNews: [], runs: {},
      lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    }),
  );
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pack = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news.json`), "utf8"));
  assert.notEqual(pack.items[0].url, "https://www.plixfy.com/guides/browser-games");
});

test("documented manual history starts the 24-hour fallback clock when cloud state is missing", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-manual-clock-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  fs.writeFileSync(
    path.join(root, "src/data/social-publication-history.json"),
    JSON.stringify([{
      platform: "x",
      url: "https://www.plixfy.com/guides/browser-games",
      publishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    }]),
  );
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const packFile = path.join(root, `.social/${date}-news.json`);
  assert.equal(fs.existsSync(packFile), true, result.stdout);
  const pack = JSON.parse(fs.readFileSync(packFile, "utf8"));
  assert.equal(pack.source.kind, "evergreen");
});

test("a manual Plixfy news post counts toward today's platform limit without becoming fallback content", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-manual-news-history-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, "docs/editorial-evidence"), { recursive: true });
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  const item = {
    slug: "approved-cloud-fixture",
    title: "تحديث ألعاب موثّق للاختبار يضيف تفاصيل جديدة للاعبين",
    summary: "خبر اختباري موثّق بمراجعة مستقلة ومحتوى عربي أصلي يشرح التغيير دون ادعاءات غير مثبتة.",
    sourceName: "مصدر الاختبار",
    sourceUrl: "https://example.com/approved-cloud-fixture",
    publishedAt: new Date().toISOString().slice(0, 10),
    sourcePublishedAt: new Date(Date.now() - 1000).toISOString(),
  };
  const evidencePath = "docs/editorial-evidence/approved-cloud-fixture.md";
  const evidence = "Reviewed fixture evidence.";
  fs.writeFileSync(path.join(root, "src/data/news.json"), JSON.stringify([item]));
  fs.writeFileSync(path.join(root, "src/data/news-editorial.json"), "{}");
  fs.writeFileSync(path.join(root, evidencePath), evidence);
  fs.writeFileSync(path.join(root, "src/data/news-publication-review.json"), JSON.stringify([{
    slug: item.slug,
    locale: "ar",
    contentSha256: newsContentHash(item),
    evidencePath,
    evidenceSha256: createHash("sha256").update(evidence).digest("hex"),
    reviewer: "Fixture reviewer",
    reviewedAt: new Date().toISOString(),
  }]));
  fs.writeFileSync(path.join(root, "src/data/social-publication-history.json"), JSON.stringify([{
    platform: "x",
    url: "https://www.plixfy.com/news/manually-published-story",
    publishedAt: new Date().toISOString(),
  }]));
  fs.writeFileSync(path.join(root, ".social/cloud-state.json"), JSON.stringify({
    recentGames: [], recentNews: [], runs: {},
    lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  }));
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/cloud-social-runner.mjs"), "--dry-run", "--offline", `--date=${date}`],
    { cwd: root, encoding: "utf8", env: { ...process.env, SOCIAL_PLATFORMS: "x,facebook" } },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pack = JSON.parse(fs.readFileSync(path.join(root, `.social/${date}-news.json`), "utf8"));
  assert.equal(pack.source.kind, "news");
  assert.deepEqual(pack.items.map((entry) => entry.platform), ["facebook"]);
  assert.notEqual(pack.items[0].url, "https://www.plixfy.com/news/manually-published-story");
});

test("evergreen partial delivery saves the successful platform then fails the runner", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-partial-evergreen-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  for (const [name, value] of [["news.json", "[]"], ["news-editorial.json", "{}"], ["news-publication-review.json", "[]"], ["social-publication-history.json", "[]"]]) {
    fs.writeFileSync(path.join(root, "src/data", name), value);
  }
  fs.writeFileSync(path.join(root, ".social/cloud-state.json"), JSON.stringify({
    recentGames: [], recentNews: [], runs: {},
    lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  }));
  fs.writeFileSync(path.join(root, "scripts/social-publisher.mjs"), `
    import fs from "node:fs";
    import path from "node:path";
    const packFile = process.argv.find((value) => value.endsWith(".json") && !value.startsWith("--report="));
    const reportFile = process.argv.find((value) => value.startsWith("--report="))?.slice(9);
    const pack = JSON.parse(fs.readFileSync(packFile, "utf8"));
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, JSON.stringify({ deliveries: pack.items.map((item, index) => ({
      platform: item.platform,
      contentId: item.contentId,
      status: index === 0 ? "published_public" : "failed",
      public: index === 0,
      attemptedAt: new Date().toISOString(),
    })) }));
  `);
  const preloadSource = `globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("trends.google.com")) return new Response("<rss><channel><item><title>ألعاب</title><ht:approx_traffic>1000</ht:approx_traffic><pubDate>Wed, 10 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>", { status: 200 });
    if (options.method === "HEAD" && String(url).startsWith("https://www.plixfy.com/")) return new Response(null, { status: 200 });
    throw new Error("Unexpected test request: " + url);
  };`;
  const result = spawnSync(process.execPath, [path.join(root, "scripts/cloud-social-runner.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SOCIAL_PLATFORMS: "x,facebook",
      NODE_OPTIONS: `--import=data:text/javascript,${encodeURIComponent(preloadSource)}`,
    },
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /partial delivery/i);
  const state = JSON.parse(fs.readFileSync(path.join(root, ".social/cloud-state.json"), "utf8"));
  assert.equal(state.platformHistory.x.length, 1);
  assert.equal(state.platformHistory.facebook, undefined);
  assert.equal(state.runs["evergreen:browser-games-guide"].status, "partial");
});

test("news partial delivery saves the successful platform then fails the runner", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-cloud-partial-news-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"));
  fs.mkdirSync(path.join(root, "docs/editorial-evidence"), { recursive: true });
  fs.mkdirSync(path.join(root, ".social"));
  for (const name of fs.readdirSync(path.resolve("scripts"))) {
    if (name.endsWith(".mjs")) fs.copyFileSync(path.resolve("scripts", name), path.join(root, "scripts", name));
  }
  const item = {
    slug: "approved-partial-news-fixture",
    title: "خبر ألعاب موثّق لاختبار حفظ النجاح عند فشل قناة أخرى",
    summary: "ملخص عربي أصلي ومراجع يختبر التسليم الجزئي دون السماح لمحتوى غير معتمد بالمرور إلى النشر.",
    sourceName: "مصدر الاختبار",
    sourceUrl: "https://example.com/approved-partial-news-fixture",
    publishedAt: new Date().toISOString().slice(0, 10),
    sourcePublishedAt: new Date(Date.now() - 1000).toISOString(),
  };
  const evidencePath = "docs/editorial-evidence/approved-partial-news-fixture.md";
  const evidence = "Reviewed partial delivery fixture evidence.";
  fs.writeFileSync(path.join(root, "src/data/news.json"), JSON.stringify([item]));
  fs.writeFileSync(path.join(root, "src/data/news-editorial.json"), "{}");
  fs.writeFileSync(path.join(root, "src/data/social-publication-history.json"), "[]");
  fs.writeFileSync(path.join(root, evidencePath), evidence);
  fs.writeFileSync(path.join(root, "src/data/news-publication-review.json"), JSON.stringify([{
    slug: item.slug,
    locale: "ar",
    contentSha256: newsContentHash(item),
    evidencePath,
    evidenceSha256: createHash("sha256").update(evidence).digest("hex"),
    reviewer: "Fixture reviewer",
    reviewedAt: new Date().toISOString(),
  }]));
  fs.writeFileSync(path.join(root, ".social/cloud-state.json"), JSON.stringify({
    recentGames: [], recentNews: [], runs: {},
    lastPublishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  }));
  fs.writeFileSync(path.join(root, "scripts/social-publisher.mjs"), `
    import fs from "node:fs";
    import path from "node:path";
    const packFile = process.argv.find((value) => value.endsWith(".json") && !value.startsWith("--report="));
    const reportFile = process.argv.find((value) => value.startsWith("--report="))?.slice(9);
    const pack = JSON.parse(fs.readFileSync(packFile, "utf8"));
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, JSON.stringify({ deliveries: pack.items.map((entry, index) => ({
      platform: entry.platform,
      contentId: entry.contentId,
      status: index === 0 ? "published_public" : "failed",
      public: index === 0,
      attemptedAt: new Date().toISOString(),
    })) }));
  `);
  const preloadSource = `globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("trends.google.com")) return new Response("<rss><channel><item><title>ألعاب</title><ht:approx_traffic>1000</ht:approx_traffic><pubDate>Wed, 10 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>", { status: 200 });
    if (options.method === "HEAD" && String(url).startsWith("https://www.plixfy.com/")) return new Response(null, { status: 200 });
    throw new Error("Unexpected test request: " + url);
  };`;
  const result = spawnSync(process.execPath, [path.join(root, "scripts/cloud-social-runner.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      SOCIAL_PLATFORMS: "x,facebook",
      NODE_OPTIONS: `--import=data:text/javascript,${encodeURIComponent(preloadSource)}`,
    },
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /partial delivery/i);
  const state = JSON.parse(fs.readFileSync(path.join(root, ".social/cloud-state.json"), "utf8"));
  assert.deepEqual(state.recentNews, []);
  assert.equal(state.platformHistory.x.length, 1);
  assert.equal(state.platformHistory.facebook, undefined);
  assert.equal(state.runs[`news:${item.slug}`].status, "partial");
});
