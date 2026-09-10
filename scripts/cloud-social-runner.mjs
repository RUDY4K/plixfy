// Local, deterministic social agents for GitHub Actions.
// Usage: node scripts/cloud-social-runner.mjs [--slot=news|auto] [--dry-run] [--force]
import fs from "node:fs";
import { getPublishedNews } from "./news-publication.mjs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  EditorialAgent,
  PublicationAuditAgent,
} from "./social-agents.mjs";
import {
  TrafficAcquisitionAgent,
  fetchSaudiTrends,
} from "./traffic-acquisition-agent.mjs";
import { normalizeContentDate } from "./social-schedule-core.mjs";

const ROOT = process.cwd();
const SOCIAL_DIR = path.join(ROOT, ".social");
const CLOUD_STATE_FILE = path.join(SOCIAL_DIR, "cloud-state.json");
const TREND_CACHE_FILE = path.join(SOCIAL_DIR, "saudi-trends.json");
const MANUAL_HISTORY_FILE = path.join(ROOT, "src", "data", "social-publication-history.json");
const SITE = "https://www.plixfy.com";
const MIN_NEWS_INTERVAL_MS = 90 * 60 * 1000;
const MAX_NEWS_SILENCE_MS = 24 * 60 * 60 * 1000;
const EVERGREEN_REPEAT_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_PLATFORMS = Object.freeze(["telegram", "discord", "x", "facebook", "instagram"]);
const EVERGREEN_PAGES = Object.freeze([
  {
    id: "browser-games-guide",
    url: `${SITE}/guides/browser-games`,
    title: "دليل اختيار ألعاب المتصفح",
    summary: "كيف تختار لعبة مناسبة لجهازك، وتفهم التحكم والحفظ، وتعالج مشاكل التحميل قبل بدء اللعب.",
  },
  {
    id: "all-games",
    url: `${SITE}/all-games`,
    title: "مكتبة ألعاب بليكسفاي",
    summary: "تصفّح مكتبة الألعاب حسب التصنيف واختر ما يناسب جلستك من مكان واحد.",
  },
  {
    id: "puzzle-games",
    url: `${SITE}/category/puzzle`,
    title: "ألعاب الألغاز",
    summary: "اختر من ألعاب الألغاز والتفكير التي تعمل مباشرة من المتصفح.",
  },
]);

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

function riyadhParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

function parseArgs() {
  const value = process.argv.find((arg) => arg.startsWith("--slot="))?.split("=")[1] || "auto";
  if (!["auto", "news"].includes(value)) {
    throw new Error("--slot must be news or auto");
  }
  const { date: currentDate, hour } = riyadhParts();
  const dateValue = process.argv.find((arg) => arg.startsWith("--date="))?.slice(7);
  const dryRun = process.argv.includes("--dry-run");
  const liveRead = process.argv.includes("--live-read");
  const offline = process.argv.includes("--offline") || (dryRun && !liveRead);
  if (offline && !dryRun) {
    throw new Error("--offline requires --dry-run");
  }
  if (liveRead && !dryRun) {
    throw new Error("--live-read requires --dry-run");
  }
  return {
    date: dateValue ? normalizeContentDate(dateValue) : currentDate,
    slot: "news",
    dryRun,
    offline,
    force: process.argv.includes("--force"),
  };
}

async function offlineFetch() {
  throw new Error("Offline preflight: public reads disabled");
}

function cleanContentId(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 72);
}

