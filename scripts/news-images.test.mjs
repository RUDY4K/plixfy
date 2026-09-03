import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readNewsImageBytes } from "../src/lib/newsImageStream.mjs";

const ROOT = process.cwd();
const read = (file) => readFileSync(path.join(ROOT, file), "utf8");

test("every current news image source is explicitly allowed by the same-origin proxy", () => {
  const news = JSON.parse(read("src/data/news.json"));
  const helper = read("src/lib/newsImage.ts");
  const allowedHosts = new Set(
    [...helper.matchAll(/^\s+"([a-z0-9.-]+)",$/gim)].map((match) => match[1]),
  );

  assert.ok(news.length > 0);
  for (const item of news) {
    if (!item.image) continue;
    const url = new URL(item.image);
    assert.equal(url.protocol, "https:", `${item.slug} must use HTTPS`);
    assert.ok(allowedHosts.has(url.hostname), `${item.slug} uses unapproved image host ${url.hostname}`);
  }
});

test("news pages never embed third-party editorial images directly", () => {
  const files = [
    "src/app/[locale]/page.tsx",
    "src/app/[locale]/news/page.tsx",
    "src/app/[locale]/news/[slug]/page.tsx",
  ];

  for (const file of files) {
    const source = read(file);
    assert.match(source, /newsImageHref\(/, `${file} must use the same-origin image proxy`);
    assert.doesNotMatch(source, /<img[^>]+src=\{(?:leadNews|item|n)\.image\}/s);
  }
});

test("the proxy fails visibly and safely when an upstream image cannot be fetched", () => {
  const route = read("src/app/api/news-image/[slug]/route.ts");
  const helper = read("src/lib/newsImage.ts");
  const streamHelper = read("src/lib/newsImageStream.mjs");

  assert.match(route, /if \(!upstream\) return fallbackResponse\(\)/);
  assert.match(route, /readNewsImageBytes\(upstream\)/);
  assert.match(route, /await cancelBody\(upstream\)/);
  assert.match(route, /X-Content-Type-Options/);
  assert.match(helper, /<svg[\s\S]+PLIXFY[\s\S]+GAMING NEWS/);
  assert.match(streamHelper, /reader\.cancel/);
  assert.match(helper, /url\.protocol !== "https:"/);
  assert.match(helper, /!NEWS_IMAGE_HOSTS\.has/);
});

test("the image reader cancels an upstream stream immediately after the byte limit", async () => {
  let cancelReason = "";
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.of(1, 2, 3));
      controller.enqueue(Uint8Array.of(4, 5, 6));
      controller.enqueue(Uint8Array.of(7, 8, 9));
    },
    cancel(reason) {
      cancelReason = String(reason);
    },
  }));

  assert.equal(await readNewsImageBytes(response, 5), null);
  assert.match(cancelReason, /exceeded the byte limit/i);
});

test("the image reader preserves valid chunks without changing their bytes", async () => {
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.of(1, 2));
      controller.enqueue(Uint8Array.of(3, 4));
      controller.close();
    },
  }));

  const bytes = await readNewsImageBytes(response, 4);
  assert.deepEqual(bytes, Uint8Array.of(1, 2, 3, 4));
});

test("news sitemap image URLs use the same-origin proxy", () => {
  const sitemap = read("src/app/sitemap.ts");

  assert.match(sitemap, /import \{ newsImageHref \} from "@\/lib\/newsImage"/);
  assert.match(sitemap, /images: \[SITE \+ newsImageHref\(item\.slug\)\]/);
  assert.doesNotMatch(sitemap, /images: \[item\.image\]/);
});
