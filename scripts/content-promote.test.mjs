import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { saveDrafts, readDrafts, contentHash } from "./content-draft-store.mjs";
import { promoteContent, fileHash } from "./content-promote.mjs";
import { isNewsPublicationApproved } from "./news-publication.mjs";

function setup(t, revision = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-review-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
  const original = { slug: "old", title: "Existing reviewed article" };
  fs.writeFileSync(path.join(root, "src/data/news.json"), JSON.stringify([original]));
  fs.mkdirSync(path.join(root, "docs/editorial-evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/data/news-publication-review.json"), "[]");
  fs.writeFileSync(path.join(root, "src/data/news-editorial.json"), "{}");
  fs.writeFileSync(path.join(root, "docs/editorial-evidence/fixture.md"), "2026-09-05: Fixture source checks and original reporting notes.");
  const kind = revision ? "news-en-revisions" : "news";
  const content = revision ? { slug: "old", titleEn: "Reviewed English title", summaryEn: "Reviewed English summary" } : { slug: "new", title: "Arabic title", summary: "Arabic report", titleEn: "English title", summaryEn: "English report", sourceName: "Source", sourceUrl: "https://example.com/article" };
  saveDrafts(root, kind, [{ content, evidence: { source: "fixture" }, ...(revision ? { baseHash: contentHash(original) } : {}) }], { revision });
  const draft = readDrafts(root, kind)[0];
  const review = { kind, slug: content.slug, draftHash: draft.contentHash, reviewer: "Fixture reviewer", reviewedAt: new Date().toISOString(), originalValue: "Verified source and added original reporting", locales: ["en"], evidenceFile: "docs/editorial-evidence/fixture.md", evidenceHash: fileHash(fs.readFileSync(path.join(root, "docs/editorial-evidence/fixture.md"))) };
  return { root, review, original, target: path.join(root, "src/data/news.json") };
}

test("explicit reviewed promotion preserves old records and retains draft evidence", (t) => {
  const { root, review, original, target } = setup(t);
  const result = promoteContent(root, review);
  const published = JSON.parse(fs.readFileSync(target));
  assert.deepEqual(published[1], original);
  assert.equal(published[0].slug, "new");
  assert.equal(published[0].publishedAt, review.reviewedAt.slice(0, 10));
  assert.equal(readDrafts(root, "news").length, 1);
  assert.equal(fs.existsSync(path.join(root, result.receipt)), true);
  const registry = JSON.parse(fs.readFileSync(path.join(root, "src/data/news-publication-review.json")));
  assert.equal(isNewsPublicationApproved(published[0], "en", registry, root), true);
  assert.equal(isNewsPublicationApproved(published[0], "ar", registry, root), false);
  assert.throws(() => promoteContent(root, review), /Already published/);
});

test("legacy English revision cannot replace a module or remove its publication gate", (t) => {
  const { root, review, target } = setup(t);
  const before = fs.readFileSync(target, "utf8");
  assert.throws(() => promoteContent(root, { ...review, kind: "blog-en-revisions" }), /whole-module replacement is disabled/);
  assert.equal(fs.readFileSync(target, "utf8"), before);
});

test("blog registry hashes normalized rendered records for each explicitly reviewed locale", (t) => {
  const { root, review } = setup(t);
  fs.writeFileSync(path.join(root, "src/data/blog-generated.json"), "[]");
  fs.writeFileSync(path.join(root, "src/data/blog-publication-review.json"), "[]");
  const c = { title: "Observed game", h1: "Observed game", description: "Test", keywords: [], intro: "Observed controls", sections: [{ heading: "Controls", paragraphs: ["Tap tile"] }], faq: [] };
  saveDrafts(root, "blog", [{ content: { slug: "guide", relatedCategory: "puzzle", relatedCategoryTitle: "Puzzles", ar: c, en: c }, evidence: { source: "fixture" } }]);
  const draft = readDrafts(root, "blog")[0];
  promoteContent(root, { ...review, kind: "blog", slug: "guide", draftHash: draft.contentHash, locales: ["ar", "en"], reviewedAt: new Date().toISOString() });
  const [post] = JSON.parse(fs.readFileSync(path.join(root, "src/data/blog-generated.json")));
  const reviews = JSON.parse(fs.readFileSync(path.join(root, "src/data/blog-publication-review.json")));
  const en = { slug: post.slug, title: c.title, h1: c.h1, description: c.description, keywords: c.keywords, intro: c.intro, sections: c.sections, faq: c.faq, relatedCategory: post.relatedCategory, publishedAt: post.publishedAt, updatedAt: post.updatedAt };
  const ar = { slug: post.slug, title: c.title, h1: c.h1, description: c.description, publishedAt: post.publishedAt, updatedAt: post.updatedAt, keywords: c.keywords, intro: c.intro, sections: c.sections, faq: c.faq, relatedCategory: post.relatedCategory, relatedCategoryTitle: post.relatedCategoryTitle };
  assert.equal(reviews.find((entry) => entry.locale === "en").contentSha256, contentHash(en));
  assert.equal(reviews.find((entry) => entry.locale === "ar").contentSha256, contentHash(ar));
});