function truncate(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function socialCardUrl(kind, id) {
  const url = new URL("/api/social-card", SITE);
  url.searchParams.set("kind", kind);
  url.searchParams.set("id", id);
  url.searchParams.set("v", "8");
  return url.toString();
}

function loadNews(referenceDate) {
  const referenceTime = Date.now();
  const cutoffTime = referenceTime - 48 * 60 * 60 * 1000;
  return getPublishedNews(
    readJson(path.join(ROOT, "src", "data", "news.json"), []),
    readJson(path.join(ROOT, "src", "data", "news-editorial.json"), {}),
    readJson(path.join(ROOT, "src", "data", "news-publication-review.json"), []),
    "ar", ROOT,
  )
    .filter((item) => item?.slug && item?.title && item?.summary && item?.publishedAt)
    .filter((item) => {
      const publishedTime = Date.parse(item.sourcePublishedAt || `${item.publishedAt}T00:00:00Z`);
      return Number.isFinite(publishedTime) && publishedTime >= cutoffTime && publishedTime <= referenceTime;
    })
    .sort((a, b) => Date.parse(b.sourcePublishedAt || b.publishedAt) - Date.parse(a.sourcePublishedAt || a.publishedAt));
}

function newsPack(news, date, slot, acquisition, trendSnapshot) {
  const title = truncate(news.title, 100);
  const summary = truncate(news.summary, 300);
  const url = `${SITE}/news/${encodeURIComponent(news.slug)}`;
  const contentId = cleanContentId(`news-${news.slug}`);
  const image = socialCardUrl("news", news.slug);
  const source = truncate(news.sourceName || "المصدر الأصلي", 45);
  const xTitle = truncate(title, 88);
  const xSummary = truncate(summary, 82);
  return {
    date,
    campaign: "ar_gaming_news_24h_v1",
    slot,
    source: { kind: "news", id: news.slug },
    acquisition: { ...acquisition, trendSource: trendSnapshot.source, trendStatus: trendSnapshot.status },
    items: [
      { platform: "telegram", kind: "news", contentId, text: `📰 ${title}\n\n${summary}\n\nالمصدر: ${source}\nالخبر الكامل على بليكسفاي:`, url, image },
      { platform: "discord", kind: "news", contentId, title: `📰 ${title}`, text: `${summary}\n\nالمصدر: ${source}\nاقرأ الخبر كاملًا وناقشه معنا.`, url, image },
      { platform: "x", kind: "news", contentId, text: `📰 ${xTitle}\n\n${xSummary}\n\nالمصدر: ${source}\nالخبر الكامل 👇\n#أخبار_الألعاب`, url, image },
      { platform: "facebook", kind: "news", contentId, text: `📰 ${title}\n\n${summary}\n\nالمصدر: ${source}\nاقرأ الخبر كاملًا على بليكسفاي.`, url, image },
      { platform: "instagram", kind: "news", contentId, text: `📰 ${title}\n\n${truncate(summary, 220)}\n\nالمصدر: ${source}\nرابط الخبر الكامل مرفق بالمنشور.\n\n#أخبار_الألعاب #GamingNews #Plixfy`, url, image },
    ],
  };
}

function mergeManualHistory(state) {
  const allowedUrls = new Set(EVERGREEN_PAGES.map((page) => page.url));
  const manualHistory = readJson(MANUAL_HISTORY_FILE, []);
  const platformHistory = { ...(state.platformHistory || {}) };
  let lastPublishedAt = state.lastPublishedAt || null;
  let lastPublishedTime = Date.parse(lastPublishedAt || "");
  if (!Array.isArray(manualHistory)) return { ...state, platformHistory };
  for (const entry of manualHistory) {
    if (
      !PUBLIC_PLATFORMS.includes(entry?.platform)
      || !allowedUrls.has(entry?.url)
      || !Number.isFinite(Date.parse(entry?.publishedAt || ""))
    ) continue;
    const history = platformHistory[entry.platform] || [];
    const key = `${entry.url}|${entry.publishedAt}`;
    if (!history.some((candidate) => `${candidate.url}|${candidate.publishedAt}` === key)) {
      platformHistory[entry.platform] = [{ url: entry.url, publishedAt: entry.publishedAt }, ...history];
    }
    const publishedTime = Date.parse(entry.publishedAt);
    if (!Number.isFinite(lastPublishedTime) || publishedTime > lastPublishedTime) {
      lastPublishedAt = entry.publishedAt;
      lastPublishedTime = publishedTime;
    }
  }
  return { ...state, lastPublishedAt, platformHistory };
}

function enabledPlatforms() {
  const configured = process.env.SOCIAL_PLATFORMS || PUBLIC_PLATFORMS.join(",");
  const allowed = new Set(PUBLIC_PLATFORMS);
  return configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => allowed.has(value));
}

function platformPublishedToday(state, platform, date) {
  const history = state.platformHistory?.[platform];
  if (Array.isArray(history)) {
    return history.some((entry) => {
      const publishedAt = new Date(entry?.publishedAt || "");
      return Number.isFinite(publishedAt.getTime()) && riyadhParts(publishedAt).date === date;
    });
  }
  if (!state.platformHistory || Object.keys(state.platformHistory).length === 0) {
    const legacyPublishedAt = new Date(state.lastPublishedAt || "");
    return Number.isFinite(legacyPublishedAt.getTime()) && riyadhParts(legacyPublishedAt).date === date;
  }
  return false;
}

function platformUsedUrlRecently(state, platform, url, now) {
  return (state.platformHistory?.[platform] || []).some((entry) => {
    const publishedTime = Date.parse(entry?.publishedAt || "");
    return entry?.url === url
      && Number.isFinite(publishedTime)
      && now.getTime() - publishedTime < EVERGREEN_REPEAT_MS;
  });
}

