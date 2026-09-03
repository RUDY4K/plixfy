import { mkdirSync } from "node:fs";
import path from "node:path";
import { webkit } from "playwright-core";
import { redactSecrets } from "./redact-secrets.mjs";

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
if (!username || !accessKey) {
  throw new Error("BrowserStack credentials are not available in the Windows user environment");
}

const target = process.argv.find((argument) => argument.startsWith("--target="))?.slice(9)
  || "https://www.plixfy.com/en/play/love-archer-hero";
const outputDir = path.resolve(
  process.argv.find((argument) => argument.startsWith("--output="))?.slice(9)
    || "artifacts/browserstack-ios15-game",
);
const expectGameToStart = process.argv.includes("--expect-start");
const local = process.argv.includes("--local");

mkdirSync(outputDir, { recursive: true });

const capabilities = {
  browser: "safari",
  deviceName: "iPhone SE 2022",
  osVersion: "15",
  realMobile: "true",
  name: "Plixfy iPhone SE iOS 15.4 progressive game launch",
  build: "plixfy-ios15-progressive-launch-2026-09-02",
  "browserstack.username": username,
  "browserstack.accessKey": accessKey,
  "browserstack.local": local,
};

const diagnostics = {
  console: [],
  failedRequests: [],
  pageErrors: [],
  nextResponses: [],
};

let browser;
let page;
let result = { diagnostics, target };
try {
  const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(capabilities))}`;
  browser = await webkit.connect({ wsEndpoint });
  const context = await browser.newContext();
  page = await context.newPage();

  page.on("console", (message) => {
    diagnostics.console.push({ text: message.text().slice(0, 1_000), type: message.type() });
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push({ message: error.message.slice(0, 2_000), name: error.name });
  });
  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push({
      error: request.failure()?.errorText || "unknown",
      resourceType: request.resourceType(),
      url: request.url(),
    });
  });
  page.on("response", (response) => {
    if (response.url().includes("/_next/") && response.status() >= 400) {
      diagnostics.nextResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem(
      "gdpr-consent-v1",
      JSON.stringify({ choice: "reject", timestamp: Date.now() }),
    );
    localStorage.setItem("plixfy-install-prompt-dismissed-at", String(Date.now()));
    window.__plixfyCaptureClicks = 0;
    document.addEventListener("click", () => {
      window.__plixfyCaptureClicks += 1;
    }, true);
  });

  const navigation = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(5_000);
  const startButton = page.locator('[data-placement="game-frame"]');
  await startButton.waitFor({ state: "visible", timeout: 30_000 });

  const before = await page.evaluate(() => {
    const button = document.querySelector('[data-placement="game-frame"]');
    const frameRoot = document.querySelector("#play-frame > div");
    const scripts = [...document.scripts].map((script) => script.src).filter(Boolean);
    const resources = performance.getEntriesByType("resource")
      .map((entry) => ({ name: entry.name, transferSize: entry.transferSize }))
      .filter((entry) => entry.name.includes("/_next/"));
    return {
      captureClicks: window.__plixfyCaptureClicks,
      documentReadyState: document.readyState,
      frameCount: document.querySelectorAll("#play-frame iframe").length,
      hasNextFlightQueue: Array.isArray(window.__next_f),
      reactDelegatedEvents: document.__reactListening$ !== undefined
        || Object.keys(document).some((key) => key.startsWith("_reactListening")),
      reactRootMarker: frameRoot
        ? Object.keys(frameRoot).some((key) => key.startsWith("__react"))
        : false,
      scriptCount: scripts.length,
      nextScriptCount: scripts.filter((src) => src.includes("/_next/")).length,
      nextResources: resources,
      startElement: button?.tagName || null,
      startHref: button?.getAttribute("href") || null,
    };
  });

  await page.screenshot({ path: path.join(outputDir, "before-tap.png"), fullPage: false });
  const startedAt = Date.now();
  await startButton.click({ timeout: 15_000 });
  let startElapsedMs = null;
  try {
    await page.locator("#play-frame iframe").waitFor({ state: "attached", timeout: 10_000 });
    startElapsedMs = Date.now() - startedAt;
  } catch {
    // Preserve the full diagnostics below when the game does not start.
  }

  const after = await page.evaluate(() => ({
    captureClicks: window.__plixfyCaptureClicks,
    frameCount: document.querySelectorAll("#play-frame iframe").length,
    location: location.href,
    playFrameText: document.querySelector("#play-frame")?.textContent?.trim().slice(0, 300) || "",
  }));
  await page.screenshot({ path: path.join(outputDir, "after-tap.png"), fullPage: false });

  let exit = { attempted: false, worked: false };
  if (after.frameCount > 0) {
    const fallbackExit = page.locator("[data-game-exit]");
    const clientExit = page.locator('#play-frame button[aria-label*="Exit"]');
    const exitControl = await fallbackExit.count() > 0 ? fallbackExit : clientExit;
    exit = { attempted: true, worked: false };
    await exitControl.click({ timeout: 15_000 });
    try {
      await page.waitForFunction(
        () => document.querySelectorAll("#play-frame iframe").length === 0,
        undefined,
        { timeout: 10_000 },
      );
    } catch {
      // Record the destination state below so a failure stays diagnostic.
    }
    exit.location = page.url();
    exit.frameCount = await page.locator("#play-frame iframe").count();
    exit.worked = exit.frameCount === 0;
    await page.screenshot({ path: path.join(outputDir, "after-exit.png"), fullPage: false });
  }

  result = {
    after,
    before,
    diagnostics,
    exit,
    navigationStatus: navigation?.status() ?? null,
    startElapsedMs,
    target,
  };

  if (expectGameToStart && (after.frameCount < 1 || startElapsedMs === null || !exit.worked)) {
    process.exitCode = 1;
  }
} catch (error) {
  result = {
    diagnostics,
    error: error instanceof Error
      ? { message: redactSecrets(error.message, [username, accessKey]), name: error.name }
      : redactSecrets(error, [username, accessKey]),
    target,
  };
  process.exitCode = 1;
} finally {
  console.log(JSON.stringify(result, null, 2));
  await page?.close().catch(() => {});
  await browser?.close().catch(() => {});
}
