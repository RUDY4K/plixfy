import fs from "node:fs";
import path from "node:path";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 3;

export function loadEnvLocal(root = process.cwd()) {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (/^[A-Z0-9_]+$/.test(name) && !(name in process.env)) {
      process.env[name] = value;
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegramRequest(method, payload, options = {}) {
  const token = options.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.ok) return body.result;

      const retryable = response.status === 429 || response.status >= 500;
      const description = typeof body.description === "string" ? body.description : "unknown error";
      lastError = new Error(`Telegram ${method} failed: HTTP ${response.status} (${description})`);
      lastError.retryable = retryable;
      if (!retryable || attempt === retries) throw lastError;

      const retryAfterSeconds = Number(body.parameters?.retry_after || 0);
      await sleep(retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : attempt * 1500);
    } catch (error) {
      lastError = error;
      if (error.retryable === false || attempt === retries) break;
      await sleep(attempt * 1500);
    }
  }

  throw lastError || new Error(`Telegram ${method} failed`);
}

export function sendTelegramMessage(chatId, text, options = {}) {
  return telegramRequest(
    "sendMessage",
    {
      chat_id: chatId,
      text,
      disable_web_page_preview: options.preview !== true,
    },
    options,
  );
}

export function sendTelegramPhoto(chatId, photo, caption, options = {}) {
  return telegramRequest(
    "sendPhoto",
    {
      chat_id: chatId,
      photo,
      caption,
    },
    options,
  );
}
