import { getAllPosts } from "@/lib/blog";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const posts = getAllPosts();

  const items = posts
    .map(
      (p) =>
        "<item>" +
        "<title>" + escapeXml(p.h1) + "</title>" +
        "<link>" + SITE + "/blog/" + p.slug + "</link>" +
        '<guid isPermaLink="true">' + SITE + "/blog/" + p.slug + "</guid>" +
        "<pubDate>" + new Date(p.publishedAt).toUTCString() + "</pubDate>" +
        "<description>" + escapeXml(p.description) + "</description>" +
        "</item>",
    )
    .join("");

  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].updatedAt).toUTCString()
    : new Date().toUTCString();

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' +
    "<channel>" +
    "<title>مدوّنة بليكسفاي</title>" +
    "<link>" + SITE + "/blog</link>" +
    "<description>أدلّة ومقالات عن أفضل الألعاب المجانية أونلاين بدون تحميل</description>" +
    "<language>ar</language>" +
    "<lastBuildDate>" + lastBuildDate + "</lastBuildDate>" +
    '<atom:link href="' + SITE + '/blog/rss.xml" rel="self" type="application/rss+xml"/>' +
    items +
    "</channel>" +
    "</rss>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