function eligiblePlatforms(state, date, { url = "", preventRecentUrl = false, now = new Date() } = {}) {
  return enabledPlatforms().filter((platform) =>
    !platformPublishedToday(state, platform, date)
    && (!preventRecentUrl || !platformUsedUrlRecently(state, platform, url, now)),
  );
}

function evergreenPack(page, date, slot, state, now = new Date()) {
  const contentId = cleanContentId(`evergreen-${page.id}-${date.replaceAll("-", "")}`);
  const shared = `${page.summary}\n\n${page.title} على بليكسفاي:`;
  return {
    date,
    campaign: "ar_evergreen_social_v1",
    slot,
    source: { kind: "evergreen", id: page.id },
    items: eligiblePlatforms(state, date, { url: page.url, preventRecentUrl: true, now }).map((platform) => ({
      platform,
      kind: "evergreen",
      contentId,
      text: shared,
      url: page.url,
      image: `${SITE}/opengraph-image`,
    })),
  };
}

function updateCloudState(state, pack, audit, report) {
  const now = new Date().toISOString();
  const runKey = `${pack.source.kind}:${pack.source.id}`;
  const next = {
    recentGames: state.recentGames || [],
    recentNews: state.recentNews || [],
    runs: state.runs || {},
    lastPublishedAt: state.lastPublishedAt || null,
    platformHistory: { ...(state.platformHistory || {}) },
  };
  if (pack.source.kind === "game") {
    next.recentGames = [pack.source.id, ...next.recentGames.filter((id) => id !== pack.source.id)].slice(0, 30);
  } else if (pack.source.kind === "news") {
    next.recentNews = [pack.source.id, ...next.recentNews.filter((id) => id !== pack.source.id)].slice(0, 300);
  }
  next.runs[runKey] = {
    status: "delivered",
    source: pack.source,
    acquisition: pack.acquisition,
    counts: audit.counts,
    completedAt: now,
  };
  next.lastPublishedAt = now;
  const successfulStatuses = new Set(["published_public", "accepted_by_buffer"]);
  for (const delivery of report?.deliveries || []) {
    if (!successfulStatuses.has(delivery.status)) continue;
    const item = pack.items.find((candidate) => candidate.platform === delivery.platform);
    if (!item?.url) continue;
    const history = next.platformHistory[delivery.platform] || [];
    next.platformHistory[delivery.platform] = [
      { url: item.url, publishedAt: delivery.attemptedAt || now },
      ...history,
    ].filter((entry) => {
      const publishedTime = Date.parse(entry.publishedAt || "");
      return Number.isFinite(publishedTime) && Date.now() - publishedTime < 30 * 24 * 60 * 60 * 1000;
    }).slice(0, 60);
  }
  next.runs = Object.fromEntries(Object.entries(next.runs).slice(-90));
  return next;
}

async function verifyPublicUrl(url) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "PlixfyCloudSocial/2.0" },
      });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      lastStatus = 0;
    }
  }
  throw new Error(`Selected content URL is unavailable (HTTP ${lastStatus || "network error"}): ${url}`);
}

