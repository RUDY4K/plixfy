import { getNewsBySlug } from "@/lib/news";
import {
  MAX_NEWS_IMAGE_BYTES,
  newsImageFallbackSvg,
  parseAllowedNewsImageUrl,
  readNewsImageBytes,
} from "@/lib/newsImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const FALLBACK_CACHE = "public, max-age=300, s-maxage=600, stale-while-revalidate=3600";
const MAX_REDIRECTS = 3;

async function cancelBody(response: Response): Promise<void> {
  if (!response.body) return;
  await response.body.cancel().catch(() => {});
}

function fallbackResponse(): Response {
  return new Response(newsImageFallbackSvg(), {
    status: 200,
    headers: {
      "Cache-Control": FALLBACK_CACHE,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function fetchAllowedImage(initialUrl: URL): Promise<Response | null> {
  let url = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8,*/*;q=0.5",
        "user-agent": "PlixfyNewsImage/1.0 (+https://www.plixfy.com)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        await cancelBody(response);
        return null;
      }
      const redirectUrl = parseAllowedNewsImageUrl(new URL(location, url).href);
      if (!redirectUrl) {
        await cancelBody(response);
        return null;
      }
      await cancelBody(response);
      url = redirectUrl;
      continue;
    }

    return response;
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const item = getNewsBySlug(slug);
  const sourceUrl = item?.image ? parseAllowedNewsImageUrl(item.image) : null;
  if (!sourceUrl) return fallbackResponse();

  try {
    const upstream = await fetchAllowedImage(sourceUrl);
    if (!upstream) return fallbackResponse();
    if (!upstream.ok) {
      await cancelBody(upstream);
      return fallbackResponse();
    }

    const contentType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
    if (!contentType.startsWith("image/") || contentType === "image/svg+xml") {
      await cancelBody(upstream);
      return fallbackResponse();
    }

    const declaredLength = Number(upstream.headers.get("content-length") || "0");
    if (declaredLength > MAX_NEWS_IMAGE_BYTES) {
      await cancelBody(upstream);
      return fallbackResponse();
    }

    const bytes = await readNewsImageBytes(upstream);
    if (!bytes) return fallbackResponse();

    return new Response(bytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Cache-Control": SUCCESS_CACHE,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fallbackResponse();
  }
}
