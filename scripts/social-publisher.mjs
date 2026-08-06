import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  loadEnvLocal,
  sendTelegramMessage,
  sendTelegramPhoto,
} from "./telegram-client.mjs";
import {
  discoverBufferChannels,
  isBufferConfigured,
  mapChannelsByPlatform,
  publishBufferPost,
} from "./buffer-client.mjs";

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
    if (item.image) {
      const image = new URL(item.image);
      if (image.protocol !== "https:") {
        throw new Error(`items[${index}].image must use HTTPS`);
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
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return {
      published: state.published || {},
      deliveries: state.deliveries || {},
    };
  } catch {
    return { published: {}, deliveries: {} };
  }
}

function writeState(state) {
  const prune = (record, limit) =>
    Object.fromEntries(
      Object.entries(record)
        .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
        .slice(0, limit),
    );
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        published: prune(state.published, 500),
        deliveries: prune(state.deliveries, 1000),
      },
      null,
      2,
    ) + "\n",
  );
}

function renderPost(item, pack, forAdmin) {
  const url = trackedUrl(item, pack);
  const heading = forAdmin ? `📦 ${item.platform.toUpperCase()} · ${item.kind || "post"}\n` : "";
  return `${heading}${item.text.trim()}${url ? `\n\n${url}` : ""}`;
}

function activePlatforms() {
  const configured = process.env.SOCIAL_PLATFORMS || "telegram,x,instagram,tiktok";
  return new Set(
    configured
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => ALLOWED_PLATFORMS.has(value)),
  );
}

async function deliver(chatId, item, pack, forAdmin) {
  const text = renderPost(item, pack, forAdmin);
  if (item.image && text.length <= 1024) {
    try {
      await sendTelegramPhoto(chatId, item.image, text);
      return;
    } catch (error) {
      console.warn(`Photo delivery failed; falling back to text (${error.message})`);
    }
  }
  await sendTelegramMessage(chatId, text, { preview: true });
}

async function main() {
  loadEnvLocal();
  const file = process.argv.find((arg) => arg.endsWith(".json"));
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  if (!file) throw new Error("Usage: node scripts/social-publisher.mjs <pack.json> [--dry-run]");

  const pack = loadPack(path.resolve(file));
  const state = readState();
  const enabled = activePlatforms();
  const selected = pack.items.filter((item) => enabled.has(item.platform));
  const pending = force
    ? selected
    : selected.filter((item) => !state.published[itemKey(item, pack)]);

  console.log(
    `Validated ${pack.items.length} posts; ${selected.length} enabled; ${pending.length} pending; dryRun=${dryRun}; force=${force}`,
  );
  for (const item of pending) {
    console.log(`- ${item.platform}/${item.contentId} (${item.text.length} chars)`);
  }
  let bufferChannels = {};
  if (isBufferConfigured()) {
    try {
      const discovered = await discoverBufferChannels();
      bufferChannels = mapChannelsByPlatform(discovered.channels);
      console.log(
        `Buffer connected: ${Object.entries(bufferChannels)
          .map(([platform, channel]) => `${platform}=${channel.displayName || channel.name}`)
          .join(", ") || "no channels"}`,
      );
    } catch (error) {
      console.warn(`Buffer discovery failed; using Telegram fallback: ${error.message}`);
    }
  }
  if (dryRun || pending.length === 0) return;

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required for alerts and fallback");
  }

  const publicChatId = process.env.TELEGRAM_CHANNEL_ID;

  const summary = [];
  for (const item of pending) {
    const key = itemKey(item, pack);
    const publicDeliveryKey = `${key}:public`;
    const adminDeliveryKey = `${key}:admin`;
    const bufferDeliveryKey = `${key}:buffer`;
    let completed = false;

    if (item.platform === "telegram" && publicChatId && !state.deliveries[publicDeliveryKey]) {
      await deliver(publicChatId, item, pack, false);
      state.deliveries[publicDeliveryKey] = new Date().toISOString();
      writeState(state);
      completed = true;
      summary.push(`✅ Telegram: ${item.contentId}`);
    }

    const bufferChannel = bufferChannels[item.platform];
    if (item.platform !== "telegram" && bufferChannel && !state.deliveries[bufferDeliveryKey]) {
      try {
        const post = await publishBufferPost({
          channelId: bufferChannel.id,
          platform: item.platform,
          text: renderPost(item, pack, false),
          image: item.image,
          title: item.title || item.text.split("\n")[0],
        });
        state.deliveries[bufferDeliveryKey] = new Date().toISOString();
        writeState(state);
        completed = true;
        summary.push(`✅ ${item.platform.toUpperCase()}: ${post.id}`);
      } catch (error) {
        console.warn(`${item.platform} publish failed; using Telegram fallback: ${error.message}`);
        summary.push(`⚠️ ${item.platform.toUpperCase()}: ${error.message}`);
      }
    }

    if (!completed && !state.deliveries[adminDeliveryKey]) {
      await deliver(process.env.TELEGRAM_CHAT_ID, item, pack, true);
      state.deliveries[adminDeliveryKey] = new Date().toISOString();
      writeState(state);
      completed = true;
      summary.push(`📦 ${item.platform.toUpperCase()}: sent to Telegram fallback`);
    }
    if (completed) {
      state.published[key] = new Date().toISOString();
      writeState(state);
    }
  }

  if (summary.length > 0) {
    await sendTelegramMessage(
      process.env.TELEGRAM_CHAT_ID,
      [`📊 تقرير نشر Plixfy (${pack.date} · ${pack.slot})`, ...summary].join("\n"),
    );
  }
  console.log(`Completed ${pending.length} social deliveries.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
