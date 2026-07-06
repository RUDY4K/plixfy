// يولّد يومياً محتوى نشر اجتماعي جاهز (X + TikTok/Instagram) مبنياً على ألعاب
// وأخبار الموقع الفعلية، ويقترح فرصتي باكلينكس من قائمة مُنتقاة مع رسالة تواصل
// جاهزة، ثم يرسل الكل إلى تلقرام.
// يعمل عبر GitHub Action يومياً. يتطلب: ANTHROPIC_API_KEY,
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID في البيئة.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = process.cwd();
const GAMES_TS = path.join(ROOT, "src", "lib", "games.ts");
const GD_GAMES_FILE = path.join(ROOT, "src", "data", "gd-games.json");
const BLOG_TS = path.join(ROOT, "src", "lib", "blog.ts");
const NEWS_FILE = path.join(ROOT, "src", "data", "news.json");
const TARGETS_FILE = path.join(ROOT, "scripts", "backlink-targets.json");

const SITE = "https://www.plixfy.com";
const POSTS_PER_DAY = 3;
const BACKLINKS_PER_DAY = 2;

const CATEGORY_LABELS = {
  racing: "سباق",
  action: "أكشن",
  puzzle: "ألغاز",
  io: "آيو",
  girls: "بنات",
  casual: "خفيف",
  sports: "رياضة",
  shooting: "تصويب",
};

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

// يستخرج الألعاب من literal objects داخل games.ts بدون تشغيل TypeScript
function extractGames(source) {
  const blocks = source.match(/\{[^{}]*?title:\s*"[^"]*"[^{}]*?\}/gs) ?? [];
  return blocks
    .map((block) => {
      const field = (name) => block.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1];
      const plays = block.match(/plays:\s*(\d+)/)?.[1];
      return {
        title: field("title"),
        slug: field("slug"),
        categorySlug: field("categorySlug"),
        plays: plays ? Number(plays) : 0,
      };
    })
    .filter((g) => g.title && g.slug && g.categorySlug);
}

function extractBlogPosts(source) {
  const slugs = [...source.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  const titles = [...source.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
  return slugs.map((slug, i) => ({ slug, title: titles[i] ?? slug }));
}

function pickDailyContent() {
  const day = dayOfYear(new Date());
  const gdGames = JSON.parse(fs.readFileSync(GD_GAMES_FILE, "utf8")).map((g) => ({
    title: g.title,
    slug: g.slug,
    categorySlug: g.categorySlug,
    plays: g.plays ?? 0,
  }));
  const games = [...extractGames(fs.readFileSync(GAMES_TS, "utf8")), ...gdGames];
  const categorySlugs = Object.keys(CATEGORY_LABELS);
  const categorySlug = categorySlugs[day % categorySlugs.length];

  const categoryGames = games
    .filter((g) => g.categorySlug === categorySlug)
    .sort((a, b) => b.plays - a.plays);
  // مزيج: أشهر لعبة + لعبتان تدوران يومياً حتى لا تتكرر نفس الألعاب
  const rotating = categoryGames.slice(1);
  const picked = [
    categoryGames[0],
    rotating[day % Math.max(rotating.length, 1)],
    rotating[(day * 7 + 3) % Math.max(rotating.length, 1)],
  ].filter(Boolean);

  const news = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8")).slice(0, 2);
  const blogPosts = extractBlogPosts(fs.readFileSync(BLOG_TS, "utf8"));
  const blogPost = blogPosts[day % Math.max(blogPosts.length, 1)];

  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, "utf8"));
  const backlinks = Array.from(
    { length: Math.min(BACKLINKS_PER_DAY, targets.length) },
    (_, i) => targets[(day * BACKLINKS_PER_DAY + i) % targets.length],
  );

  return { categorySlug, games: picked, news, blogPost, backlinks };
}

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["posts", "outreach"],
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["platform", "text"],
        properties: {
          platform: { type: "string", description: "X أو TikTok/Instagram أو WhatsApp/Telegram" },
          text: {
            type: "string",
            description: "نص المنشور كاملاً بالعربي جاهز للنسخ، مع الرابط والهاشتاقات",
          },
        },
      },
    },
    outreach: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["targetName", "message"],
        properties: {
          targetName: { type: "string" },
          message: {
            type: "string",
            description: "رسالة/منشور تواصل جاهز للنسخ مخصص لهذه المنصة، طبيعي وغير سبامي",
          },
        },
      },
    },
  },
};

