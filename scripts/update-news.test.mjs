import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  expireStaleNewsDrafts,
  main,
  oldestPendingNewsDraft,
  pendingNewsDraftCount,
} from "./update-news.mjs";

test("pending draft guard counts only reviewable news drafts", () => {
  const drafts = [
    { status: "pending_review", generatedAt: "2026-09-08T08:00:00.000Z" },
    { status: "rejected", generatedAt: "2026-09-07T08:00:00.000Z" },
    { status: "pending_review", generatedAt: "2026-09-09T08:00:00.000Z" },
    {},
  ];
  assert.equal(pendingNewsDraftCount(drafts), 2);
  assert.equal(oldestPendingNewsDraft(drafts), "2026-09-08T08:00:00.000Z");
});

test("pending draft guard handles an empty or malformed queue safely", () => {
  assert.equal(pendingNewsDraftCount([]), 0);
  assert.equal(oldestPendingNewsDraft([]), null);
  assert.equal(oldestPendingNewsDraft([{ status: "pending_review", generatedAt: "not-a-date" }]), null);
});

test("stale and undated pending drafts leave the active editorial queue without being deleted", () => {
  const drafts = [
    { slug: "old", status: "pending_review", generatedAt: "2026-09-18T07:59:59.000Z" },
    { slug: "boundary", status: "pending_review", generatedAt: "2026-09-18T08:00:00.000Z" },
    { slug: "fresh", status: "pending_review", generatedAt: "2026-09-20T08:00:00.000Z" },
    { slug: "undated", status: "pending_review", generatedAt: "invalid" },
    { slug: "reviewed", status: "rejected", generatedAt: "2026-09-01T08:00:00.000Z" },
  ];

  const result = expireStaleNewsDrafts(drafts, {
    now: new Date("2026-09-20T08:00:00.000Z"),
    ttlHours: 48,
  });

  assert.equal(result.changed, 2);
  assert.deepEqual(result.drafts.map(({ slug, status, expiredReason }) => ({ slug, status, expiredReason })), [
    { slug: "old", status: "expired", expiredReason: "editorial_window_elapsed" },
    { slug: "boundary", status: "pending_review", expiredReason: undefined },
    { slug: "fresh", status: "pending_review", expiredReason: undefined },
    { slug: "undated", status: "expired", expiredReason: "invalid_generated_at" },
    { slug: "reviewed", status: "rejected", expiredReason: undefined },
  ]);
  assert.equal(result.drafts.length, drafts.length);
  assert.equal(pendingNewsDraftCount(result.drafts), 2);
  assert.equal(result.drafts[0].expiredAt, "2026-09-20T08:00:00.000Z");
});

