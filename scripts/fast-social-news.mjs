import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EditorialAgent, PublicationAuditAgent } from "./social-agents.mjs";

const ROOT = process.cwd();
const SOCIAL_DIR = path.join(ROOT, ".social");
const STATE_FILE = path.join(SOCIAL_DIR, "fast-news-state.json");
const DEFAULT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const SUPPORTED_PLATFORMS = Object.freeze(["telegram", "discord", "x", "facebook"]);
const DEFAULT_PLATFORMS = Object.freeze(["x"]);

export const OFFICIAL_FAST_NEWS_SOURCES = Object.freeze([
  {
    id: "playstation-blog",
    nameAr: "بلايستيشن",
    feedUrl: "https://blog.playstation.com/feed/",
    allowedHosts: ["blog.playstation.com"],
  },
  {
    id: "xbox-wire",
    nameAr: "إكس بوكس",
    feedUrl: "https://news.xbox.com/en-us/feed/",
    allowedHosts: ["news.xbox.com"],
  },
]);

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  return block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "";
}

function stableStoryId(sourceId, guid, url) {
  return `${sourceId}-${crypto.createHash("sha256").update(`${guid}|${url}`).digest("hex").slice(0, 20)}`;
}

export function parseOfficialFeed(xml, source) {
  const items = [];
  for (const match of String(xml || "").matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = decodeXml(tag(block, "title"));
    const link = decodeXml(tag(block, "link"));
    const guid = decodeXml(tag(block, "guid")) || link;
    const description = decodeXml(tag(block, "description")).slice(0, 1200);
    const publishedAt = new Date(decodeXml(tag(block, "pubDate")) || decodeXml(tag(block, "dc:date")));
    let url;
    try {
      url = new URL(link);
    } catch {
      continue;
    }
    if (
      !title
      || url.protocol !== "https:"
      || !source.allowedHosts.includes(url.hostname)
      || !Number.isFinite(publishedAt.getTime())
    ) continue;
    items.push({
      id: stableStoryId(source.id, guid, url.toString()),
      sourceId: source.id,
      sourceNameAr: source.nameAr,
      title,
      description,
      url: url.toString(),
      publishedAt: publishedAt.toISOString(),
    });
  }
  return items;
}

export function selectNextFastNews(items, state, { now = new Date(), maxAgeMs = DEFAULT_MAX_AGE_MS } = {}) {
  const nowMs = now.getTime();
  return items
    .filter((item) => !state.published?.[item.id])
    .filter((item) => (state.attempts?.[item.id]?.count || 0) < 3)
    .filter((item) => {
      const published = Date.parse(item.publishedAt || "");
      return Number.isFinite(published) && published <= nowMs && nowMs - published <= maxAgeMs;
    })
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))[0] || null;
}

function cleanPlatforms(platforms) {
  const allowed = new Set(SUPPORTED_PLATFORMS);
  return [...new Set(platforms)].filter((platform) => allowed.has(platform));
}

function truncate(value, max) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trim()}…`;
}

export function buildFastNewsPack({ item, date, platforms = DEFAULT_PLATFORMS }) {
  const selected = cleanPlatforms(platforms);
  if (selected.length === 0) throw new Error("Fast-news pack has no supported public platform");
  const contentId = `fast-${item.id}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80);
  const sourceLine = `المصدر الرسمي: ${item.sourceNameAr}`;
  const title = truncate(item.title, 110);
  const shortTitle = truncate(item.title, 72);
  const textByPlatform = {
    telegram: `⚡ نشر ${item.sourceNameAr} مادة جديدة بعنوان:\n\n${title}\n\n${sourceLine}\nالتفاصيل من الرابط الرسمي:`,
    discord: `⚡ نشر ${item.sourceNameAr} مادة جديدة بعنوان:\n\n${title}\n\n${sourceLine}`,
    x: `⚡ جديد ${item.sourceNameAr}:\n${shortTitle}\n\n${sourceLine}`,
    facebook: `⚡ نشر ${item.sourceNameAr} مادة جديدة بعنوان:\n\n${title}\n\n${sourceLine}\nالتفاصيل من الرابط الرسمي.`,
  };
  return {
    date,
    slot: "fast-news",
    campaign: "ar_fast_news_v1",
    source: { kind: "fast-news", id: item.id, publisher: item.sourceId, publishedAt: item.publishedAt },
    items: selected.map((platform) => ({
      platform,
      kind: "fast-news",
      contentId,
      title,
      text: textByPlatform[platform],
      url: item.url,
    })),
  };
}

export function reviewFastNewsRights(pack, item) {
  if (pack.source?.id !== item.id) throw new Error("Fast-news rights gate received a mismatched source item");
  for (const post of pack.items || []) {
    if (post.image || post.video) throw new Error("Fast-news posts must not reuse third-party media");
    if (post.url !== item.url) throw new Error("Fast-news posts must link directly to the reviewed official page");
    if (!post.text.includes(item.sourceNameAr)) throw new Error("Fast-news posts must visibly attribute the official source");
    const expectedTitle = post.platform === "x" ? truncate(item.title, 72) : truncate(item.title, 110);
    if (!post.text.includes(expectedTitle)) throw new Error("Fast-news posts may only carry the official title and fixed attribution copy");
  }
  return pack;
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

function markStateChanged() {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, "state_changed=true\n");
}

