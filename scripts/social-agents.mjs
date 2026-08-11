import crypto from "node:crypto";

export const SOCIAL_PLATFORMS = Object.freeze([
  "telegram",
  "discord",
  "x",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
]);

const PLATFORM_SET = new Set(SOCIAL_PLATFORMS);
const TEXT_LIMITS = Object.freeze({
  telegram: 3500,
  discord: 1900,
  x: 240,
  facebook: 3000,
  instagram: 2200,
  tiktok: 2200,
  youtube: 3000,
});

const SECRET_PATTERNS = [
  /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/i,
  /\b(?:sk|xai|citedy_agent)_[A-Za-z0-9_-]{20,}\b/i,
];

// Typical byte-decoding artifacts. Real Arabic text does not need these Latin
// characters, so rejecting them prevents the broken Arabic seen in old feeds.
const MOJIBAKE_PATTERN = /[\uFFFD\u00C2\u00C3\u00D8\u00D9]|\u00F0\u0178/u;

function stableIndex(seed, length) {
  if (length < 1) throw new Error("ScoutAgent received an empty content pool");
  const hash = crypto.createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0) % length;
}

function chooseUnused(items, recentIds, seed, idField = "slug") {
  const recent = new Set(recentIds || []);
  const fresh = items.filter((item) => !recent.has(item[idField]));
  const pool = fresh.length > 0 ? fresh : items;
  if (pool.length === 0) throw new Error("ScoutAgent found no eligible content");
  return pool[stableIndex(seed, pool.length)];
}

export class ContentScoutAgent {
  select({ slot, games, newsItems, recentGames, recentNews, seed }) {
    if (slot === "evening" && newsItems.length > 0) {
      return {
        kind: "news",
        item: chooseUnused(newsItems, recentNews, seed),
      };
    }
    return {
      kind: "game",
      item: chooseUnused(games, recentGames, seed),
    };
  }
}

function countArabicLetters(text) {
  return (text.match(/[\u0600-\u06FF]/gu) || []).length;
}

function countLetters(text) {
  return (text.match(/\p{L}/gu) || []).length;
}

function validateText(item, index, campaign) {
  const normalized = String(item.text || "").replace(/\r\n/g, "\n").trim().normalize("NFC");
  const limit = TEXT_LIMITS[item.platform] || 3000;
  if (normalized.length < 10 || normalized.length > limit) {
    throw new Error(`EditorAgent: items[${index}].text must contain 10-${limit} characters`);
  }
  if (MOJIBAKE_PATTERN.test(normalized)) {
    throw new Error(`EditorAgent: items[${index}].text contains broken encoding`);
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new Error(`EditorAgent: items[${index}].text appears to contain a secret`);
  }
  if (String(campaign || "").startsWith("ar_")) {
    const arabic = countArabicLetters(normalized);
    const letters = countLetters(normalized);
    if (arabic < 8 || (letters > 0 && arabic / letters < 0.55)) {
      throw new Error(`EditorAgent: items[${index}].text does not contain enough Arabic`);
    }
  }
  return normalized;
}

export class EditorialAgent {
  review(pack) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pack?.date || "")) {
      throw new Error("EditorAgent: pack.date must use YYYY-MM-DD");
    }
    if (!Array.isArray(pack.items) || pack.items.length === 0 || pack.items.length > 10) {
      throw new Error("EditorAgent: pack.items must contain 1-10 posts");
    }

    const seenPlatforms = new Set();
    const items = pack.items.map((item, index) => {
      if (!PLATFORM_SET.has(item.platform)) {
        throw new Error(`EditorAgent: items[${index}].platform is not supported`);
      }
      if (seenPlatforms.has(item.platform)) {
        throw new Error(`EditorAgent: duplicate ${item.platform} item in one pack`);
      }
      seenPlatforms.add(item.platform);
      if (!/^[a-z0-9-]{3,80}$/.test(item.contentId || "")) {
        throw new Error(`EditorAgent: items[${index}].contentId must be kebab-case`);
      }

      if (item.url) {
        const url = new URL(item.url);
        if (url.protocol !== "https:" || !["plixfy.com", "www.plixfy.com"].includes(url.hostname)) {
          throw new Error(`EditorAgent: items[${index}].url must be a Plixfy HTTPS URL`);
        }
      }
      if (item.image && new URL(item.image).protocol !== "https:") {
        throw new Error(`EditorAgent: items[${index}].image must use HTTPS`);
      }
      if (item.video) {
        const video = new URL(item.video);
        if (video.protocol !== "https:" || !["plixfy.com", "www.plixfy.com"].includes(video.hostname)) {
          throw new Error(`EditorAgent: items[${index}].video must be a Plixfy HTTPS URL`);
        }
      }

      return { ...item, text: validateText(item, index, pack.campaign) };
    });

    return { ...pack, items };
  }
}

export function deliveryCounts(deliveries = []) {
  return deliveries.reduce(
    (counts, delivery) => {
      counts.total += 1;
      if (delivery.status === "published_public") counts.publishedPublic += 1;
      else if (delivery.status === "accepted_by_buffer") counts.acceptedByBuffer += 1;
      else if (delivery.status === "fallback_admin") counts.fallbackAdmin += 1;
      else if (delivery.status === "skipped_disconnected") counts.skippedDisconnected += 1;
      else if (delivery.status === "failed") counts.failed += 1;
      else if (delivery.status === "dry_run") counts.dryRun += 1;
      return counts;
    },
    {
      total: 0,
      publishedPublic: 0,
      acceptedByBuffer: 0,
      fallbackAdmin: 0,
      skippedDisconnected: 0,
      failed: 0,
      dryRun: 0,
    },
  );
}

export class PublicationAuditAgent {
  evaluate(report, { requirePublicDelivery = true } = {}) {
    if (!report || !Array.isArray(report.deliveries)) {
      throw new Error("AuditAgent: delivery report is missing or invalid");
    }
    const counts = deliveryCounts(report.deliveries);
    const handedToPublicChannel = counts.publishedPublic + counts.acceptedByBuffer;
    if (requirePublicDelivery && handedToPublicChannel === 0) {
      throw new Error(
        `AuditAgent: zero public posts; fallback=${counts.fallbackAdmin}, disconnected=${counts.skippedDisconnected}, failed=${counts.failed}`,
      );
    }
    return {
      ok: counts.failed === 0 && (!requirePublicDelivery || handedToPublicChannel > 0),
      counts,
    };
  }
}
