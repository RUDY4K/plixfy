import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import { getGameBySlug } from "@/lib/games";
import { getNewsBySlug } from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 1200 };

function dataUrl(buffer: Buffer, mime = "image/png") {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function fetchSourceImage(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") return null;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "PlixfySocialCard/1.0 (+https://www.plixfy.com)" },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 8 * 1024 * 1024) return null;
    return dataUrl(bytes, type);
  } catch {
    return null;
  }
}

function titleSize(title: string) {
  if (title.length <= 34) return 68;
  if (title.length <= 60) return 56;
  if (title.length <= 90) return 46;
  return 40;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const kind = query.get("kind");
  const id = query.get("id") || "";

  const game = kind === "game" ? getGameBySlug(id) : undefined;
  const news = kind === "news" ? getNewsBySlug(id) : undefined;
  if (!game && !news) return new Response("Social card not found", { status: 404 });

  const title = String(game?.title || news?.title || "Plixfy");
  const label = game ? "لعبة اليوم" : "أخبار الألعاب";
  const source = game?.thumbnail || news?.image;
  const [font, logo, sourceImage] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Tajawal-Bold.ttf")),
    readFile(join(process.cwd(), "public/brand/plixfy-mark-v2-compact.png")),
    fetchSourceImage(source),
  ]);

  const e = React.createElement;
  const element = e(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #070712 0%, #180b2b 55%, #070712 100%)",
        fontFamily: "Tajawal",
      },
    },
    sourceImage
      ? e("img", {
          src: sourceImage,
          alt: "",
          width: 1200,
          height: 1200,
          style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
        })
      : null,
    e("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        background: "linear-gradient(180deg, rgba(7,7,18,.06) 25%, rgba(7,7,18,.50) 55%, rgba(7,7,18,.98) 100%)",
      },
    }),
    e("div", {
      style: {
        position: "absolute",
        inset: 24,
        display: "flex",
        border: "8px solid rgba(0,229,255,.92)",
        borderRadius: 48,
        boxShadow: "inset 0 0 0 3px rgba(255,45,139,.85), 0 0 70px rgba(118,87,255,.40)",
      },
    }),
    e(
      "div",
      {
        style: {
          position: "absolute",
          top: 58,
          right: 58,
          width: 194,
          height: 194,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 44,
          background: "rgba(7,7,18,.82)",
          border: "2px solid rgba(255,255,255,.18)",
          boxShadow: "0 18px 55px rgba(0,0,0,.45)",
        },
      },
      e("img", { src: dataUrl(logo), alt: "Plixfy", width: 176, height: 176, style: { objectFit: "contain" } }),
    ),
    e(
      "div",
      {
        style: {
          position: "absolute",
          left: 58,
          right: 58,
          bottom: 58,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          padding: "38px 44px 34px",
          borderRadius: 34,
          background: "rgba(7,7,18,.88)",
          border: "2px solid rgba(255,255,255,.14)",
          boxShadow: "0 24px 70px rgba(0,0,0,.55)",
          direction: "rtl",
        },
      },
      e("div", { style: { display: "flex", color: "#00e5ff", fontSize: 30, marginBottom: 14 } }, label),
      e(
        "div",
        {
          style: {
            display: "flex",
            width: "100%",
            color: "white",
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.25,
            textAlign: "right",
          },
        },
        title,
      ),
      e("div", { style: { display: "flex", color: "#ff5aa3", fontSize: 28, marginTop: 18, letterSpacing: 2 } }, "PLIXFY.COM"),
    ),
  );

  return new ImageResponse(element, {
    ...SIZE,
    fonts: [{ name: "Tajawal", data: font, style: "normal", weight: 700 }],
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
