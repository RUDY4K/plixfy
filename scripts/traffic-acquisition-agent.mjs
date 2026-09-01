import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const SAUDI_TRENDS_URL = "https://trends.google.com/trending/rss?geo=SA";
export const ACQUISITION_CAMPAIGN = "ar_acquisition_v1";

const STOP_WORDS = new Set([
  "a", "account", "accounts", "al", "and", "at", "available", "browser", "desktop", "for", "free", "from",
  "game", "games", "in", "mobile", "national", "of", "on", "online", "open", "opened", "play", "player",
  "players", "playing", "the", "to", "using", "vs", "with",
  "آخر", "اخبار", "أخبار", "الى", "إلى", "الآن", "الجديد", "الجديدة", "اليوم", "على", "عن", "في", "من", "مع",
]);

const HIGH_INTENT_GAME_TERMS = new Set([
  "fortnite", "gta", "minecraft", "roblox", "sudoku", "wordle",
]);

const CATEGORY_SIGNALS = Object.freeze({
  sports: [
    /\b(?:football|soccer|league|cup|match|standings|arsenal|chelsea|liverpool|madrid|barcelona|fifa)\b/u,
    /(?:ضد|الدوري|دوري|كأس|مباراة|الهلال|النصر|الاتحاد|الأهلي|القادسية|الفيحاء|الزمالك|كرة القدم)/u,
  ],
  racing: [
    /\b(?:car|cars|racing|race|driver|vehicle|hyundai|toyota|mercedes|formula 1|f1)\b/u,
    /(?:سيارة|سيارات|سباق|سباقات|مرسيدس|هيونداي|فورمولا)/u,
  ],
  shooting: [
    /\b(?:call of duty|cod|modern warfare|mw4|battlefield|shooter|shooting|sniper)\b/u,
    /(?:كول أوف ديوتي|كول اوف ديوتي|حرب|تصويب|قناص)/u,
  ],
  action: [
    /\b(?:gta\d*|grand theft auto|minecraft|roblox|fortnite|action|adventure|survival)\b/u,
    /(?:ماينكرافت|روبلوكس|فورتنايت|أكشن|اكشن|مغامرات|بقاء)/u,
  ],
  puzzle: [
    /\b(?:puzzle|wordle|sudoku|chess|brain teaser)\b/u,
    /(?:ألغاز|الغاز|سودوكو|شطرنج|كلمات)/u,
  ],
});

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function decodeXml(value) {
  return String(value || "")
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function trafficNumber(value) {
  const normalized = String(value || "").replace(/,/g, "").trim().toUpperCase();
  const match = normalized.match(/([\d.]+)\s*([KMB])?/);
  if (!match) return 0;
  const multiplier = match[2] === "B" ? 1_000_000_000 : match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

export function parseGoogleTrendsRss(xml) {
  const items = String(xml || "").match(/<item>[\s\S]*?<\/item>/g) || [];
  return items
    .map((item) => {
      const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
      const approximateTraffic = trafficNumber(
        decodeXml(item.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]),
      );
      const publishedAt = decodeXml(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]);
      return { term: title, approximateTraffic, publishedAt };
    })
    .filter((trend) => trend.term)
    .slice(0, 50);
}