async function main() {
  const args = parseArgs();
  const state = mergeManualHistory(readJson(CLOUD_STATE_FILE, { recentGames: [], recentNews: [], runs: {} }));
  const runKey = `news-watcher:${args.date}`;
  const lastPublishedTime = Date.parse(state.lastPublishedAt || "");
  if (!args.dryRun && !args.force && Number.isFinite(lastPublishedTime) && Date.now() - lastPublishedTime < MIN_NEWS_INTERVAL_MS) {
    console.log("[NewsWatcher] Cooldown is active; the next check will reconsider any pending news.");
    return;
  }
  const trendSnapshot = await fetchSaudiTrends({
    cacheFile: TREND_CACHE_FILE,
    fetchImpl: args.offline ? offlineFetch : fetch,
  });
  console.log(
    `[TrendAgent] source=${trendSnapshot.source} status=${trendSnapshot.status} terms=${trendSnapshot.trends.length}`,
  );
  if (trendSnapshot.warning) console.warn(`[TrendAgent] ${trendSnapshot.warning}`);
  const scout = new TrafficAcquisitionAgent();
  const allNewsItems = loadNews(args.date);
  const recentNews = new Set(state.recentNews || []);
  const newsItems = args.force ? allNewsItems : allNewsItems.filter((item) => !recentNews.has(item.slug));
  if (newsItems.length === 0) {
    const silenceExceeded = Number.isFinite(lastPublishedTime)
      && Date.now() - lastPublishedTime >= MAX_NEWS_SILENCE_MS;
    if (!silenceExceeded) {
      console.log("[NewsWatcher] No unpublished gaming news is ready; nothing to send.");
      return;
    }
    const now = new Date();
    const candidatePacks = EVERGREEN_PAGES
      .map((page) => evergreenPack(page, args.date, args.slot, state, now))
      .sort((left, right) => right.items.length - left.items.length);
    const rawPack = candidatePacks.find((candidate) => candidate.items.length > 0);
    if (!rawPack) {
      console.log("[EvergreenFallback] Daily platform limit or seven-day link limit is active; nothing to send.");
      return;
    }
    const pack = new EditorialAgent().review(rawPack);
    console.log(`[EvergreenFallback] selected ${pack.source.id} after 24 hours without approved news`);
    if (args.offline) {
      console.log("[Preflight] offline mode skipped public URL verification");
    } else {
      await verifyPublicUrl(pack.items[0].url);
    }
    fs.mkdirSync(SOCIAL_DIR, { recursive: true });
    const packFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}.json`);
    const reportFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}-delivery.json`);
    writeJson(packFile, pack);
    const publisherArgs = [path.join(ROOT, "scripts", "social-publisher.mjs"), packFile, `--report=${reportFile}`];
    if (args.dryRun) publisherArgs.push("--dry-run");
    const result = spawnSync(process.execPath, publisherArgs, { cwd: ROOT, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`PublisherAgent exited with code ${result.status}`);
    const report = readJson(reportFile, null);
    const audit = new PublicationAuditAgent().evaluate(report, { requirePublicDelivery: !args.dryRun });
    console.log(`[AuditAgent] public=${audit.counts.publishedPublic}, accepted=${audit.counts.acceptedByBuffer}, fallback=${audit.counts.fallbackAdmin}, disconnected=${audit.counts.skippedDisconnected}, failed=${audit.counts.failed}`);
    if (!args.dryRun) {
      writeJson(CLOUD_STATE_FILE, updateCloudState(state, pack, audit, report));
      console.log(`Recorded successful run evergreen:${pack.source.id}.`);
    }
    return;
  }
  const selection = scout.select({
    slot: "news",
    games: [],
    newsItems,
    recentGames: [],
    recentNews: [],
    trends: trendSnapshot.trends,
    seed: `${runKey}:${newsItems.map((item) => item.slug).join(":")}`,
    referenceDate: args.date,
  });
  console.log(
    `[TrafficAcquisitionAgent] selected news/${selection.item.slug} score=${selection.acquisition.score} reasons=${selection.acquisition.reasons.join(",")}`,
  );
  const rawPack = newsPack(selection.item, args.date, "news", selection.acquisition, trendSnapshot);
  const availablePlatforms = new Set(eligiblePlatforms(state, args.date));
  rawPack.items = rawPack.items.filter((item) => availablePlatforms.has(item.platform));
  if (rawPack.items.length === 0) {
    console.log("[SocialPolicy] Every enabled platform has already published today; nothing to send.");
    return;
  }
  const pack = new EditorialAgent().review(rawPack);
  console.log(`[EditorAgent] approved ${pack.items.length} platform drafts`);

  if (args.offline) {
    console.log("[Preflight] offline mode skipped public URL verification");
  } else {
    await verifyPublicUrl(pack.items[0].url);
  }
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  const packFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}.json`);
  const reportFile = path.join(SOCIAL_DIR, `${args.date}-${args.slot}-delivery.json`);
  writeJson(packFile, pack);

  const publisherArgs = [path.join(ROOT, "scripts", "social-publisher.mjs"), packFile, `--report=${reportFile}`];
  if (args.dryRun) publisherArgs.push("--dry-run");
  if (args.force) publisherArgs.push("--force");
  const result = spawnSync(process.execPath, publisherArgs, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`PublisherAgent exited with code ${result.status}`);

  const report = readJson(reportFile, null);
  const audit = new PublicationAuditAgent().evaluate(report, { requirePublicDelivery: !args.dryRun });
  console.log(`[AuditAgent] public=${audit.counts.publishedPublic}, accepted=${audit.counts.acceptedByBuffer}, fallback=${audit.counts.fallbackAdmin}, disconnected=${audit.counts.skippedDisconnected}, failed=${audit.counts.failed}`);

  if (!args.dryRun) {
    writeJson(CLOUD_STATE_FILE, updateCloudState(state, pack, audit, report));
    console.log(`Recorded successful run ${runKey}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
