import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright-core";

// Run against a built local server: npm run build; npm run start -- -p 3100;
// then npm run test:consent-viewport. Override the URL or browser with
// PLIXFY_TEST_BASE_URL and CHROME_PATH when needed.
const baseUrl = process.env.PLIXFY_TEST_BASE_URL || "http://localhost:3100";
const executablePath = [
  process.env.CHROME_PATH,
  chromium.executablePath(),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => candidate && existsSync(candidate));

test("consent notice remains readable across the tablet breakpoint in both locales", async () => {
  assert.ok(executablePath, "Install Chromium or set CHROME_PATH to a browser executable");
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    for (const pathname of ["/en/categories", "/categories"]) {
      for (const viewportWidth of [767, 768, 769]) {
        const page = await browser.newPage({ viewport: { width: viewportWidth, height: 1024 } });
        try {
          await page.goto(new URL(pathname, baseUrl).href, { waitUntil: "domcontentloaded" });
          const dialog = page.getByRole("dialog");
          await dialog.waitFor({ state: "visible", timeout: 10000 });

          const geometry = await dialog.evaluate((element) => {
            const notice = element.getBoundingClientRect();
            const message = element.querySelector("div.text-sm");
            const buttons = [...element.querySelectorAll("button")].map((button) => button.getBoundingClientRect());
            return {
              left: notice.left,
              right: notice.right,
              width: notice.width,
              height: notice.height,
              pageWidth: document.documentElement.scrollWidth,
              messageOverflows: Boolean(message && message.scrollWidth > message.clientWidth + 1),
              buttonsInside: buttons.every((button) =>
                button.left >= notice.left && button.right <= notice.right,
              ),
            };
          });

          const label = `${pathname} at ${viewportWidth}px`;
          assert.ok(geometry.width >= viewportWidth - 32, `${label}: notice width ${geometry.width}px is too narrow`);
          assert.ok(geometry.height < 200, `${label}: notice height ${geometry.height}px obscures content`);
          assert.ok(Math.abs(geometry.left - (viewportWidth - geometry.right)) <= 2, `${label}: notice is not centered`);
          assert.ok(geometry.left >= 0 && geometry.right <= viewportWidth, `${label}: notice escapes the viewport`);
          assert.ok(geometry.pageWidth <= viewportWidth, `${label}: page overflows horizontally`);
          assert.equal(geometry.messageOverflows, false, `${label}: notice text overflows horizontally`);
          assert.ok(geometry.buttonsInside, `${label}: consent buttons escape the notice`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
