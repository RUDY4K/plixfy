import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/lib/blog-publication.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const post = { slug: "sample", title: "Observed controls", sections: [{ heading: "Controls", paragraphs: ["Click a tile."] }] };
const evidence = "Observed the initial board and clicked a tile. Browser and date recorded.\n";
const review = {
  slug: post.slug, locale: "en", contentSha256: hash(JSON.stringify(post)),
  evidencePath: "docs/editorial-evidence/sample.md", evidenceSha256: hash(evidence),
  reviewer: "Test fixture reviewer", reviewedAt: "2026-01-01T00:00:00Z",
};

function loadModule(reviews, evidenceText = evidence) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, process,
    require: (specifier) => {
      if (specifier === "@/data/blog-publication-review.json") return reviews;
      if (specifier === "node:fs") return { readFileSync: (filename) => {
        assert.equal(filename, path.join(process.cwd(), review.evidencePath));
        if (evidenceText === null) throw new Error("Missing evidence");
        return Buffer.from(evidenceText);
      } };
      return require(specifier);
    },
  });
  return exports;
}

function load(reviews, evidenceText = evidence) {
  return loadModule(reviews, evidenceText).isBlogPublicationApproved;
}

test("publication requires approval for the exact locale and full article content", () => {
  assert.equal(load([])(post, "en"), false);
  assert.equal(load([review])(post, "en"), true);
  assert.equal(load([review])(post, "ar"), false);
  assert.equal(load([review])({ ...post, title: "Changed title" }, "en"), false);
  assert.equal(load([review])({ ...post, sections: [{ heading: "Controls", paragraphs: ["Unsupported changed claim"] }] }, "en"), false);
});

test("publication rejects stale, missing, empty and out-of-scope evidence", () => {
  assert.equal(load([review], "Changed evidence")(post, "en"), false);
  assert.equal(load([review], null)(post, "en"), false);
  assert.equal(load([{ ...review, evidenceSha256: hash("   ") }], "   ")(post, "en"), false);
  for (const evidencePath of ["../elsewhere.md", "docs/editorial-evidence/../../elsewhere.md", "docs/other.md"]) {
    assert.equal(load([{ ...review, evidencePath }])(post, "en"), false);
  }
});

test("publication rejects ambiguous reviews and missing review accountability", () => {
  assert.equal(load(null)(post, "en"), false);
  assert.equal(load([null])(post, "en"), false);
  assert.equal(load([{ ...review, reviewer: 17 }])(post, "en"), false);
  assert.equal(load([review, review])(post, "en"), false);
  assert.equal(load([{ ...review, reviewer: " " }])(post, "en"), false);
  assert.equal(load([{ ...review, reviewedAt: "invalid" }])(post, "en"), false);
  assert.equal(load([{ ...review, reviewedAt: "2999-01-01" }])(post, "en"), false);
});

test("search eligibility is explicit and inherits every exact publication check", () => {
  const eligibleReview = { ...review, searchEligible: true };
  assert.equal(loadModule([review]).isBlogSearchEligible(post, "en"), false);
  assert.equal(loadModule([{ ...review, searchEligible: false }]).isBlogSearchEligible(post, "en"), false);
  assert.equal(loadModule([eligibleReview]).isBlogSearchEligible(post, "en"), true);
  assert.equal(loadModule([eligibleReview]).isBlogSearchEligible(post, "ar"), false);
  assert.equal(loadModule([eligibleReview]).isBlogSearchEligible({ ...post, title: "Changed" }, "en"), false);
  assert.equal(loadModule([eligibleReview, eligibleReview]).isBlogSearchEligible(post, "en"), false);
  assert.equal(loadModule([eligibleReview], "Changed evidence").isBlogSearchEligible(post, "en"), false);
});

test("search alternates keep each eligible locale independent and choose a safe default", () => {
  const en = { ...review, searchEligible: true };
  const ar = { ...en, locale: "ar" };
  const alternates = (reviews) => JSON.parse(JSON.stringify(
    loadModule(reviews).getBlogSearchAlternates({ ar: post, en: post }),
  ));
  const arUrl = "https://www.plixfy.com/blog/sample";
  const enUrl = "https://www.plixfy.com/en/blog/sample";

  assert.deepEqual(alternates([ar]), { ar: arUrl, "x-default": arUrl });
  assert.deepEqual(alternates([en]), { en: enUrl, "x-default": enUrl });
  assert.deepEqual(alternates([ar, en]), { ar: arUrl, en: enUrl, "x-default": arUrl });
  assert.deepEqual(alternates([ar, { ...en, evidenceSha256: hash("bad evidence") }]), { ar: arUrl, "x-default": arUrl });
  assert.deepEqual(alternates([{ ...ar, contentSha256: hash("bad content") }, en]), { en: enUrl, "x-default": enUrl });
});
