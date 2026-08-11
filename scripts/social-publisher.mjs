import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadEnvLocal, sendTelegramMessage, sendTelegramPhoto } from "./telegram-client.mjs";
import {
  discoverBufferChannels,
  isBufferConfigured,
  mapChannelsByPlatform,
  publishBufferPost,
  waitForBufferPost,
} from "./buffer-client.mjs";
import { EditorialAgent, deliveryCounts } from "./social-agents.mjs";
import { isDiscordConfigured, sendDiscordPost } from "./discord-client.mjs";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, "scripts", ".social-published.json");
const ALLOWED_PLATFORMS = new Set(["telegram", "discord", "x", "facebook", "instagram", "tiktok", "youtube"]);

function loadPack(file) {
  return new EditorialAgent().review(JSON.parse(fs.readFileSync(file, "utf8")));
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
    .update(`${pack.campaign}|${item.platform}|${item.contentId}`)
    .digest("hex");
}

function readState() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return { published: state.published || {}, deliveries: state.deliveries || {} };
  } catch {
    return { published: {}, deliveries: {} };
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

function writeState(state) {
  const prune = (record, limit) => Object.fromEntries(Object.entries(record).slice(-limit));
  writeJsonAtomic(STATE_FILE, {
    published: prune(state.published, 500),
    deliveries: prune(state.deliveries, 1000),
  });
}

function renderPost(item, pack, forAdmin = false) {
  const url = trackedUrl(item, pack);
  const heading = forAdmin ? `📦 ${item.platform.toUpperCase()} · ${item.kind || "post"}\n` : "";
  return `${heading}${item.text.trim()}${url ? `\n\n${url}` : ""}`;
}

function activePlatforms() {
  const configured = process.env.SOCIAL_PLATFORMS ?? "telegram,discord,x,facebook,instagram,tiktok";
  return new Set(
    configured.split(",").map((value) => value.trim().toLowerCase()).filter((value) => ALLOWED_PLATFORMS.has(value)),
  );
}

async function deliverTelegram(chatId, item, pack, forAdmin) {
  const text = renderPost(item, pack, forAdmin);
  if (item.image && text.length <= 1024) {
    try {
      return await sendTelegramPhoto(chatId, item.image, text);
    } catch (error) {
      console.warn(`Photo delivery failed; falling back to text (${error.message})`);
    }
  }
  return sendTelegramMessage(chatId, text, { preview: true });
}

function reportPath(pack) {
  const provided = process.argv.find((arg) => arg.startsWith("--report="))?.slice(9);
  return path.resolve(provided || path.join(ROOT, ".social", `${pack.date}-${pack.slot || "manual"}-delivery.json`));
}

function receipt(item, status, details = {}) {
  return {
    platform: item.platform,
    contentId: item.contentId,
    status,
    public: status === "published_public" || status === "accepted_by_buffer",
    attemptedAt: new Date().toISOString(),
    ...details,
  };
}

async function sendAdminFallback(item, pack, state, key, error) {
  const adminKey = `${key}:admin`;
  if (!process.env.TELEGRAM_CHAT_ID) return receipt(item, "skipped_disconnected", { error });
  if (state.deliveries[adminKey]) return receipt(item, "skipped_disconnected", { error: "Admin fallback already sent" });
  const message = await deliverTelegram(process.env.TELEGRAM_CHAT_ID, item, pack, true);
  state.deliveries[adminKey] = new Date().toISOString();
  writeState(state);
  return receipt(item, "fallback_admin", { externalId: String(message?.message_id || ""), error });
}

async function main() {
  loadEnvLocal();
  const file = process.argv.find((arg) => arg.endsWith(".json") && !arg.startsWith("--report="));
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  if (!file) throw new Error("Usage: node scripts/social-publisher.mjs <pack.json> [--dry-run] [--force] [--report=file]");

  const pack = loadPack(path.resolve(file));
  const state = readState();
  const enabled = activePlatforms();
  const selected = pack.items.filter((item) => enabled.has(item.platform));
  const pending = force ? selected : selected.filter((item) => !state.published[itemKey(item, pack)]);
  const report = {
    version: 1,
    runId: `${pack.date}:${pack.slot || "manual"}`,
    campaign: pack.campaign,
    dryRun,
    force,
    createdAt: new Date().toISOString(),
    requestedPlatforms: selected.map((item) => item.platform),
    connectedPublicPlatforms: [],
    deliveries: [],
  };
  const output = reportPath(pack);

  console.log(`Validated ${pack.items.length} posts; ${selected.length} enabled; ${pending.length} pending; dryRun=${dryRun}; force=${force}`);
  for (const item of pending) console.log(`- ${item.platform}/${item.contentId} (${item.text.length} chars)`);

  let bufferChannels = {};
  if (isBufferConfigured()) {
    try {
      const discovered = await discoverBufferChannels();
      bufferChannels = mapChannelsByPlatform(discovered.channels);
      console.log(`Buffer connected: ${Object.entries(bufferChannels).map(([platform, channel]) => `${platform}=${channel.displayName || channel.name}`).join(", ") || "no channels"}`);
    } catch (error) {
      console.warn(`Buffer discovery failed: ${error.message}`);
    }
  }
  if (process.env.TELEGRAM_CHANNEL_ID && enabled.has("telegram")) report.connectedPublicPlatforms.push("telegram");
  if (isDiscordConfigured() && enabled.has("discord")) report.connectedPublicPlatforms.push("discord");
  report.connectedPublicPlatforms.push(...Object.keys(bufferChannels).filter((platform) => enabled.has(platform)));

  if (dryRun) {
    report.deliveries = pending.map((item) => receipt(item, "dry_run"));
    writeJsonAtomic(output, report);
    console.log(`[PublisherAgent] dry-run report written to ${output}`);
    return;
  }

  for (const item of pending) {
    const key = itemKey(item, pack);
    try {
      if (item.platform === "telegram") {
        if (!process.env.TELEGRAM_CHANNEL_ID) {
          report.deliveries.push(await sendAdminFallback(item, pack, state, key, "Telegram public channel is not connected"));
          continue;
        }
        const deliveryKey = `${key}:public`;
        if (!force && state.deliveries[deliveryKey]) {
          report.deliveries.push(receipt(item, "published_public", { externalId: state.deliveries[deliveryKey].externalId || "cached", cached: true }));
          continue;
        }
        const message = await deliverTelegram(process.env.TELEGRAM_CHANNEL_ID, item, pack, false);
        const deliveredAt = new Date().toISOString();
        state.deliveries[deliveryKey] = { deliveredAt, externalId: String(message?.message_id || "") };
        state.published[key] = deliveredAt;
        writeState(state);
        report.deliveries.push(receipt(item, "published_public", { externalId: String(message?.message_id || "") }));
        continue;
      }

      if (item.platform === "discord") {
        if (!isDiscordConfigured()) {
          report.deliveries.push(await sendAdminFallback(item, pack, state, key, "Discord is not connected"));
          continue;
        }
        const deliveryKey = `${key}:discord`;
        if (!force && state.deliveries[deliveryKey]) {
          report.deliveries.push(receipt(item, "published_public", { externalId: state.deliveries[deliveryKey].externalId || "cached", cached: true }));
          continue;
        }
        const message = await sendDiscordPost({
          text: renderPost(item, pack),
          image: item.image,
          title: item.title || item.text.split("\n")[0],
          url: trackedUrl(item, pack),
        });
        const deliveredAt = new Date().toISOString();
        state.deliveries[deliveryKey] = { deliveredAt, externalId: String(message?.id || "") };
        state.published[key] = deliveredAt;
        writeState(state);
        report.deliveries.push(receipt(item, "published_public", { externalId: String(message?.id || "") }));
        continue;
      }

      const channel = bufferChannels[item.platform];
      if (!channel) {
        report.deliveries.push(await sendAdminFallback(item, pack, state, key, `${item.platform} is not connected to Buffer`));
        continue;
      }
      const deliveryKey = `${key}:buffer`;
      if (!force && state.deliveries[deliveryKey]) {
        report.deliveries.push(receipt(item, "accepted_by_buffer", { externalId: state.deliveries[deliveryKey].externalId || "cached", cached: true }));
        continue;
      }
      const post = await publishBufferPost({
        channelId: channel.id,
        platform: item.platform,
        text: renderPost(item, pack),
        image: item.image,
        video: item.video,
        title: item.title || item.text.split("\n")[0],
      });
      const confirmedPost = await waitForBufferPost(post.id);
      if (confirmedPost?.status === "error") {
        const providerError = confirmedPost.error?.message || "Buffer reported a publishing error";
        throw new Error(providerError);
      }
      const finalPost = confirmedPost || post;
      const published = finalPost.status === "sent";
      const deliveredAt = new Date().toISOString();
      state.deliveries[deliveryKey] = {
        deliveredAt,
        externalId: post.id,
        providerStatus: finalPost.status,
        externalLink: finalPost.externalLink || null,
      };
      state.published[key] = deliveredAt;
      writeState(state);
      report.deliveries.push(receipt(item, published ? "published_public" : "accepted_by_buffer", {
        externalId: post.id,
        providerStatus: finalPost.status,
        dueAt: finalPost.dueAt || post.dueAt || null,
        sentAt: finalPost.sentAt || null,
        externalLink: finalPost.externalLink || null,
      }));
    } catch (error) {
      console.warn(`${item.platform} delivery failed: ${error.message}`);
      const fallback = await sendAdminFallback(item, pack, state, key, error.message).catch(() => null);
      report.deliveries.push(fallback || receipt(item, "failed", { error: error.message }));
    }
  }

  writeJsonAtomic(output, report);
  const counts = deliveryCounts(report.deliveries);
  console.log(`[PublisherAgent] public=${counts.publishedPublic}, accepted=${counts.acceptedByBuffer}, fallback=${counts.fallbackAdmin}, disconnected=${counts.skippedDisconnected}, failed=${counts.failed}`);

  if (process.env.TELEGRAM_CHAT_ID) {
    const lines = [
      `📊 تقرير وكلاء Plixfy (${pack.date} · ${pack.slot})`,
      `نشر عام مؤكد: ${counts.publishedPublic}`,
      `استلمه Buffer: ${counts.acceptedByBuffer}`,
      `نسخ إدارية فقط: ${counts.fallbackAdmin}`,
      `غير متصل: ${counts.skippedDisconnected}`,
      `فشل: ${counts.failed}`,
    ];
    await sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, lines.join("\n")).catch((error) => console.warn(`Admin report failed: ${error.message}`));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
