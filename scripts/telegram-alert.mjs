// Sends an operational alert to the private Plixfy Telegram admin chat.
// Usage: ALERT_MESSAGE="..." node scripts/telegram-alert.mjs
import { loadEnvLocal, sendTelegramMessage } from "./telegram-client.mjs";

loadEnvLocal();

const message = process.env.ALERT_MESSAGE || process.argv.slice(2).join(" ").trim();
if (!message) throw new Error("ALERT_MESSAGE or a message argument is required");
if (!process.env.TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_CHAT_ID is not set");

await sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, message);
console.log("Telegram alert delivered.");
