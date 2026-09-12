import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main, oldestPendingNewsDraft, pendingNewsDraftCount } from "./update-news.mjs";

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

test("a full review queue skips source fetching and leaves drafts unchanged", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-news-guard-"));
  const drafts = Array.from({ length: 12 }, (_, index) => ({
    slug: `draft-${index}`,
    status: "pending_review",
    generatedAt: `2026-09-0${(index % 8) + 1}T08:00:00.000Z`,
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
    await main({ root });
    assert.equal(fetchCalls, 0);
    assert.equal(fs.readFileSync(draftFile, "utf8"), before);
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
