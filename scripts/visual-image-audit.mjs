import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const origin = process.argv[2] || "https://www.plixfy.com";
const outputDir = path.resolve(process.argv[3] || "artifacts/visual-image-audit");
const failOnBroken = process.argv.includes("--fail-on-broken");
const failOnOverflow = process.argv.includes("--fail-on-overflow");
const verbose = process.argv.includes("--verbose");
const includeNews = process.argv.includes("--include-news");
const newsSlug = process.argv.find((argument) => argument.startsWith("--news-slug="))?.slice(12)
  || "monster-hunter-wilds-ascendance-expansion-trailers";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const scenarios = [
  { name: "ar-desktop", path: "/", viewport: { width: 1440, height: 1000 } },
  { name: "en-desktop", path: "/en", viewport: { width: 1440, height: 1000 } },
  { name: "ar-mobile", path: "/", viewport: { width: 390, height: 844 } },
  { name: "en-mobile", path: "/en", viewport: { width: 390, height: 844 } },
  { name: "ar-tablet", path: "/", viewport: { width: 820, height: 1180 } },
  { name: "en-tablet", path: "/en", viewport: { width: 820, height: 1180 } },
  ...(includeNews ? [
    { name: "ar-news-article-desktop", path: `/news/${newsSlug}`, viewport: { width: 1440, height: 1000 } },
    { name: "en-news-article-desktop", path: `/en/news/${newsSlug}`, viewport: { width: 1440, height: 1000 } },
    { name: "ar-news-article-mobile", path: `/news/${newsSlug}`, viewport: { width: 390, height: 844 } },
    { name: "en-news-article-mobile", path: `/en/news/${newsSlug}`, viewport: { width: 390, height: 844 } },
  ] : []),
];

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const results = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      deviceScaleFactor: 1,
      locale: scenario.name.startsWith("ar") ? "ar-SA" : "en-US",
    });
    const page = await context.newPage();
    const imageResponses = [];
    const requestFailures = [];

    page.on("response", (response) => {
      if (response.request().resourceType() === "image") {
        imageResponses.push({ status: response.status(), url: response.url() });
      }
    });
    page.on("requestfailed", (request) => {
      if (request.resourceType() === "image") {
        requestFailures.push({ error: request.failure()?.errorText, url: request.url() });
      }
    });

    const url = new URL(scenario.path, origin).href;
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2_000);
    await page.evaluate(async () => {
      const distance = Math.max(document.body.scrollHeight / 8, 500);
      for (let y = 0; y < document.body.scrollHeight; y += distance) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1_500);

    const images = await page.locator("img").evaluateAll((elements) => elements.map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        alt: image.alt,
        complete: image.complete,
        currentSrc: image.currentSrc,
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth,
        renderedHeight: Math.round(rect.height),
        renderedWidth: Math.round(rect.width),
        src: image.getAttribute("src"),
      };
    }));
    const brokenImages = images.filter((image) => image.complete && image.naturalWidth === 0);
    const horizontalOverflow = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const documentWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      );
      const isClippedByScrollableParent = (element) => {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          const overflowX = getComputedStyle(parent).overflowX;
          if (["auto", "scroll", "hidden", "clip"].includes(overflowX)) return true;
          parent = parent.parentElement;
        }
        return false;
      };
      const offenders = Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: element.tagName.toLowerCase(),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item, index) => {
          const element = document.querySelectorAll("body *")[index];
          return (
            (item.width > viewportWidth + 1 || item.left < -1 || item.right > viewportWidth + 1)
            && !isClippedByScrollableParent(element)
          );
        })
        .slice(0, 10);

      return {
        documentWidth,
        offenders,
        overflow: documentWidth > viewportWidth + 1,
        viewportWidth,
      };
    });
    const screenshot = path.join(outputDir, `${scenario.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    results.push({
      brokenImages,
      failedImageRequests: requestFailures,
      finalUrl: page.url(),
      horizontalOverflow,
      imageResponses: imageResponses.filter((item) => item.status >= 400),
      images,
      name: scenario.name,
      pageStatus: response?.status(),
      screenshot,
      viewport: scenario.viewport,
    });

    await context.close();
  }
} finally {
  await browser.close();
}

const output = verbose ? results : results.map((result) => ({
  brokenImages: result.brokenImages,
  failedImageRequests: result.failedImageRequests,
  finalUrl: result.finalUrl,
  horizontalOverflow: result.horizontalOverflow,
  imageCount: result.images.length,
  imageResponses: result.imageResponses,
  name: result.name,
  pageStatus: result.pageStatus,
  screenshot: result.screenshot,
  viewport: result.viewport,
}));

console.log(JSON.stringify(output, null, 2));

if (failOnBroken && results.some((result) => result.brokenImages.length > 0)) {
  process.exitCode = 1;
}

if (failOnOverflow && results.some((result) => result.horizontalOverflow.overflow)) {
  process.exitCode = 1;
}
