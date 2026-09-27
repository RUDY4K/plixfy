import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildOriginalContentBrief,
  markBriefQueued,
  parseOfficialFeed,
  recordFailedAttempt,
  selectNextFastNews,
} from "./fast-social-news.mjs";
import { recoverFastNewsState } from "./recover-fast-news-state.mjs";

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

test("official story identity remains stable when a feed changes only its GUID", () => {
  const source = { id: "xbox-wire", nameAr: "إكس بوكس", allowedHosts: ["news.xbox.com"] };
  const first = parseOfficialFeed(`<rss><channel><item><title>Same story</title><link>https://news.xbox.com/en-us/same-story/</link><guid>old-guid</guid><pubDate>Tue, 22 Sep 2026 08:40:00 GMT</pubDate></item></channel></rss>`, source);
  const second = parseOfficialFeed(`<rss><channel><item><title>Same story</title><link>https://news.xbox.com/en-us/same-story/</link><guid>new-guid</guid><pubDate>Tue, 22 Sep 2026 08:40:00 GMT</pubDate></item></channel></rss>`, source);
  assert.equal(first[0].id, second[0].id);
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

test("the default editorial window survives a five-hour scheduler delay", () => {
  const delayedNow = new Date("2026-09-22T14:00:00.000Z");
  const item = {
    id: "five-hours-old",
    publishedAt: "2026-09-22T09:00:00.000Z",
  };
  assert.equal(selectNextFastNews([item], { published: {}, queued: {} }, { now: delayedNow })?.id, item.id);
});

test("queued stories are not surfaced again", () => {
  const item = { id: "queued-story", publishedAt: now.toISOString() };
  assert.equal(selectNextFastNews([item], { published: {}, queued: { [item.id]: { queuedAt: now.toISOString() } } }, { now }), null);
});

test("a known canonical URL is not queued again under a different legacy id", () => {
  const item = { id: "new-id", url: "https://news.xbox.com/en-us/same-story/", publishedAt: now.toISOString() };
  const state = { published: {}, queued: { "legacy-id": { queuedAt: now.toISOString(), url: item.url } } };
  assert.equal(selectNextFastNews([item], state, { now }), null);
});

test("research briefs require human originality and never contain publish-ready copy", () => {
  const item = {
    id: "xbox-abc",
    title: "Official title",
    description: "Official source description",
    url: "https://news.xbox.com/en-us/update/",
    sourceId: "xbox-wire",
    sourceNameAr: "إكس بوكس",
    publishedAt: now.toISOString(),
  };
  const brief = buildOriginalContentBrief({ item, queuedAt: now });
  assert.equal(brief.status, "awaiting-human-originality-review");
  assert.equal(brief.publishMode, "manual-only");
  assert.equal(brief.source.url, item.url);
  assert.equal(brief.source.title, item.title);
  assert.ok(brief.editorialQuestions.length >= 4);
  assert.ok(brief.requiredEvidence.includes("plixfy-original-perspective"));
  assert.ok(brief.requiredEvidence.includes("rights-cleared-media-or-no-media"));
  assert.equal("text" in brief, false);
  assert.equal("items" in brief, false);
  assert.equal("image" in brief, false);
  assert.equal("video" in brief, false);
});

test("queue state records a reviewed source without claiming publication", () => {
  const item = { id: "xbox-abc", url: "https://news.xbox.com/en-us/update/" };
  const next = markBriefQueued({ version: 1, published: {}, queued: {} }, item, now);
  assert.equal(next.queued[item.id].url, item.url);
  assert.equal(next.queued[item.id].queuedAt, now.toISOString());
  assert.deepEqual(next.published, {});
});

test("failed queue attempts preserve version-two queue state", () => {
  const item = { id: "xbox-failed", url: "https://news.xbox.com/en-us/update/" };
  const queued = { existing: { queuedAt: now.toISOString(), url: item.url } };
  const next = recordFailedAttempt({ version: 2, published: {}, queued }, item, new Error("temporary failure"), now);
  assert.equal(next.version, 2);
  assert.deepEqual(next.queued, queued);
  assert.equal(next.attempts[item.id].count, 1);
  assert.equal(next.attempts[item.id].lastAttemptAt, now.toISOString());
});

test("artifact recovery restores both flat and legacy nested state layouts", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-fast-state-recovery-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, "destination", ".social", "fast-news-state.json");
  const expected = { version: 2, published: {}, queued: { story: { url: "https://news.xbox.com/story" } }, attempts: {} };

  const flat = path.join(root, "flat");
  fs.mkdirSync(flat, { recursive: true });
  fs.writeFileSync(path.join(flat, "fast-news-state.json"), JSON.stringify(expected));
  assert.equal(recoverFastNewsState(flat, destination), destination);
  assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), expected);

  const nested = path.join(root, "nested");
  fs.mkdirSync(path.join(nested, ".social"), { recursive: true });
  const legacy = { ...expected, queued: { legacy: { url: "https://blog.playstation.com/story" } } };
  fs.writeFileSync(path.join(nested, ".social", "fast-news-state.json"), JSON.stringify(legacy));
  assert.equal(recoverFastNewsState(nested, destination), destination);
  assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), legacy);
});

