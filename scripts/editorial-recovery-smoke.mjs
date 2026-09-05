import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:3215');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname), 'local build only');
const news = JSON.parse(readFileSync('src/data/news.json', 'utf8'));
assert.ok(news.length);
const oldBlog = 'afdal-alaab-sibaq-online-2026';
async function read(route, status = 200) {
  const response = await fetch(new URL(route, origin));
  assert.equal(response.status, status, route);
  return response.text();
}
for (const prefix of ['', '/en']) {
  const title = prefix ? news[0].titleEn : news[0].title;
  const summary = prefix ? news[0].summaryEn : news[0].summary;
  const home = await read(prefix || '/');
  const list = await read(`${prefix}/news`);
  const detail = await read(`${prefix}/news/${encodeURIComponent(news[0].slug)}`);
  assert.ok(!home.includes(news[0].title));
  assert.ok(!list.includes(news[0].title));
  assert.ok(!detail.includes(news[0].title));
  assert.ok(!detail.includes(news[0].summary));
  if (title) for (const body of [home, list, detail]) assert.ok(!body.includes(title));
  if (summary) assert.ok(!detail.includes(summary));
  assert.doesNotMatch(detail, /"@type":"NewsArticle"/);
  assert.match(detail, /noindex/);
  assert.ok(detail.includes(`${prefix}/guides/browser-games`));
  await read(`${prefix}/news/never-existed-editorial-smoke-672184`, 404);
  const blog = await read(`${prefix}/blog`);
  assert.ok(blog.includes(`${prefix}/guides/browser-games`));
  const old = await read(`${prefix}/blog/${oldBlog}`);
  assert.match(old, /noindex/);
  assert.doesNotMatch(old, /"@type":"(?:BlogPosting|FAQPage)"/);
  assert.ok(old.includes(`${prefix}/guides/browser-games`));
  const blogSource = readFileSync(prefix ? 'src/lib/blogEn.ts' : 'src/lib/blog.ts', 'utf8');
  const legacyTitle = blogSource.match(/slug: "afdal-alaab-sibaq-online-2026",\s*title: "([^"]+)"/)[1];
  const category = await read(`${prefix}/category/racing`);
  for (const body of [home, blog, old, category]) assert.ok(!body.includes(legacyTitle));
  await read(`${prefix}/blog/never-existed-editorial-smoke-672184`, 404);
}
for (const path of ['/news/rss.xml', '/blog/rss.xml']) {
  const rss = await read(path);
  assert.doesNotMatch(rss, /<item>/);
}
console.log('PASS: unreviewed news/blog absent from rendered pages and RSS; useful bilingual revision routes; unknown routes 404.');
