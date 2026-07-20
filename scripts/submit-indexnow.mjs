import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.plixfy.com";
const HOST = "www.plixfy.com";
const KEY = "65c99b0b62a75c20021a8fd00a5c753c";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

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

async function recentNewsUrls() {
  const raw = await readFile(path.join(ROOT, "src", "data", "news.json"), "utf8");
  const news = JSON.parse(raw);
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const urls = news
    .filter((item) => new Date(`${item.publishedAt}T23:59:59Z`).getTime() >= cutoff)
    .map((item) => `${SITE}/ar/news/${item.slug}`);
  return [`${SITE}/ar`, `${SITE}/ar/news`, ...urls];
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

const mode = process.argv.includes("--all") ? "all" : "recent-news";
const urls = mode === "all" ? await urlsFromSitemap() : await recentNewsUrls();
await submit(urls);
