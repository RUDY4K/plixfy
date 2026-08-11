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

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const kind = query.get("kind");
  const id = query.get("id") || "";

  const game = kind === "game" ? getGameBySlug(id) : undefined;
  const news = kind === "news" ? getNewsBySlug(id) : undefined;
  if (!game && !news) return new Response("Social card not found", { status: 404 });

  const source = game?.thumbnail || news?.image;
  const [logo, sourceImage] = await Promise.all([
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
        fontFamily: "Arial, sans-serif",
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
        background: "linear-gradient(180deg, rgba(7,7,18,.04) 58%, rgba(7,7,18,.54) 100%)",
      },
    }),
    e(
      "div",
      {
        style: {
          position: "absolute",
          right: 58,
          bottom: 58,
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "16px 26px 16px 18px",
          borderRadius: 30,
          background: "rgba(7,7,18,.86)",
          border: "2px solid rgba(255,255,255,.18)",
          boxShadow: "0 18px 55px rgba(0,0,0,.45)",
        },
      },
      e("img", {
        src: dataUrl(logo),
        alt: "Plixfy",
        width: 126,
        height: 126,
        style: { objectFit: "contain" },
      }),
      e(
        "div",
        {
          style: {
            display: "flex",
            color: "#ffffff",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 3,
            textShadow: "0 2px 12px rgba(0,0,0,.65)",
          },
        },
        "PLIXFY.COM",
      ),
    ),
  );

  return new ImageResponse(element, {
    ...SIZE,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
