const DISCORD_API = "https://discord.com/api/v10";

function safeWebhookUrl(value) {
  if (!value) return null;
  const url = new URL(String(value).trim());
  const validHost = url.hostname === "discord.com" || url.hostname === "discordapp.com";
  if (url.protocol !== "https:" || !validHost || !url.pathname.startsWith("/api/webhooks/")) {
    throw new Error("DISCORD_WEBHOOK_URL is not a valid Discord webhook URL");
  }
  url.searchParams.set("wait", "true");
  return url;
}

export function isDiscordConfigured() {
  return Boolean(
    process.env.DISCORD_WEBHOOK_URL ||
      (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID),
  );
}

export function buildDiscordPayload({ text, image, title, url }) {
  const content = String(text || "").trim().slice(0, 2000);
  const embed = {
    color: 0xff2d8b,
    author: { name: "Plixfy | بليكسفاي", url: "https://www.plixfy.com" },
    footer: { text: "PLIXFY.COM • ألعاب وأخبار يومية" },
  };
  if (title) embed.title = String(title).trim().slice(0, 256);
  if (url) embed.url = url;
  if (image) embed.image = { url: image };
  return {
    content,
    embeds: [embed],
    allowed_mentions: { parse: [] },
  };
}

async function parseDiscordResponse(response) {
  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const detail = body?.message || raw || `HTTP ${response.status}`;
    const error = new Error(`Discord delivery failed: ${detail}`);
    error.status = response.status;
    throw error;
  }
  return body || { id: "accepted" };
}

export async function sendDiscordPost(post, options = {}) {
  const payload = buildDiscordPayload(post);
  const webhook = safeWebhookUrl(process.env.DISCORD_WEBHOOK_URL);
  const timeoutMs = options.timeoutMs || 20_000;

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return parseDiscordResponse(response);
  }

  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    throw new Error("Discord is not configured");
  }
  if (!/^\d{15,22}$/.test(process.env.DISCORD_CHANNEL_ID)) {
    throw new Error("DISCORD_CHANNEL_ID is invalid");
  }
  const response = await fetch(`${DISCORD_API}/channels/${process.env.DISCORD_CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return parseDiscordResponse(response);
}
