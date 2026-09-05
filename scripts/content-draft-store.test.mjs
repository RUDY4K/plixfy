import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { contentHash, draftFile, readDrafts, saveDrafts } from "./content-draft-store.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidate = (slug, extra = {}) => ({ content: { slug, summary: "Unverified draft", ...extra }, evidence: { source: "fixture" } });
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-drafts-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("draft generation preserves published records and all earlier drafts without retention caps", (t) => {
  const root = fixture(t);
  const published = Array.from({ length: 100 }, (_, index) => ({ slug: `live-${index}`, reviewedAt: "2026-09-02" }));
  const original = JSON.stringify(published);
  fs.writeFileSync(path.join(root, "published.json"), original);
  saveDrafts(root, "news", Array.from({ length: 70 }, (_, i) => candidate(`draft-${i}`)), { published });
  saveDrafts(root, "news", [candidate("another"), candidate("live-0")], { published });
  assert.equal(readDrafts(root, "news").length, 71);
  assert.equal(JSON.stringify(published), original);
  assert.equal(fs.readFileSync(path.join(root, "published.json"), "utf8"), original);
});

test("duplicates by slug and source URL cannot overwrite earlier drafts", (t) => {
  const root = fixture(t);
  saveDrafts(root, "news", [candidate("one", { sourceUrl: "https://example.com/source" }), candidate("two", { sourceUrl: "https://example.com/source" })]);
  const before = fs.readFileSync(draftFile(root, "news"), "utf8");
  assert.equal(saveDrafts(root, "news", [candidate("one", { summary: "replacement" })]), 0);
  assert.equal(fs.readFileSync(draftFile(root, "news"), "utf8"), before);
});

test("invalid batches leave existing storage unchanged and release locks", (t) => {
  const root = fixture(t);
  saveDrafts(root, "blog", [candidate("existing")]);
  const before = fs.readFileSync(draftFile(root, "blog"), "utf8");
  assert.throws(() => saveDrafts(root, "blog", [candidate("valid"), { content: {} }]), /slug/);
  assert.equal(fs.readFileSync(draftFile(root, "blog"), "utf8"), before);
  assert.deepEqual(fs.readdirSync(path.dirname(draftFile(root, "blog"))), ["blog.json"]);
});

test("corrupt queue is never silently replaced; concurrent write fails closed", (t) => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, "content-drafts"));
  const file = draftFile(root, "news");
  fs.writeFileSync(file, "broken");
  assert.throws(() => saveDrafts(root, "news", [candidate("one")]));
  assert.equal(fs.readFileSync(file, "utf8"), "broken");
  fs.writeFileSync(`${file}.lock`, "");
  assert.throws(() => saveDrafts(root, "news", [candidate("one")]), /EEXIST/);
  assert.equal(fs.readFileSync(file, "utf8"), "broken");
});

test("translation revisions require a base hash and model approval fields grant nothing", (t) => {
  const root = fixture(t);
  assert.throws(() => saveDrafts(root, "news-en-revisions", [candidate("existing")], { revision: true }), /base hash/);
  saveDrafts(root, "news-en-revisions", [{ ...candidate("existing", { status: "published", approved: true }), status: "published", baseHash: contentHash({ title: "Original" }) }], { revision: true });
  const [draft] = readDrafts(root, "news-en-revisions");
  assert.equal(draft.status, "pending_review");
  assert.equal(draft.approved, undefined);
  assert.equal(draft.baseHash, contentHash({ title: "Original" }));
});

test("all generation entrypoints use draft storage and contain no direct content writes", () => {
  for (const name of ["update-news", "update-blog", "backfill-news-en", "generate-en-blog"]) {
    const source = fs.readFileSync(path.join(repository, "scripts", `${name}.mjs`), "utf8");
    assert.match(source, /saveDrafts\(/, name);
    assert.doesNotMatch(source, /fs\.writeFileSync|git push|submit-indexnow/, name);
  }
  const workflow = fs.readFileSync(path.join(repository, ".github/workflows/content-engine.yml"), "utf8");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /upload-artifact/);
  assert.doesNotMatch(workflow, /git (?:push|commit|add)|telegram-alert|submit-indexnow/);
  const local = fs.readFileSync(path.join(repository, "scripts/news-cron.cmd"), "utf8");
  assert.doesNotMatch(local, /git (?:push|commit|add)|submit-indexnow|telegram-alert/);
});

test("blog entrypoint with offline model fixture drafts output without modifying live data", (t) => {
  const root = fixture(t);
  for (const directory of ["scripts", "src/data", "src/lib"]) fs.mkdirSync(path.join(root, directory), { recursive: true });
  for (const name of ["update-blog.mjs", "content-draft-store.mjs"]) {
    fs.copyFileSync(path.join(repository, "scripts", name), path.join(root, "scripts", name));
  }
  const record = { slug: "legacy-reviewed", reviewedAt: "2026-09-02" };
  const publishedFile = path.join(root, "src/data/blog-generated.json");
  const original = JSON.stringify([record]);
  fs.writeFileSync(publishedFile, original);
  fs.writeFileSync(path.join(root, "src/lib/blog.ts"), "// Existing public blog source");
  fs.writeFileSync(path.join(root, "src/data/playgama-games.json"), JSON.stringify(Array.from({ length: 4 }, (_, index) => ({ slug: `game-${index}`, title: `Game ${index}`, categorySlug: "casual" }))));
  fs.writeFileSync(path.join(root, "scripts/gemini-content-client.mjs"), `
export async function runGeminiJson({ validate }) {
  const paragraph = "fixture ".repeat(100);
  const content = { title: "Fixture title for a drafted article", h1: "عنوان عربي لاختبار مسودة فقط", description: "A fixture description sufficiently long", keywords: ["1","2","3","4","5"], intro: paragraph,
    sections: Array.from({length:3}, () => ({heading: "Fixture", paragraphs:[paragraph,paragraph]})), faq: Array.from({length:3}, () => ({q:"Question",a:"Answer"})) };
  const record = { slug: "alaab-browser-lil-jawal-bidon-tahmil-2026", relatedCategory:"casual", ar:content,en:content };
  validate(record); return record;
}`);
  const result = spawnSync(process.execPath, [path.join(root, "scripts/update-blog.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(publishedFile, "utf8"), original);
  const [draft] = readDrafts(root, "blog");
  assert.equal(draft.status, "pending_review");
  assert.equal(draft.content.publishedAt, undefined);
  assert.equal(draft.evidence.catalogue.length, 4);
});
