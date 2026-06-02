// src/app/api/chat/route.ts
// Blexy concierge — Anthropic-powered chat endpoint for plixfy.com
// Requires: npm i @anthropic-ai/sdk   and   ANTHROPIC_API_KEY in .env.local
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// NOTE: adjust this import to match your actual exports in src/lib/games.ts.
// These two are used to build a compact catalog the model can recommend from.
import { categoryMeta, getGamesByCategory } from "@/lib/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build a compact catalog once per cold start: "slug | title | category"
type CatalogItem = { slug: string; title: string; cat: string };
let CATALOG: CatalogItem[] = [];
let CATALOG_TEXT = "";
try {
  const seen = new Set<string>();
  for (const cat of Object.keys(categoryMeta)) {
    for (const g of getGamesByCategory(cat) as Array<{ slug: string; title: string }>) {
      if (seen.has(g.slug)) continue;
      seen.add(g.slug);
      CATALOG.push({ slug: g.slug, title: g.title, cat });
    }
  }
  CATALOG_TEXT = CATALOG.map((g) => `${g.slug} | ${g.title} | ${g.cat}`).join("\n");
} catch {
  CATALOG = [];
  CATALOG_TEXT = "";
}
const TITLE_BY_SLUG = new Map(CATALOG.map((g) => [g.slug, g.title]));

const SYSTEM = `أنت «بلكسي»، المساعد الذكي لموقع ألعاب بليكسفاي (plixfy.com) ـ بوابة ألعاب عربية للسوق السعودي.

شخصيتك:
- تتكلم باللهجة السعودية النجدية فقط (الحين، أبي، كذا، ليش، مو، هذي، رسّل). لا مصري ولا شامي.
- ودود، خفيف، حماسي بشكل معقول. مختصر ـ جملتين إلى ثلاث جمل بالأكثر.
- ما تكذب وما تخترع ألعاب. ترشّح فقط من الكتالوج المعطى لك تحت.

مهمتك:
- تفهم مزاج المستخدم / وقته / نوع اللعب اللي يبيه، وترشّح له ١-٣ ألعاب مناسبة من الكتالوج.
- علّل اختيارك بسطر قصير (ليش هذي تناسبه).
- إذا سألك سؤال عام عن لعبة موجودة بالكتالوج، جاوب باختصار.
- إذا ما فيه لعبة مناسبة بالكتالوج، قول بصراحة وارشد لفئة قريبة.

قواعد صارمة:
- لا ترشّح أي شي خارج الكتالوج.
- لا تعطي روابط، النظام يحوّل الـ slugs لأزرار.
- محتوى مناسب للعائلة السعودية دائماً.
- لما ترشّح ألعاب محددة، اكتب في آخر سطر منفصل بالضبط بهذا الشكل (سطر مخفي تقني):
  GAMES: slug1, slug2
  استخدم slugs من عمود الـ slug في الكتالوج فقط. إذا ما ترشّح لعبة محددة، لا تكتب هذا السطر.

الكتالوج (slug | الاسم | الفئة):
${CATALOG_TEXT}`;

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "قول لي وش تبي تلعب 👀" });
    }

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM,
      messages: messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    let reply =
      msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim() || "حصل خطأ بسيط، جرّب مرة ثانية.";

    // Parse the hidden GAMES: line into chips, then strip it from the reply.
    const games: Array<{ slug: string; title: string }> = [];
    const m = reply.match(/^\s*GAMES:\s*(.+)\s*$/im);
    if (m) {
      for (const raw of m[1].split(",")) {
        const slug = raw.trim();
        const title = TITLE_BY_SLUG.get(slug);
        if (title) games.push({ slug, title });
      }
      reply = reply.replace(m[0], "").trim();
    }

    return NextResponse.json({ reply, games });
  } catch (err) {
    console.error("chat route error", err);
    return NextResponse.json(
      { reply: "ما قدرت أرد الحين، جرّب بعد شوي." },
      { status: 200 }
    );
  }
}
