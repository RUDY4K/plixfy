import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseSitemap,
  selectSitemapProbes,
  validateAdsTxt,
  validateAutomationRun,
  validateRobotsTxt,
  withRetries,
} from "./production-health-core.mjs";

const ORIGIN = "https://www.plixfy.com";

test("the production monitor runs around the clock and alerts only on failure", () => {
  const workflow = readFileSync(".github/workflows/production-health.yml", "utf8");
  assert.match(workflow, /cron: "23 \*\/2 \* \* \*"/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(workflow, /if: failure\(\)/);
  assert.match(workflow, /telegram-alert\.mjs/);
  assert.doesNotMatch(workflow, /TELEGRAM_BOT_TOKEN:\s*[^$\s]/);
});

test("ads.txt requires the exact Plixfy AdSense publisher line", () => {
  const expected = "google.com, pub-7564871953180369, DIRECT, f08c47fec0942fa0";
  assert.deepEqual(validateAdsTxt(`\uFEFF${expected}\n# comment\nexample.com, 1, RESELLER`, "pub-7564871953180369"), {
    publisherId: "pub-7564871953180369",
    sellerLines: 2,
  });
  assert.throws(
    () => validateAdsTxt("google.com, pub-wrong, DIRECT, f08c47fec0942fa0", "pub-7564871953180369"),
    /missing the exact AdSense authorization/,
  );
});

test("robots.txt points to the canonical sitemap and does not block ads.txt", () => {
  assert.deepEqual(
    validateRobotsTxt(`User-Agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml`, ORIGIN),
    { sitemap: `${ORIGIN}/sitemap.xml` },
  );
  assert.throws(
    () => validateRobotsTxt(`User-Agent: *\nDisallow: /ads.txt\nSitemap: ${ORIGIN}/sitemap.xml`, ORIGIN),
    /blocks ads.txt/,
  );
});

test("sitemap validation enforces canonical URLs and selects live route probes", () => {
  const essential = [
    `${ORIGIN}/play/game-one`,
    `${ORIGIN}/en/play/game-one`,
    `${ORIGIN}/news/story-one`,
    `${ORIGIN}/en/news/story-one`,
  ];
  const filler = Array.from({ length: 46 }, (_, index) => `${ORIGIN}/category/example-${index}`);
  const xml = `<urlset>${[...essential, ...filler].map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  const urls = parseSitemap(xml, ORIGIN);
  assert.equal(urls.length, 50);
  assert.deepEqual(selectSitemapProbes(urls).map((probe) => probe.label), [
    "Arabic game",
    "English game",
    "Arabic article",
    "English article",
  ]);
  assert.throws(
    () => parseSitemap(xml.replace(`${ORIGIN}/category/example-0`, "https://attacker.example/category/example-0"), ORIGIN),
    /outside the canonical HTTPS host/,
  );
});

test("automation validation rejects failures and stale successful runs", () => {
  const now = new Date("2026-08-24T20:00:00.000Z");
  const run = {
    workflow_runs: [{
      id: 123,
      conclusion: "success",
      created_at: "2026-08-24T18:00:00.000Z",
      updated_at: "2026-08-24T18:05:00.000Z",
      html_url: "https://github.com/RUDY4K/plixfy/actions/runs/123",
    }],
  };
  assert.equal(validateAutomationRun(run, { label: "Social", maxAgeHours: 14, now }).ageHours, 1.92);

  const failed = structuredClone(run);
  failed.workflow_runs[0].conclusion = "failure";
  assert.throws(() => validateAutomationRun(failed, { label: "Social", maxAgeHours: 14, now }), /failure/);

  const stale = structuredClone(run);
  stale.workflow_runs[0].updated_at = "2026-08-23T00:00:00.000Z";
  assert.throws(() => validateAutomationRun(stale, { label: "Social", maxAgeHours: 14, now }), /last succeeded/);
});

test("transient failures are retried with a bounded attempt count", async () => {
  let attempts = 0;
  const result = await withRetries(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("temporary");
    return "ok";
  }, { attempts: 3, delayMs: 1 });
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});
