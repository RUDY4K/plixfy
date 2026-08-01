import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, "scripts", ".social-published.json");
const ALLOWED_PLATFORMS = new Set([
  "telegram",
  "x",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
]);

function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}

function loadPack(file) {
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pack.date ?? "")) {
    throw new Error("pack.date must use YYYY-MM-DD");
  }
  if (!Array.isArray(pack.items) || pack.items.length === 0 || pack.items.length > 10) {
    throw new Error("pack.items must contain 1-10 posts");
  }
  for (const [index, item] of pack.items.entries()) {
    if (!ALLOWED_PLATFORMS.has(item.platform)) {
      throw new Error(`items[${index}].platform is not supported`);
    }
    if (typeof item.text !== "string" || item.text.trim().length < 10 || item.text.length > 3500) {
      throw new Error(`items[${index}].text must contain 10-3500 characters`);
    }
    if (!/^[a-z0-9-]{3,80}$/.test(item.contentId ?? "")) {
      throw new Error(`items[${index}].contentId must be kebab-case`);
    }
    if (item.url) {
      const url = new URL(item.url);
      if (url.protocol !== "https:" || !["plixfy.com", "www.plixfy.com"].includes(url.hostname)) {
        throw new Error(`items[${index}].url must be a Plixfy HTTPS URL`);
      }
    }
  }
  return pack;
}

function trackedUrl(item, pack) {
  if (!item.url) return "";
  const url = new URL(item.url);
  url.searchParams.set("utm_source", item.platform);
  url.searchParams.set("utm_medium", "organic_social");
  url.searchParams.set("utm_campaign", pack.campaign || "plixfy_daily");
  url.searchParams.set("utm_content", `${pack.date.replaceAll("-", "")}_${item.contentId}`);
  return url.toString();
}

function itemKey(item, pack) {
  return crypto
    .createHash("sha256")
    .update(`${pack.date}|${pack.campaign}|${item.platform}|${item.contentId}`)
    .digest("hex");
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { published: {} };
  }
}

function writeState(state) {
  const entries = Object.entries(state.published)
    .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
    .slice(0, 500);
  fs.writeFileSync(STATE_FILE, JSON.stringify({ published: Object.fromEntries(entries) }, null, 2) + "\n");
}

async function sendTelegram(chatId, text, preview = false) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: !preview,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    throw new Error(`Telegram sendMessage failed: HTTP ${response.status}`);
  }
}

function renderPost(item, pack, forAdmin) {
  const url = trackedUrl(item, pack);
  const heading = forAdmin ? `📦 ${item.platform.toUpperCase()} · ${item.kind || "post"}\n` : "";
  return `${heading}${item.text.trim()}${url ? `\n\n${url}` : ""}`;
}

async function main() {
  loadEnvLocal();
  const file = process.argv.find((arg) => arg.endsWith(".json"));
  const dryRun = process.argv.includes("--dry-run");
  if (!file) throw new Error("Usage: node scripts/social-publisher.mjs <pack.json> [--dry-run]");

  const pack = loadPack(path.resolve(file));
  const state = readState();
  const pending = pack.items.filter((item) => !state.published[itemKey(item, pack)]);

  console.log(`Validated ${pack.items.length} posts; ${pending.length} pending; dryRun=${dryRun}`);
  for (const item of pending) {
    console.log(`- ${item.platform}/${item.contentId} (${item.text.length} chars)`);
  }
  if (dryRun || pending.length === 0) return;

  for (const required of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) {
    if (!process.env[required]) throw new Error(`${required} is not set`);
  }

  const publicChatId = process.env.TELEGRAM_CHANNEL_ID;
  for (const item of pending) {
    if (item.platform === "telegram" && publicChatId) {
      await sendTelegram(publicChatId, renderPost(item, pack, false), true);
    }
    await sendTelegram(process.env.TELEGRAM_CHAT_ID, renderPost(item, pack, true), true);
    state.published[itemKey(item, pack)] = new Date().toISOString();
  }

  writeState(state);
  console.log(
    publicChatId
      ? `Published ${pending.length} posts and delivered the review pack to Telegram.`
      : `Delivered ${pending.length} review posts to Telegram; TELEGRAM_CHANNEL_ID is not set.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