test("artifact recovery rejects malformed state without replacing a valid destination", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-fast-state-invalid-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, ".social", "fast-news-state.json");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify({ version: 2, published: {}, queued: {}, attempts: {} }));
  const artifact = path.join(root, "artifact");
  fs.mkdirSync(artifact);
  fs.writeFileSync(path.join(artifact, "fast-news-state.json"), "not json");
  assert.throws(() => recoverFastNewsState(artifact, destination), /valid JSON/);
  assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), { version: 2, published: {}, queued: {}, attempts: {} });
});

test("the fast-news workflow creates review briefs and cannot publish to X", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/fast-social-news.yml", import.meta.url), "utf8");
  assert.match(workflow, /cron: "\*\/5 \* \* \* \*"/);
  assert.match(workflow, /queue one original-content brief/i);
  assert.doesNotMatch(workflow, /BUFFER_API_KEY|BUFFER_ORGANIZATION_ID|SOCIAL_PLATFORMS/);
  assert.doesNotMatch(workflow, /social-publisher\.mjs/);
  assert.match(workflow, /original-content-brief/);
  const briefUpload = workflow.indexOf("Upload original-content brief");
  const alert = workflow.indexOf("Alert admin that a brief is ready for human review");
  const cacheSave = workflow.indexOf("Save queued-story state after brief delivery");
  const durableState = workflow.indexOf("Preserve durable idempotency state");
  const failedAttemptSave = workflow.indexOf("Save bounded failed-attempt state");
  assert.ok(failedAttemptSave > -1 && failedAttemptSave < briefUpload);
  assert.match(workflow, /always\(\)\s*&&\s*steps\.fast-news\.outcome == 'failure'\s*&&\s*steps\.fast-news\.outputs\.state_changed == 'true'/);
  assert.ok(briefUpload > -1 && alert > briefUpload);
  assert.ok(cacheSave > alert && durableState > cacheSave);
  assert.match(workflow, /always\(\)\s*&&\s*steps\.fast-news\.outputs\.state_changed == 'true'\s*&&\s*steps\.brief_artifact\.outcome == 'success'\s*&&\s*steps\.brief_alert\.outcome == 'success'/);
  assert.match(workflow, /unzip -q -o \/tmp\/fast-news-state\.zip -d \/tmp\/fast-news-state-artifact/);
  assert.match(workflow, /node scripts\/recover-fast-news-state\.mjs \/tmp\/fast-news-state-artifact \.social\/fast-news-state\.json/);
  assert.match(workflow, /\.social\/fast-news-state\.json/);
  assert.match(workflow, /fast-news-state/);
  assert.doesNotMatch(workflow, /npm ci/);
});
