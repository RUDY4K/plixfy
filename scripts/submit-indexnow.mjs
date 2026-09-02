import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.plixfy.com";
const HOST = "www.plixfy.com";
const KEY = "65c99b0b62a75c20021a8fd00a5c753c";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function urlsFromSitemap() {
  const response = await fetch(`${SITE}/sitemap.xml`);
  if (!response.ok) throw new Error(`Sitemap request failed: HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decodeXml(match[1]));
}

function eligibleNewsUrls({ recentOnly = false } = {}) {
  const news = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, "src", "data", "news.json"), "utf8"),
  );
  const reviews = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, "src", "data", "news-editorial.json"), "utf8"),
  );
  const recentCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return news
    .filter((item) => {
      const review = reviews[item.slug];
      if (review?.searchEligible !== true) return false;
      if (!recentOnly) return true;
      const reviewedAt = Date.parse(`${review.reviewedAt}T00:00:00Z`);
      return Number.isFinite(reviewedAt) && reviewedAt >= recentCutoff;
    })
    .map((item) => `${SITE}/news/${encodeURIComponent(item.slug)}`);
}

async function submit(urlList) {
  const uniqueUrls = [...new Set(urlList)].filter((url) => url.startsWith(`${SITE}/`) || url === SITE);
  if (uniqueUrls.length === 0) {
    console.log("No URLs to submit.");
    return;
  }

  for (let offset = 0; offset < uniqueUrls.length; offset += 10_000) {
    const batch = uniqueUrls.slice(offset, offset + 10_000);
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    if (response.status !== 200 && response.status !== 202) {
      const body = await response.text();
      throw new Error(`IndexNow rejected the batch: HTTP ${response.status} ${body}`);
    }

    console.log(`IndexNow accepted ${batch.length} URLs (HTTP ${response.status}).`);
  }
}

const args = new Set(process.argv.slice(2));
// Fresh automated summaries are deliberately excluded. --recent-news submits
// only articles granted explicit eligibility in the separate editorial review
// registry; the default/all mode continues to mirror the deployed sitemap.
const urls = args.has("--recent-news")
  ? eligibleNewsUrls({ recentOnly: true })
  : await urlsFromSitemap();
await submit(urls);