function persistState(value) {
  writeJson(STATE_FILE, value);
  markStateChanged();
}

function recordFailedAttempt(state, item, error) {
  const previous = state.attempts?.[item.id]?.count || 0;
  return {
    ...state,
    version: 1,
    attempts: {
      ...(state.attempts || {}),
      [item.id]: {
        count: previous + 1,
        lastAttemptAt: new Date().toISOString(),
        error: String(error?.message || error).slice(0, 300),
      },
    },
  };
}

export function requireCompleteFastNewsDelivery(audit) {
  if (!audit?.ok) {
    const counts = audit?.counts || {};
    throw new Error(
      `Fast-news delivery incomplete; published=${counts.publishedPublic || 0}, accepted=${counts.acceptedByBuffer || 0}, fallback=${counts.fallbackAdmin || 0}, disconnected=${counts.skippedDisconnected || 0}, failed=${counts.failed || 0}`,
    );
  }
  return audit;
}

function riyadhDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
}

async function fetchOfficialItems(fetchImpl = fetch) {
  const results = await Promise.allSettled(OFFICIAL_FAST_NEWS_SOURCES.map(async (source) => {
    const response = await fetchImpl(source.feedUrl, {
      headers: { "user-agent": "PlixfyFastNews/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`${source.id} feed returned HTTP ${response.status}`);
    return parseOfficialFeed(await response.text(), source);
  }));
  const items = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") items.push(...result.value);
    else console.warn(`[FastNews] ${OFFICIAL_FAST_NEWS_SOURCES[index].id}: ${result.reason.message}`);
  }
  if (results.every((result) => result.status === "rejected")) throw new Error("Every official fast-news feed failed");
  return items;
}

async function verifyOfficialArticle(item, fetchImpl = fetch) {
  const source = OFFICIAL_FAST_NEWS_SOURCES.find((candidate) => candidate.id === item.sourceId);
  if (!source) throw new Error("Fast-news source gate could not identify the feed owner");
  const response = await fetchImpl(item.url, {
    method: "GET",
    redirect: "follow",
    headers: { "user-agent": "PlixfyFastNews/1.0", range: "bytes=0-2047" },
    signal: AbortSignal.timeout(15_000),
  });
  const finalUrl = new URL(response.url || item.url);
  if (!response.ok || finalUrl.protocol !== "https:" || !source.allowedHosts.includes(finalUrl.hostname)) {
    throw new Error(`Fast-news source page failed verification (HTTP ${response.status})`);
  }
  await response.body?.cancel().catch(() => {});
  return true;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const liveRead = process.argv.includes("--live-read");
  if (dryRun && !liveRead) {
    console.log("[FastNews] Offline dry-run: feed and model requests skipped.");
    return;
  }
  const state = readJson(STATE_FILE, { version: 1, published: {} });
  const candidate = selectNextFastNews(await fetchOfficialItems(), state);
  if (!candidate) {
    console.log("[FastNews] No new official story inside the two-hour freshness window.");
    return;
  }
  try {
    await verifyOfficialArticle(candidate);
    console.log(`[SourceGate] verified live official page for ${candidate.id}`);
    const platforms = (process.env.SOCIAL_PLATFORMS || DEFAULT_PLATFORMS.join(",")).split(",").map((value) => value.trim());
    const pack = reviewFastNewsRights(
      new EditorialAgent().review(buildFastNewsPack({ item: candidate, date: riyadhDate(), platforms })),
      candidate,
    );
    console.log(`[RightsGate] approved title-only attributed post for ${candidate.id}`);
    const packFile = path.join(SOCIAL_DIR, `${candidate.id}.json`);
    const reportFile = path.join(SOCIAL_DIR, `${candidate.id}-delivery.json`);
    writeJson(packFile, pack);

    const { spawnSync } = await import("node:child_process");
    const publisherArgs = [path.join(ROOT, "scripts", "social-publisher.mjs"), packFile, `--report=${reportFile}`];
    if (dryRun) publisherArgs.push("--dry-run");
    const result = spawnSync(process.execPath, publisherArgs, { cwd: ROOT, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Fast-news publisher exited with code ${result.status}`);
    const report = readJson(reportFile, null);
    const audit = new PublicationAuditAgent().evaluate(report, { requirePublicDelivery: !dryRun });
    if (!dryRun) requireCompleteFastNewsDelivery(audit);

    if (!dryRun) {
      const next = { version: 1, published: { ...(state.published || {}) }, attempts: { ...(state.attempts || {}) } };
      delete next.attempts[candidate.id];
      next.published[candidate.id] = { completedAt: new Date().toISOString(), url: candidate.url };
      next.published = Object.fromEntries(Object.entries(next.published).slice(-1000));
      persistState(next);
    }
    console.log(`[FastNews] ${dryRun ? "validated" : "published"} ${candidate.id}`);
  } catch (error) {
    if (!dryRun) persistState(recordFailedAttempt(state, candidate, error));
    throw error;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(error.message); process.exit(1); });
