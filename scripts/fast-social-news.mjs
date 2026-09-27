import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SOCIAL_DIR = path.join(ROOT, ".social");
const STATE_FILE = path.join(SOCIAL_DIR, "fast-news-state.json");
const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000;

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

function normalizeStoryUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function stableStoryId(sourceId, url) {
  return `${sourceId}-${crypto.createHash("sha256").update(`${sourceId}|${normalizeStoryUrl(url)}`).digest("hex").slice(0, 20)}`;
}

export function parseOfficialFeed(xml, source) {
  const items = [];
  for (const match of String(xml || "").matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = decodeXml(tag(block, "title"));
    const link = decodeXml(tag(block, "link"));
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
      id: stableStoryId(source.id, url.toString()),
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
  const seenUrls = new Set(
    [...Object.values(state.published || {}), ...Object.values(state.queued || {})]
      .map((entry) => entry?.url)
      .filter(Boolean)
      .map((url) => {
        try { return normalizeStoryUrl(url); } catch { return null; }
      })
      .filter(Boolean),
  );
  return items
    .filter((item) => !state.published?.[item.id])
    .filter((item) => !state.queued?.[item.id])
    .filter((item) => {
      if (!item.url) return true;
      try { return !seenUrls.has(normalizeStoryUrl(item.url)); } catch { return false; }
    })
    .filter((item) => (state.attempts?.[item.id]?.count || 0) < 3)
    .filter((item) => {
      const published = Date.parse(item.publishedAt || "");
      return Number.isFinite(published) && published <= nowMs && nowMs - published <= maxAgeMs;
    })
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))[0] || null;
}

export function buildOriginalContentBrief({ item, queuedAt = new Date() }) {
  return {
    version: 1,
    kind: "original-content-brief",
    status: "awaiting-human-originality-review",
    publishMode: "manual-only",
    queuedAt: queuedAt.toISOString(),
    source: {
      id: item.id,
      publisher: item.sourceId,
      publisherNameAr: item.sourceNameAr,
      title: item.title,
      description: item.description,
      url: item.url,
      publishedAt: item.publishedAt,
    },
    editorialQuestions: [
      "ما الذي تغير فعليًا في الخبر؟",
      "لماذا يهم هذا الخبر اللاعب العربي؟",
      "ما رأي أو تجربة Plixfy الأصلية التي تضيف قيمة؟",
      "هل توجد لقطة أو مادة مرئية مملوكة لـPlixfy أو هل ننشر بلا وسائط؟",
    ],
    requiredEvidence: [
      "official-source-verified",
      "plixfy-original-perspective",
      "rights-cleared-media-or-no-media",
      "human-final-review-and-manual-post",
    ],
    prohibited: [
      "copied-or-title-only-post",
      "automated-publication",
      "unlicensed-third-party-media",
      "unsupported-claims",
    ],
  };
}

export function markBriefQueued(state, item, queuedAt = new Date()) {
  const next = {
    version: 2,
    published: { ...(state.published || {}) },
    queued: { ...(state.queued || {}) },
    attempts: { ...(state.attempts || {}) },
  };
  delete next.attempts[item.id];
  next.queued[item.id] = { queuedAt: queuedAt.toISOString(), url: item.url };
  next.queued = Object.fromEntries(Object.entries(next.queued).slice(-1000));
  return next;
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

export function recordFailedAttempt(state, item, error, attemptedAt = new Date()) {
  const previous = state.attempts?.[item.id]?.count || 0;
  return {
    ...state,
    version: 2,
    attempts: {
      ...(state.attempts || {}),
      [item.id]: {
        count: previous + 1,
        lastAttemptAt: attemptedAt.toISOString(),
        error: String(error?.message || error).slice(0, 300),
      },
    },
  };
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
  const state = readJson(STATE_FILE, { version: 2, published: {}, queued: {} });
  const candidate = selectNextFastNews(await fetchOfficialItems(), state);
  if (!candidate) {
    console.log("[FastNews] No new official story inside the eight-hour editorial window.");
    return;
  }
  try {
    await verifyOfficialArticle(candidate);
    console.log(`[SourceGate] verified live official page for ${candidate.id}`);
    const brief = buildOriginalContentBrief({ item: candidate });
    const briefFile = path.join(SOCIAL_DIR, `${candidate.id}-original-content-brief.json`);
    writeJson(briefFile, brief);
    console.log(`[OriginalityGate] created a manual-only editorial brief for ${candidate.id}`);

    if (!dryRun) persistState(markBriefQueued(state, candidate));
    console.log(`[FastNews] ${dryRun ? "validated" : "queued"} ${candidate.id}; public publishing disabled`);
  } catch (error) {
    if (!dryRun) persistState(recordFailedAttempt(state, candidate, error));
    throw error;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(error.message); process.exit(1); });