export async function fetchSaudiTrends({
  cacheFile,
  fetchImpl = fetch,
  now = new Date(),
  maxCacheAgeHours = 48,
} = {}) {
  try {
    const response = await fetchImpl(SAUDI_TRENDS_URL, {
      headers: { "user-agent": "PlixfyTrafficAcquisitionAgent/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Google Trends returned HTTP ${response.status}`);
    const trends = parseGoogleTrendsRss(await response.text());
    if (trends.length === 0) throw new Error("Google Trends returned no usable terms");
    const snapshot = {
      version: 1,
      source: "google_trends_sa",
      status: "live",
      fetchedAt: now.toISOString(),
      trends,
    };
    if (cacheFile) writeJsonAtomic(cacheFile, snapshot);
    return snapshot;
  } catch (error) {
    const cached = cacheFile ? readJson(cacheFile) : null;
    const cachedAt = Date.parse(cached?.fetchedAt || "");
    const age = now.getTime() - cachedAt;
    if (
      Array.isArray(cached?.trends)
      && cached.trends.length > 0
      && Number.isFinite(age)
      && age >= 0
      && age <= maxCacheAgeHours * 60 * 60 * 1000
    ) {
      return { ...cached, status: "cached", warning: error.message };
    }
    return {
      version: 1,
      source: "catalog_fallback",
      status: "unavailable",
      fetchedAt: now.toISOString(),
      trends: [],
      warning: error.message,
    };
  }
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/gu, "")
    .replace(/[إأآ]/gu, "ا")
    .replace(/ة/gu, "ه")
    .replace(/ى/gu, "ي")
    .toLowerCase()
    .replace(/\bgta\d+\b/gu, "gta")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function trendCategories(trends) {
  const value = normalize(trends.map((trend) => trend.term || trend).join(" | "));
  return new Set(
    Object.entries(CATEGORY_SIGNALS)
      .filter(([, patterns]) => patterns.some((pattern) => pattern.test(value)))
      .map(([category]) => category),
  );
}

function trendTokenWeights(trends) {
  const weights = new Map();
  for (const trend of trends) {
    const traffic = Math.max(0, Number(trend.approximateTraffic) || 0);
    const weight = Math.max(1, Math.min(5, Math.log10(traffic + 10) - 1));
    for (const token of tokens(trend.term || trend)) {
      weights.set(token, Math.max(weights.get(token) || 0, weight));
    }
  }
  return weights;
}

function contentTrendMatch(searchable, trends) {
  const contentTokens = tokens(searchable);
  const trendWeights = trendTokenWeights(trends);
  const matches = new Set();
  const matchedTerms = [];
  for (const trend of trends) {
    const overlap = [...tokens(trend.term || trend)].filter((token) => contentTokens.has(token));
    // A single shared word can connect unrelated topics (for example a film
    // and a game with the same adjective). Require a compound match; broad
    // category interest is scored separately by CATEGORY_SIGNALS.
    if (overlap.length < 2 && !overlap.some((token) => HIGH_INTENT_GAME_TERMS.has(token))) continue;
    overlap.forEach((token) => matches.add(token));
    matchedTerms.push(trend.term || trend);
  }
  const score = [...matches].reduce((sum, token) => sum + trendWeights.get(token) * 20, 0);
  return {
    score: Math.min(60, score),
    matches: [...matches].slice(0, 6),
    matchedTerms: matchedTerms.slice(0, 3),
  };
}

function stableTieBreaker(seed, id) {
  const digest = crypto.createHash("sha256").update(`${seed}:${id}`).digest();
  return digest.readUInt32BE(0) / 0xffffffff;
}

function chooseFresh(items, recentIds) {
  const recent = new Set(recentIds || []);
  const fresh = items.filter((item) => !recent.has(item.slug));
  return fresh.length > 0 ? fresh : items;
}

function rankGames(games, trends, recentGames, seed) {
  const categories = trendCategories(trends);
  return chooseFresh(games, recentGames)
    .map((game) => {
      let score = 0;
      const reasons = [];
      const searchable = [
        game.title,
        game.category,
        game.categorySlug,
        game.description,
        ...(game.genres || []),
      ].join(" ");
      if (game.supportedDevices === "mobile-and-desktop") {
        score += 18;
        reasons.push("mobile_and_desktop");
      }
      if (String(game.description || "").length >= 300) {
        score += 10;
        reasons.push("rich_page");
      }
      if (game.thumbnailWide) score += 6;
      if (Array.isArray(game.images) && game.images.length >= 2) score += 4;
      const gameCategories = new Set([game.categorySlug, ...inferContentCategories(searchable)]);
      const categoryMatch = [...gameCategories].find((category) => categories.has(category));
      if (categoryMatch) {
        score += 28;
        reasons.push(`saudi_interest:${categoryMatch}`);
      }
      const match = contentTrendMatch(searchable, trends);
      if (match.score > 0) {
        score += match.score;
        reasons.push("trend_match");
      }
      return {
        item: game,
        score,
        reasons,
        matchedTerms: match.matchedTerms,
        rank: score + stableTieBreaker(seed, game.slug),
      };
    })
    .sort((a, b) => b.rank - a.rank || a.item.slug.localeCompare(b.item.slug));
}

function inferContentCategories(value) {
  const normalized = normalize(value);
  return new Set(
    Object.entries(CATEGORY_SIGNALS)
      .filter(([, patterns]) => patterns.some((pattern) => pattern.test(normalized)))
      .map(([category]) => category),
  );
}

function rankNews(newsItems, trends, recentNews, referenceDate, seed) {
  const categories = trendCategories(trends);
  const referenceTime = Date.parse(`${referenceDate}T23:59:59Z`);
  return chooseFresh(newsItems, recentNews)
    .map((news) => {
      let score = 0;
      const reasons = [];
      const publishedTime = Date.parse(`${news.publishedAt}T00:00:00Z`);
      const ageDays = Number.isFinite(publishedTime)
        ? Math.max(0, Math.floor((referenceTime - publishedTime) / 86_400_000))
        : 7;
      const freshness = Math.max(0, 35 - ageDays * 7);
      score += freshness;
      if (freshness >= 28) reasons.push("fresh_news");
      if (String(news.summary || "").length >= 180) score += 8;
      const searchable = [news.title, news.titleEn, news.summary, news.summaryEn].join(" ");
      const contentCategories = inferContentCategories(searchable);
      const categoryMatches = [...contentCategories].filter((category) => categories.has(category));
      if (categoryMatches.length > 0) {
        score += 24;
        reasons.push(`saudi_interest:${categoryMatches[0]}`);
      }
      const match = contentTrendMatch(searchable, trends);
      if (match.score > 0) {
        score += match.score;
        reasons.push("trend_match");
      }
      return {
        item: news,
        score,
        reasons,
        matchedTerms: match.matchedTerms,
        rank: score + stableTieBreaker(seed, news.slug),
      };
    })
    .sort((a, b) => b.rank - a.rank || a.item.slug.localeCompare(b.item.slug));
}

export function chooseHookVariant(seed, id) {
  const digest = crypto.createHash("sha256").update(`${seed}:${id}:hook`).digest();
  return ["a", "b", "c"][digest[0] % 3];
}

export class TrafficAcquisitionAgent {
  select({ slot, games, newsItems, recentGames = [], recentNews = [], trends = [], seed, referenceDate }) {
    const useNews = ["news", "evening"].includes(slot) && newsItems.length > 0;
    const ranked = useNews
      ? rankNews(newsItems, trends, recentNews, referenceDate, seed)
      : rankGames(games, trends, recentGames, seed);
    if (ranked.length === 0) throw new Error("TrafficAcquisitionAgent found no eligible content");
    const selected = ranked[0];
    return {
      kind: useNews ? "news" : "game",
      item: selected.item,
      acquisition: {
        agent: "traffic-acquisition-v1",
        score: Math.round(selected.score),
        reasons: selected.reasons.length > 0 ? selected.reasons : ["catalog_quality"],
        matchedTrends: selected.matchedTerms,
        hookVariant: chooseHookVariant(seed, selected.item.slug),
      },
    };
  }
}