test("malformed blog fields leave content and review registry unchanged", (t) => {
  for (const invalid of [{ faq: undefined }, { keywords: "not array" }, { sections: [{ heading: "Controls", paragraphs: "not array" }] }]) {
    const { root, review } = setup(t);
    const target = path.join(root, "src/data/blog-generated.json");
    const registry = path.join(root, "src/data/blog-publication-review.json");
    fs.writeFileSync(target, "[]"); fs.writeFileSync(registry, "[]");
    const c = { title: "Title", h1: "Heading", description: "Description", keywords: [], intro: "Intro", sections: [{ heading: "Controls", paragraphs: ["Click"] }], faq: [], ...invalid };
    saveDrafts(root, "blog", [{ content: { slug: "invalid", relatedCategory: "puzzle", relatedCategoryTitle: "Puzzles", ar: c, en: c }, evidence: {} }]);
    const draft = readDrafts(root, "blog")[0];
    assert.throws(() => promoteContent(root, { ...review, kind: "blog", slug: "invalid", draftHash: draft.contentHash, reviewedAt: new Date().toISOString() }), /Invalid/);
    assert.equal(fs.readFileSync(target, "utf8"), "[]");
    assert.equal(fs.readFileSync(registry, "utf8"), "[]");
  }
});

test("missing review, stale draft, and changed evidence cannot alter published data", (t) => {
  const { root, review, target } = setup(t);
  const before = fs.readFileSync(target, "utf8");
  assert.throws(() => promoteContent(root, { ...review, reviewer: "" }), /reviewer/);
  assert.throws(() => promoteContent(root, { ...review, draftHash: "bad" }), /Draft hash/);
  assert.throws(() => promoteContent(root, { ...review, reviewedAt: "2020-01-01" }), /predates/);
  fs.mkdirSync(path.join(root, "docs/editorial-evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/data/news-publication-review.json"), "[]");
  fs.writeFileSync(path.join(root, "src/data/news-editorial.json"), "{}");
  fs.writeFileSync(path.join(root, "docs/editorial-evidence/fixture.md"), "Changed after review");
  assert.throws(() => promoteContent(root, review), /Evidence hash/);
  assert.equal(fs.readFileSync(target, "utf8"), before);
});

test("revision promotes only reviewed language fields and rejects stale published source", (t) => {
  const { root, review, original, target } = setup(t, true);
  fs.writeFileSync(target, JSON.stringify([{ ...original, title: "Edited since drafting" }]));
  assert.throws(() => promoteContent(root, review), /changed since drafting/);
  fs.writeFileSync(target, JSON.stringify([original]));
  promoteContent(root, review);
  const [item] = JSON.parse(fs.readFileSync(target));
  assert.equal(item.title, original.title);
  assert.equal(item.titleEn, "Reviewed English title");
});

test("locked target fails without partial file or receipt writes", (t) => {
  const { root, review, target } = setup(t);
  const before = fs.readFileSync(target, "utf8");
  fs.writeFileSync(`${target}.review.lock`, "");
  assert.throws(() => promoteContent(root, review), /EEXIST/);
  assert.equal(fs.readFileSync(target, "utf8"), before);
  assert.equal(fs.existsSync(path.join(root, "content-reviews")), false);
});