async function generate(content) {
  const client = new Anthropic();
  const gameLines = content.games
    .map((g) => `- ${g.title} (${g.plays} لعبة): ${SITE}/play/${g.slug}`)
    .join("\n");
  const newsLines = content.news
    .map((n) => `- ${n.title}: ${SITE}/news/${encodeURIComponent(n.slug)}`)
    .join("\n");

  const prompt = [
    "أنت مدير سوشال ميديا لموقع بليكسفاي (plixfy.com) — بوابة ألعاب متصفح عربية مجانية بدون تحميل، جمهورها سعودي وخليجي.",
    "",
    `اكتب ${POSTS_PER_DAY} منشورات اليوم (تصنيف اليوم: ${CATEGORY_LABELS[content.categorySlug]}):`,
    "1. منشور X: قصير وجذاب (أقل من 240 حرفاً مع الرابط)، لهجة سعودية خفيفة، هاشتاقان مناسبان كحد أقصى.",
    "2. كابشن TikTok/Instagram Reels: يفترض مقطع جيم بلاي قصير للعبة، مع hook أول سطر قوي و3-4 هاشتاقات.",
    "3. رسالة واتساب/تلقرام للمشاركة في القروبات: ودّية وقصيرة كأنها من صديق يشارك لعبة حلوة، بدون أسلوب إعلاني.",
    "",
    "ألعاب اليوم (استخدم الروابط كما هي):",
    gameLines,
    "",
    "أحدث أخبار الموقع (يمكن ذكرها في منشور واحد إن كانت مثيرة):",
    newsLines || "- لا يوجد",
    "",
    `مقال المدونة لهذا اليوم (اربطه حيث يناسب): ${content.blogPost ? `${content.blogPost.title}: ${SITE}/blog/${content.blogPost.slug}` : "لا يوجد"}`,
    "",
    `ثم اكتب رسالة تواصل/منشوراً واحداً لكل هدف باكلينكس أدناه (${content.backlinks.length} أهداف). الرسالة يجب أن تقدّم قيمة حقيقية لمجتمع المنصة (نصيحة، سؤال، مشاركة تجربة) ويأتي الرابط بشكل طبيعي — ممنوع الأسلوب الدعائي المباشر:`,
    ...content.backlinks.map(
      (t, i) => `${i + 1}. ${t.name} (${t.type}) — ${t.url} — إرشادات: ${t.tips}`,
    ),
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Model refused the request");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text block in model response");
  return JSON.parse(textBlock.text);
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    throw new Error(`Telegram sendMessage failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  }
}

function formatPostsMessage(generated, content) {
  const lines = [
    `📣 محتوى بليكسفاي اليومي — تصنيف اليوم: ${CATEGORY_LABELS[content.categorySlug]}`,
    "انسخ والصق مباشرة 👇",
    "",
  ];
  generated.posts.forEach((p, i) => {
    lines.push(`━━━ ${i + 1}. ${p.platform} ━━━`, "", p.text, "");
  });
  return lines.join("\n");
}

function formatBacklinksMessage(generated, content) {
  const lines = ["🔗 فرص باكلينكس اليوم (نفّذها يدوياً — 10 دقائق)", ""];
  content.backlinks.forEach((t, i) => {
    const draft = generated.outreach.find((o) => o.targetName === t.name) ?? generated.outreach[i];
    lines.push(
      `━━━ ${i + 1}. ${t.name} (${t.type}) ━━━`,
      t.url,
      `💡 ${t.tips}`,
      "",
      "📝 مسودة جاهزة:",
      draft ? draft.message : "(لم تتولّد مسودة — اكتبها بأسلوبك)",
      "",
    );
  });
  return lines.join("\n");
}

async function main() {
  for (const name of ["ANTHROPIC_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) {
    if (!process.env[name]) {
      console.error(`${name} is not set`);
      process.exit(1);
    }
  }

  const content = pickDailyContent();
  console.log(
    `Category: ${content.categorySlug}, games: ${content.games.map((g) => g.slug).join(", ")}`,
  );

  const generated = await generate(content);
  console.log(`Generated: ${generated.posts.length} posts, ${generated.outreach.length} outreach drafts`);

  await sendTelegram(formatPostsMessage(generated, content));
  await sendTelegram(formatBacklinksMessage(generated, content));
  console.log("Sent to Telegram ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
