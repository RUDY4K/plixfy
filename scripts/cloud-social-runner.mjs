// Local, deterministic social agents for GitHub Actions.
// Usage: node scripts/cloud-social-runner.mjs [--slot=morning|evening|auto] [--dry-run] [--force]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  EditorialAgent,
  PublicationAuditAgent,
} from "./social-agents.mjs";
import { loadPlaygamaGames } from "./playgama-social-games.mjs";
import {
  ACQUISITION_CAMPAIGN,
  TrafficAcquisitionAgent,
  fetchSaudiTrends,
} from "./traffic-acquisition-agent.mjs";
import { normalizeContentDate } from "./social-schedule-core.mjs";

const ROOT = process.cwd();
const SOCIAL_DIR = path.join(ROOT, ".social");
const CLOUD_STATE_FILE = path.join(SOCIAL_DIR, "cloud-state.json");
const TREND_CACHE_FILE = path.join(SOCIAL_DIR, "saudi-trends.json");
const SITE = "https://www.plixfy.com";
const VERIFIED_GAMEPLAY_IDS = new Set(["mr-racer-car-racing"]);

const CATEGORY_AR = {
  racing: "سباق",
  action: "أكشن",
  puzzle: "ألغاز",
  io: "ألعاب .io",
  girls: "تلبيس وتصميم",
  casual: "ألعاب خفيفة",
  sports: "رياضة",
  shooting: "تصويب",
};

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
  if (!["auto", "morning", "evening"].includes(value)) {
    throw new Error("--slot must be morning, evening, or auto");
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
    slot: value === "auto" ? (hour < 15 ? "morning" : "evening") : value,
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

function acquisitionContentId(kind, slug, hookVariant) {
  const suffix = `-h${hookVariant}`;
  return `${cleanContentId(`${kind}-${slug}`).slice(0, 72 - suffix.length).replace(/-$/, "")}${suffix}`;
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

function socialVideoUrl(kind, id) {
  return `${SITE}/social/videos/${encodeURIComponent(`${kind}-${id}.mp4`)}`;
}

function enabledPlatforms() {
  return new Set(
    String(process.env.SOCIAL_PLATFORMS || "telegram,discord,x,facebook,instagram")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value && value !== "tiktok"),
  );
}

function runRequired(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

async function waitForPublicVideo(url) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        cache: "no-store",
        headers: { "user-agent": "PlixfyCloudSocial/2.0" },
        signal: AbortSignal.timeout(15_000),
      });
      const type = response.headers.get("content-type") || "";
      if (response.ok && type.startsWith("video/")) return;
    } catch {
      // Vercel may still be deploying the commit. Retry on the next interval.
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`Generated TikTok video did not become public in time: ${url}`);
}

