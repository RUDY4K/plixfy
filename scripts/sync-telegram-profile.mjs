const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const channelId = String(process.env.TELEGRAM_CHANNEL_ID || "").trim();

const displayName = "Plixfy | بليكسفاي";
const bio = "🎮 العب مجانًا بدون تحميل\n📰 أخبار الألعاب يوميًا\n🌐 plixfy.com/ar";
const description = `${bio}\n\nاكتشف ألعاب المتصفح المجانية وآخر أخبار الألعاب على https://www.plixfy.com/ar`;

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    throw new Error(`${method}: ${body.description || `HTTP ${response.status}`}`);
  }
  return body.result;
}

await telegram("setMyName", { name: displayName });
await telegram("setMyShortDescription", { short_description: bio });
await telegram("setMyDescription", { description });
console.log("Telegram bot profile synchronized");

if (channelId) {
  await telegram("setChatDescription", { chat_id: channelId, description });
  console.log("Telegram channel description synchronized");
}
