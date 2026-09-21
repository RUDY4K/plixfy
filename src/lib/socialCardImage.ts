import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { MAX_NEWS_IMAGE_BYTES, readNewsImageBytes } from "./newsImageStream.mjs";

const MAX_INPUT_BYTES = MAX_NEWS_IMAGE_BYTES;
const MAX_INPUT_PIXELS = 16_000_000;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_DIMENSION = 1200;
const FIRST_PARTY_WEBP = /^\/news\/[a-z0-9-]+\.webp$/;

export interface PreparedSocialCardImage {
  bytes: Buffer;
  type: string;
}

export async function prepareSocialCardImage(
  bytes: Buffer,
  type: string,
): Promise<PreparedSocialCardImage | null> {
  if (bytes.length === 0 || bytes.length > MAX_INPUT_BYTES) return null;
  if (type !== "image/webp") return { bytes, type };

  try {
    const output = await sharp(bytes, {
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    })
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 6 })
      .toBuffer();
    if (output.length > MAX_OUTPUT_BYTES) return null;
    return { bytes: output, type: "image/png" };
  } catch {
    return null;
  }
}

function firstPartyNewsPath(value: string): string | null {
  if (FIRST_PARTY_WEBP.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.plixfy.com" && FIRST_PARTY_WEBP.test(url.pathname)
      ? url.pathname
      : null;
  } catch {
    return null;
  }
}

export async function loadSocialCardImageDataUrl(value: string | undefined): Promise<string | null> {
  if (!value) return null;

  try {
    const localPath = firstPartyNewsPath(value);
    let bytes: Buffer;
    let type: string;

    if (localPath) {
      bytes = await readFile(join(process.cwd(), "public", localPath.slice(1)));
      type = "image/webp";
    } else {
      const url = new URL(value);
      if (url.protocol !== "https:") return null;
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "PlixfySocialCard/2.0 (+https://www.plixfy.com)" },
      });
      if (!response.ok) return null;
      type = response.headers.get("content-type")?.split(";")[0] || "";
      if (!type.startsWith("image/")) return null;
      const streamed = await readNewsImageBytes(response, MAX_INPUT_BYTES);
      if (!streamed) return null;
      bytes = Buffer.from(streamed);
    }

    const prepared = await prepareSocialCardImage(bytes, type);
    return prepared
      ? `data:${prepared.type};base64,${prepared.bytes.toString("base64")}`
      : null;
  } catch {
    return null;
  }
}