async function attachTikTokVideo(pack, args) {
  const enabled = enabledPlatforms();
  const item = pack.items.find((candidate) => candidate.platform === "tiktok");
  if (!item || !enabled.has("tiktok") || args.dryRun) return pack;

  const filename = `${pack.source.kind}-${pack.source.id}.mp4`;
  const relativeOutput = path.join("public", "social", "videos", filename);
  if (pack.source.kind === "game") {
    const gameplay = spawnSync(
      process.execPath,
      [
        path.join(ROOT, "scripts", "capture-gameplay-video.mjs"),
        `--id=${pack.source.id}`,
        `--output=${relativeOutput}`,
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
    if (gameplay.status !== 0) {
      throw new Error(`[VideoAgent] gameplay capture failed for ${pack.source.id}`);
    }
  } else {
    runRequired(process.execPath, [
      path.join(ROOT, "scripts", "generate-social-video.mjs"),
      `--kind=${pack.source.kind}`,
      `--id=${pack.source.id}`,
      `--output=${relativeOutput}`,
    ]);
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    runRequired("git", ["config", "user.name", "github-actions[bot]"]);
    runRequired("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
    runRequired("git", ["add", "--", relativeOutput]);
    const changed = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: ROOT }).status !== 0;
    if (changed) {
      runRequired("git", ["commit", "-m", `chore: render TikTok video for ${pack.source.id}`]);
      runRequired("git", ["push", "origin", "HEAD:main"]);
    }
  }

  item.video = socialVideoUrl(pack.source.kind, pack.source.id);
  await waitForPublicVideo(item.video);
  return pack;
}

function loadGames({ recordableOnly = false } = {}) {
  const playgamaGames = loadPlaygamaGames(ROOT);
  const games = recordableOnly
    ? playgamaGames.filter((game) => VERIFIED_GAMEPLAY_IDS.has(game.slug))
    : playgamaGames;
  return games.sort((a, b) => a.slug.localeCompare(b.slug));
}

function loadNews(referenceDate) {
  const referenceTime = Date.parse(`${referenceDate}T23:59:59Z`);
  const cutoffTime = referenceTime - 7 * 24 * 60 * 60 * 1000;
  return readJson(path.join(ROOT, "src", "data", "news.json"), [])
    .filter((item) => item?.slug && item?.title && item?.summary && item?.publishedAt)
    .filter((item) => {
      const publishedTime = Date.parse(`${item.publishedAt}T00:00:00Z`);
      return Number.isFinite(publishedTime) && publishedTime >= cutoffTime && publishedTime <= referenceTime;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function gamePack(game, date, slot, acquisition, trendSnapshot) {
  const title = truncate(game.title, 70);
  const category = CATEGORY_AR[game.categorySlug] || game.category || "ألعاب";
  const url = `${SITE}/play/${encodeURIComponent(game.slug)}`;
  const hookVariant = acquisition.hookVariant;
  const contentId = acquisitionContentId("game", game.slug, hookVariant);
  const image = socialCardUrl("game", game.slug);
  const lead = {
    a: `🎮 تحدي اليوم: ${title}`,
    b: `⚡ تلعبها فورًا: ${title}`,
    c: `👀 اختيار يستحق التجربة: ${title}`,
  }[hookVariant];
  return {
    date,
    campaign: ACQUISITION_CAMPAIGN,
    slot,
    source: { kind: "game", id: game.slug },
    acquisition: { ...acquisition, trendSource: trendSnapshot.source, trendStatus: trendSnapshot.status },
    items: [
      { platform: "telegram", kind: "game", contentId, text: `${lead}\n\nلعبة ${category} تعمل مجانًا من المتصفح بدون تحميل أو تسجيل. جرّبها وشاركنا نتيجتك!`, url, image },
      { platform: "discord", kind: "game", contentId, title: lead, text: `${lead}\n\nادخل التحدي مجانًا من المتصفح، بدون تحميل أو تسجيل، ثم شاركنا نتيجتك في الديسكورد.`, url, image },
      { platform: "x", kind: "game", contentId, text: `${truncate(lead, 100)}\n\nمجانية من المتصفح وبدون تحميل. كم نتيجة تقدر تحقق؟ 👇\n#ألعاب #Plixfy`, url, image },
      { platform: "facebook", kind: "game", contentId, text: `${lead}. لعبة ${category} تعمل مباشرة من المتصفح مجانًا، بدون تحميل أو إنشاء حساب. جرّبها وقل لنا: وصلت لأي نتيجة؟`, url, image },
      { platform: "instagram", kind: "game", contentId, text: `${lead}\n\nالعبها مجانًا من المتصفح وشاركنا نتيجتك. الرابط في Plixfy.\n\n#ألعاب #ألعاب_مجانية #ألعاب_متصفح #Plixfy`, url, image },
    ],
  };
}

function newsPack(news, date, slot, acquisition, trendSnapshot) {
  const title = truncate(news.title, 110);
  const summary = truncate(news.summary, 260);
  const url = `${SITE}/news/${encodeURIComponent(news.slug)}`;
  const hookVariant = acquisition.hookVariant;
  const contentId = acquisitionContentId("news", news.slug, hookVariant);
  const image = socialCardUrl("news", news.slug);
  const lead = {
    a: `📰 الخبر الذي يتداوله اللاعبون: ${title}`,
    b: `⚡ ماذا حدث في عالم الألعاب؟ ${title}`,
    c: `🎮 لماذا يهم هذا الخبر اللاعبين؟ ${title}`,
  }[hookVariant];
  return {
    date,
    campaign: ACQUISITION_CAMPAIGN,
    slot,
    source: { kind: "news", id: news.slug },
    acquisition: { ...acquisition, trendSource: trendSnapshot.source, trendStatus: trendSnapshot.status },
    items: [
      { platform: "telegram", kind: "news", contentId, text: `${lead}\n\n${summary}\n\nاقرأ التفاصيل على Plixfy:`, url, image },
      { platform: "discord", kind: "news", contentId, title: truncate(lead, 120), text: `${truncate(summary, 420)}\n\nناقش الخبر معنا ثم اقرأ التفاصيل الكاملة على Plixfy.`, url, image },
      { platform: "x", kind: "news", contentId, text: `${truncate(lead, 165)}\n\nالتفاصيل على Plixfy 👇\n#أخبار_الألعاب`, url, image },
      { platform: "facebook", kind: "news", contentId, text: `${lead}\n\n${summary}\n\nما رأيكم بالخبر؟ اقرأوا التفاصيل الكاملة على Plixfy.`, url, image },
      { platform: "instagram", kind: "news", contentId, text: `${lead}\n\n${truncate(summary, 180)}\n\nالتفاصيل على Plixfy.\n\n#أخبار_الألعاب #GamingNews #Plixfy`, url, image },
    ],
  };
}

function updateCloudState(state, pack, audit) {
  const now = new Date().toISOString();
  const runKey = `${pack.date}:${pack.slot}`;
  const next = {
    recentGames: state.recentGames || [],
    recentNews: state.recentNews || [],
    runs: state.runs || {},
  };
  if (pack.source.kind === "game") {
    next.recentGames = [pack.source.id, ...next.recentGames.filter((id) => id !== pack.source.id)].slice(0, 30);
  } else {
    next.recentNews = [pack.source.id, ...next.recentNews.filter((id) => id !== pack.source.id)].slice(0, 30);
  }
  next.runs[runKey] = {
    status: "delivered",
    source: pack.source,
    acquisition: pack.acquisition,
    counts: audit.counts,
    completedAt: now,
  };
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
  const state = readJson(CLOUD_STATE_FILE, { recentGames: [], recentNews: [], runs: {} });
  const runKey = `${args.date}:${args.slot}`;
  if (!args.dryRun && !args.force && state.runs?.[runKey]?.status === "delivered") {
    console.log(`Run ${runKey} is already complete; nothing to do.`);
    return;
  }

  const hasTikTok = enabledPlatforms().has("tiktok");
  const trendSnapshot = await fetchSaudiTrends({
    cacheFile: TREND_CACHE_FILE,
    fetchImpl: args.offline ? offlineFetch : fetch,
  });
  console.log(
    `[TrendAgent] source=${trendSnapshot.source} status=${trendSnapshot.status} terms=${trendSnapshot.trends.length}`,
  );
  if (trendSnapshot.warning) console.warn(`[TrendAgent] ${trendSnapshot.warning}`);
  const scout = new TrafficAcquisitionAgent();
  let games = loadGames({ recordableOnly: hasTikTok });
  const newsItems = loadNews(args.date);
  const maximumAttempts = !args.dryRun && hasTikTok ? 6 : 1;
  let selection;
  let rawPack;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    selection = scout.select({
      slot: args.slot,
      games,
      newsItems,
      recentGames: state.recentGames || [],
      recentNews: state.recentNews || [],
      trends: trendSnapshot.trends,
      seed: `${runKey}:${attempt}`,
      referenceDate: args.date,
    });
    console.log(
      `[TrafficAcquisitionAgent] selected ${selection.kind}/${selection.item.slug} score=${selection.acquisition.score} hook=${selection.acquisition.hookVariant} reasons=${selection.acquisition.reasons.join(",")}`,
    );
    rawPack = selection.kind === "news"
      ? newsPack(selection.item, args.date, args.slot, selection.acquisition, trendSnapshot)
      : gamePack(selection.item, args.date, args.slot, selection.acquisition, trendSnapshot);
    try {
      await attachTikTokVideo(rawPack, args);
      break;
    } catch (error) {
      if (selection.kind !== "game" || attempt === maximumAttempts - 1) throw error;
      console.warn(`${error.message}; trying another game`);
      games = games.filter((game) => game.slug !== selection.item.slug);
    }
  }

  if (!selection || !rawPack) throw new Error("TrafficAcquisitionAgent could not prepare a social pack");
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
    writeJson(CLOUD_STATE_FILE, updateCloudState(state, pack, audit));
    console.log(`Recorded successful run ${runKey}.`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
