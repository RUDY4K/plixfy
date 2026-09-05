import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSitemap, selectSitemapProbes } from "./production-health-core.mjs";

// Run against a local production build: node scripts/content-quality-smoke.mjs.
// The target is restricted to loopback; this check never submits to a service.
const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3215");
assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname));
const catalog = JSON.parse(readFileSync(new URL("../src/data/playgama-games.json", import.meta.url), "utf8"));
const legacySource = readFileSync(new URL("../src/lib/gameContent.ts", import.meta.url), "utf8");
const legacySlugs = [...legacySource.matchAll(/^  "([^"\r\n]+)": \{/gm)].map((m) => m[1]);
const legacy = catalog.find((game) => legacySlugs.includes(game.slug));
assert.ok(legacy, "a formerly approved game must exercise quarantine");

async function html(path) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, path);
  const body = await response.text();
  assert.doesNotMatch(body, /<script[^>]+src=["'][^"']*(?:googlesyndication|adsbygoogle)/i);
  return body;
}

for (const [prefix, language, heading] of [["", "ar", "قبل أن تبدأ لعبة في المتصفح"], ["/en", "en", "Before you start a browser game"]]) {
  const guide = await html(`${prefix}/guides/browser-games`);
  assert.ok(guide.includes(heading));
  assert.equal((guide.match(/\bid="main-content"/g) ?? []).length, 1);
  assert.match(guide, /<main\b/);
  assert.match(guide, /<table/);
  assert.ok(guide.includes(`https://www.plixfy.com${prefix}/guides/browser-games`));
  assert.doesNotMatch(guide, /content="noindex/);
  assert.ok((await html(prefix || "/")).includes(`href="${prefix}/guides/browser-games"`));

  const page = await html(`${prefix}/play/${legacy.slug}`);
  assert.match(page, /content="noindex, follow"/);
  assert.ok(page.includes(language === "ar" ? "وصف من كتالوج Playgama" : "Description from the Playgama catalog"));
  assert.ok(page.includes(`href="${prefix}/guides/browser-games"`));
  assert.ok(!page.includes(language === "ar" ? "دليل تحريري من فريق بليكسفاي" : "An editorial guide from the Plixfy team"));
  const structured = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));
  const gameLd = structured.find((item) => item["@type"] === "VideoGame");
  assert.ok(gameLd);
  assert.equal(gameLd.operatingSystem, undefined);
  assert.deepEqual(gameLd.inLanguage ?? [], legacy.supportedLanguages);
  assert.ok(!structured.some((item) => item["@type"] === "FAQPage"));
}

const response = await fetch(new URL("/sitemap.xml", origin));
assert.equal(response.status, 200);
const urls = parseSitemap(await response.text(), "https://www.plixfy.com");
assert.ok(urls.every((url) => !new URL(url).pathname.includes("/play/")));
const probes = selectSitemapProbes(urls);
assert.ok(probes.some((probe) => probe.label === "Arabic browser guide"));
assert.ok(probes.some((probe) => probe.label === "English browser guide"));
console.log(`PASS: bilingual guides, home links, legacy quarantine, source disclosures, game schema, AdSense exclusion, and ${urls.length} sitemap URLs.`);