test("a full fresh review queue skips source fetching and leaves drafts unchanged", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-guard-"));
  const drafts = Array.from({ length: 3 }, (_, index) => ({
    slug: `draft-${index}`,
    status: "pending_review",
    generatedAt: `2026-09-21T0${index + 7}:00:00.000Z`,
    content: { slug: `draft-${index}` },
  }));
  const draftFile = path.join(root, "content-drafts", "news.json");
  fs.mkdirSync(path.dirname(draftFile), { recursive: true });
  fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "data", "news.json"), "[]\n");
  fs.writeFileSync(draftFile, JSON.stringify(drafts, null, 2) + "\n");
  const before = fs.readFileSync(draftFile, "utf8");
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("guard should prevent fetch"); };
  try {
    await main({ root, now: new Date("2026-09-21T10:00:00.000Z") });
    assert.equal(fetchCalls, 0);
    assert.equal(fs.readFileSync(draftFile, "utf8"), before);
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a full fresh review queue records an editorial-wait status for the review artifact", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-status-"));
  const drafts = Array.from({ length: 3 }, (_, index) => ({
    slug: `draft-${index}`,
    status: "pending_review",
    generatedAt: `2026-09-21T0${index + 7}:00:00.000Z`,
    content: { slug: `draft-${index}` },
  }));
  const draftFile = path.join(root, "content-drafts", "news.json");
  fs.mkdirSync(path.dirname(draftFile), { recursive: true });
  fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "data", "news.json"), "[]\n");
  fs.writeFileSync(draftFile, JSON.stringify(drafts, null, 2) + "\n");
  try {
    await main({ root, now: new Date("2026-09-21T10:00:00.000Z") });
    const status = JSON.parse(fs.readFileSync(path.join(root, "content-drafts", "news-status.json"), "utf8"));
    const { updatedAt, ...withoutTimestamp } = status;
    assert.deepEqual(withoutTimestamp, {
      status: "waiting_for_editorial",
      pendingCount: 3,
      limit: 3,
      oldestPendingAt: "2026-09-21T07:00:00.000Z",
      generationAttempted: false,
      nextAction: "editorial_review_required",
    });
    assert.ok(Number.isFinite(Date.parse(updatedAt)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("main expires an old backlog, persists the audit trail, and resumes feed checks", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-expiry-"));
  const drafts = Array.from({ length: 12 }, (_, index) => ({
    slug: `old-${index}`,
    status: "pending_review",
    generatedAt: "2026-09-01T08:00:00.000Z",
    content: { slug: `old-${index}`, sourceUrl: `https://example.com/${index}` },
  }));
  const draftDirectory = path.join(root, "content-drafts");
  fs.mkdirSync(draftDirectory, { recursive: true });
  fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "data", "news.json"), "[]\n");
  fs.writeFileSync(path.join(draftDirectory, "news.json"), JSON.stringify(drafts, null, 2) + "\n");
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return { ok: true, text: async () => "" };
  };
  try {
    await main({ root, now: new Date("2026-09-21T10:00:00.000Z") });
    const persisted = JSON.parse(fs.readFileSync(path.join(draftDirectory, "news.json"), "utf8"));
    assert.equal(fetchCalls, 8);
    assert.equal(persisted.length, 12);
    assert.equal(persisted.every((draft) => draft.status === "expired"), true);
    assert.equal(persisted.every((draft) => draft.expiredReason === "editorial_window_elapsed"), true);
    assert.equal(fs.existsSync(path.join(draftDirectory, "news-status.json")), false);
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a malformed queue clears a stale editorial-wait status before failing closed", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-status-corrupt-"));
  const draftDirectory = path.join(root, "content-drafts");
  fs.mkdirSync(draftDirectory, { recursive: true });
  fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "data", "news.json"), "[]\n");
  fs.writeFileSync(path.join(draftDirectory, "news.json"), "{not-json");
  fs.writeFileSync(path.join(draftDirectory, "news-status.json"), JSON.stringify({ status: "waiting_for_editorial" }) + "\n");
  try {
    await assert.rejects(main({ root }));
    assert.equal(fs.existsSync(path.join(draftDirectory, "news-status.json")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a resumed queue clears a stale editorial-wait status before checking feeds", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-status-clear-"));
  const drafts = Array.from({ length: 2 }, (_, index) => ({
    slug: `draft-${index}`,
    status: "pending_review",
    generatedAt: `2026-09-21T0${index + 7}:00:00.000Z`,
    content: { slug: `draft-${index}` },
  }));
  const draftDirectory = path.join(root, "content-drafts");
  fs.mkdirSync(draftDirectory, { recursive: true });
  fs.mkdirSync(path.join(root, "src", "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "data", "news.json"), "[]\n");
  fs.writeFileSync(path.join(draftDirectory, "news.json"), JSON.stringify(drafts, null, 2) + "\n");
  fs.writeFileSync(path.join(draftDirectory, "news-status.json"), JSON.stringify({ status: "waiting_for_editorial" }) + "\n");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, text: async () => "" });
  try {
    await main({ root, now: new Date("2026-09-21T10:00:00.000Z") });
    assert.equal(fs.existsSync(path.join(draftDirectory, "news-status.json")), false);
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
