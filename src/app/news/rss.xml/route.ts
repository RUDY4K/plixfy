import { getAllNews } from "@/lib/news";

const SITE = "https://www.plixfy.com";
const SOCIAL_IMAGE = SITE + "/opengraph-image";

export const revalidate = 21600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const news = getAllNews();

  const items = news
    .map((item) => {
      const url = SITE + "/news/" + item.slug;
      return (
        "<item>" +
        "<title>" + escapeXml(item.title) + "</title>" +
        "<link>" + url + "</link>" +
        '<guid isPermaLink="true">' + url + "</guid>" +
        "<pubDate>" + new Date(item.publishedAt + "T00:00:00Z").toUTCString() + "</pubDate>" +
        "<description>" + escapeXml(item.summary) + "</description>" +
        "<source url=\"" + escapeXml(item.sourceUrl) + "\">" + escapeXml(item.sourceName) + "</source>" +
        '<media:content url="' + SOCIAL_IMAGE + '" medium="image" type="image/png"/>' +
        "</item>"
      );
    })
    .join("");

  const lastBuildDate = news.length > 0
    ? new Date(news[0].publishedAt + "T00:00:00Z").toUTCString()
    : new Date().toUTCString();

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">' +
    "<channel>" +
    "<title>أخبار الألعاب من بليكسفاي</title>" +
    "<link>" + SITE + "/news</link>" +
    "<description>أحدث أخبار الألعاب والمنصات بتغطية عربية من بليكسفاي</description>" +
    "<language>ar</language>" +
    "<lastBuildDate>" + lastBuildDate + "</lastBuildDate>" +
    '<atom:link href="' + SITE + '/news/rss.xml" rel="self" type="application/rss+xml"/>' +
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
