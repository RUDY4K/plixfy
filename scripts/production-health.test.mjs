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
import {
  latestSlotTarget,
  normalizeContentDate,
  planSocialSchedule,
} from "./social-schedule-core.mjs";

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

test("social workflow checks continuously for fresh news twice per hour", () => {
  const workflow = readFileSync(".github/workflows/cloud-social.yml", "utf8");
  assert.match(workflow, /cron: "25,55 \* \* \* \*"/);
  assert.match(workflow, /reason=continuous_news_watch/);
  assert.match(workflow, /echo "slot=news"/);
  assert.match(workflow, /if: steps\.plan\.outputs\.should_run == 'true'/);
  assert.match(workflow, /--date=\$\{SOCIAL_DATE\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow, /contents: write/);

  const dryRunStep = workflow.slice(
    workflow.indexOf("- name: Run social agents in dry-run mode"),
    workflow.indexOf("- name: Run scout, editor, publisher, and auditor agents"),
  );
  const publishStep = workflow.slice(
    workflow.indexOf("- name: Run scout, editor, publisher, and auditor agents"),
    workflow.indexOf("- name: Save delivery state"),
  );
  assert.match(dryRunStep, /outputs\.dry_run == 'true'/);
  assert.match(dryRunStep, /--dry-run/);
  assert.doesNotMatch(dryRunStep, /(?:TELEGRAM|BUFFER|DISCORD)_[A-Z_]+/);
  assert.match(publishStep, /outputs\.dry_run != 'true'/);
  assert.match(publishStep, /secrets\.TELEGRAM_BOT_TOKEN/);
  assert.match(publishStep, /secrets\.BUFFER_API_KEY/);
  assert.match(publishStep, /secrets\.DISCORD_WEBHOOK_URL/);
  assert.match(workflow, /Alert admin on failure[\s\S]{0,160}github\.event_name != 'workflow_dispatch'[\s\S]{0,80}inputs\.dry_run != true/);
});

test("social schedule opens only the first 60 minutes and deduplicates delivered slots", () => {
  const exact = planSocialSchedule({ now: new Date("2026-08-29T06:30:00Z") });
  assert.deepEqual(
    { shouldRun: exact.shouldRun, slot: exact.slot, date: exact.date, ageMinutes: exact.ageMinutes },
    { shouldRun: true, slot: "morning", date: "2026-08-29", ageMinutes: 0 },
  );

  const retry = planSocialSchedule({ now: new Date("2026-08-29T06:37:00Z") });
  assert.equal(retry.shouldRun, true);
  assert.equal(retry.ageMinutes, 7);

  const boundary = planSocialSchedule({ now: new Date("2026-08-29T07:30:00Z") });
  assert.equal(boundary.shouldRun, true);
  assert.equal(boundary.ageMinutes, 60);
  assert.equal(planSocialSchedule({ now: new Date("2026-08-29T07:30:01Z") }).reason, "outside_window");

  const state = { runs: { "2026-08-29:morning": { status: "delivered" } } };
  const duplicate = planSocialSchedule({ now: new Date("2026-08-29T06:47:00Z"), state });
  assert.equal(duplicate.shouldRun, false);
  assert.equal(duplicate.reason, "already_delivered");
});

test("stale GitHub runs cannot publish a late or next-day social slot", () => {
  const lateMorning = planSocialSchedule({ now: new Date("2026-08-28T18:54:16Z") });
  assert.equal(lateMorning.reason, "outside_window");

  const crossedMidnight = latestSlotTarget(new Date("2026-08-29T00:36:05Z"), "evening");
  assert.equal(crossedMidnight.date, "2026-08-28");
  assert.equal(Math.floor(crossedMidnight.ageMinutes), 486);
  assert.equal(planSocialSchedule({ now: new Date("2026-08-29T00:36:05Z") }).reason, "outside_window");

  const eveningRetry = planSocialSchedule({ now: new Date("2026-08-29T16:37:00Z") });
  assert.equal(eveningRetry.shouldRun, true);
  assert.equal(eveningRetry.slot, "evening");
  assert.equal(eveningRetry.date, "2026-08-29");
});

test("explicit social content dates accept only real YYYY-MM-DD dates", () => {
  assert.equal(normalizeContentDate("2028-02-29"), "2028-02-29");
  for (const invalid of ["2026-02-29", "2026-13-01", "2026-08-1", "08/29/2026", ""]) {
    assert.throws(() => normalizeContentDate(invalid), /valid calendar date/);
  }
  const runner = readFileSync("scripts/cloud-social-runner.mjs", "utf8");
  assert.match(runner, /startsWith\("--date="\)/);
  assert.match(runner, /normalizeContentDate\(dateValue\)/);
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

  const editorialOnlyXml = `<urlset>${[
    `${ORIGIN}/play/editorial-game`,
    ...Array.from({ length: 49 }, (_, index) => `${ORIGIN}/category/editorial-${index}`),
  ].map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  const editorialOnlyUrls = parseSitemap(editorialOnlyXml, ORIGIN);
  assert.deepEqual(selectSitemapProbes(editorialOnlyUrls).map((probe) => probe.label), [
    "Arabic game",
  ]);
  assert.throws(
    () => selectSitemapProbes(editorialOnlyUrls.filter((url) => !url.includes("/play/"))),
    /editorial Arabic game route/,
  );
  assert.throws(
    () => parseSitemap(xml.replace(`${ORIGIN}/category/example-0`, "https://attacker.example/category/example-0"), ORIGIN),
    /outside the canonical HTTPS host/,
  );
});

test("content quarantine accepts both practical guide locales but rejects incomplete guides", () => {
  const guideUrls = [`${ORIGIN}/guides/browser-games`, `${ORIGIN}/en/guides/browser-games`];
  const urls = [...guideUrls, ...Array.from({ length: 36 }, (_, i) => `${ORIGIN}/category/item-${i}`)];
  const xml = `<urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  assert.equal(parseSitemap(xml, ORIGIN).length, 38);
  assert.deepEqual(selectSitemapProbes(urls).map((probe) => probe.label), ["Arabic browser guide", "English browser guide"]);
  assert.throws(() => selectSitemapProbes(urls.filter((url) => url !== guideUrls[1])), /both browser guide locales/);
  assert.throws(() => selectSitemapProbes(urls.map((url) => url.replace("browser-games", "unreviewed"))), /both browser guide locales/);
  assert.throws(() => parseSitemap("<urlset></urlset>", ORIGIN), /expected at least 38/);
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

test("automation freshness allows the bounded GitHub schedule grace period", () => {
  const now = new Date("2026-08-25T07:14:00.000Z");
  const payload = {
    workflow_runs: [{
      id: 456,
      conclusion: "success",
      created_at: "2026-08-24T17:03:00.000Z",
      updated_at: "2026-08-24T17:05:00.000Z",
      html_url: "https://github.com/RUDY4K/plixfy/actions/runs/456",
    }],
  };

  assert.equal(validateAutomationRun(payload, { label: "Social", maxAgeHours: 16, now }).ageHours, 14.15);
  assert.throws(
    () => validateAutomationRun(payload, { label: "Social", maxAgeHours: 14, now }),
    /last succeeded 14\.2 hours ago/,
  );
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
