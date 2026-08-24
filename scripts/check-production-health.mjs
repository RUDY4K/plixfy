import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  parseSitemap,
  selectSitemapProbes,
  validateAdsTxt,
  validateAutomationRun,
  validateRobotsTxt,
  withRetries,
} from "./production-health-core.mjs";

const canonicalOrigin = (process.env.SITE_URL || "https://www.plixfy.com").replace(/\/$/, "");
const publisherId = process.env.ADSENSE_PUBLISHER_ID || "pub-7564871953180369";
const repository = process.env.GITHUB_REPOSITORY || "RUDY4K/plixfy";
const githubToken = process.env.GITHUB_TOKEN?.trim();
const skipAutomation = process.argv.includes("--skip-automation");
const reportDirectory = path.resolve(".health");
const reportPath = path.join(reportDirectory, "production-health.json");

const workflowExpectations = [
  { file: "playgama-catalog.yml", label: "Playgama catalog", maxAgeHours: 30 },
  { file: "content-engine.yml", label: "Content engine", maxAgeHours: 14 },
  { file: "cloud-social.yml", label: "Cloud social", maxAgeHours: 14 },
  { file: "indexnow.yml", label: "IndexNow", maxAgeHours: 14 },
];

const report = {
  checkedAt: new Date().toISOString(),
  canonicalOrigin,
  status: "running",
  checks: [],
  failures: [],
};

function recordSuccess(name, details = {}) {
  report.checks.push({ name, status: "pass", ...details });
  console.log(`PASS ${name}`);
}

function recordFailure(name, error) {
  const message = error instanceof Error ? error.message : String(error);
  report.checks.push({ name, status: "fail", message });
  report.failures.push({ name, message });
  console.error(`FAIL ${name}: ${message}`);
}

async function fetchResponse(url, expectedType) {
  return withRetries(async (attempt) => {
    const startedAt = Date.now();
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Plixfy-Production-Monitor/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    if (response.status !== 200) throw new Error(`HTTP ${response.status} at ${response.url}`);
    const contentType = response.headers.get("content-type") || "";
    if (expectedType && !contentType.toLowerCase().includes(expectedType)) {
      throw new Error(`unexpected content-type ${contentType || "missing"}`);
    }
    return {
      attempt,
      body,
      contentType,
      durationMs: Date.now() - startedAt,
      finalUrl: response.url,
      status: response.status,
    };
  });
}

async function checkPage(label, url) {
  try {
    const result = await fetchResponse(url, "text/html");
    if (result.body.length < 5_000) throw new Error(`HTML response is unexpectedly small (${result.body.length} bytes)`);
    const final = new URL(result.finalUrl);
    const canonical = new URL(canonicalOrigin);
    if (final.host !== canonical.host) throw new Error(`redirected to unexpected host ${final.host}`);
    recordSuccess(label, {
      url,
      finalUrl: result.finalUrl,
      durationMs: result.durationMs,
      bytes: result.body.length,
      attempt: result.attempt,
    });
  } catch (error) {
    recordFailure(label, error);
  }
}

async function checkStaticFiles() {
  let sitemapUrls = [];
  try {
    const result = await fetchResponse(`${canonicalOrigin}/ads.txt`, "text/plain");
    const details = validateAdsTxt(result.body, publisherId);
    recordSuccess("ads.txt", { ...details, durationMs: result.durationMs, attempt: result.attempt });
  } catch (error) {
    recordFailure("ads.txt", error);
  }

  try {
    const result = await fetchResponse(`${canonicalOrigin}/robots.txt`, "text/plain");
    const details = validateRobotsTxt(result.body, canonicalOrigin);
    recordSuccess("robots.txt", { ...details, durationMs: result.durationMs, attempt: result.attempt });
  } catch (error) {
    recordFailure("robots.txt", error);
  }

  try {
    const result = await fetchResponse(`${canonicalOrigin}/sitemap.xml`, "xml");
    sitemapUrls = parseSitemap(result.body, canonicalOrigin);
    recordSuccess("sitemap.xml", {
      urlCount: sitemapUrls.length,
      durationMs: result.durationMs,
      attempt: result.attempt,
    });
  } catch (error) {
    recordFailure("sitemap.xml", error);
  }

  return sitemapUrls;
}

async function fetchWorkflowRuns(file) {
  const endpoint = new URL(`https://api.github.com/repos/${repository}/actions/workflows/${file}/runs`);
  endpoint.searchParams.set("event", "schedule");
  endpoint.searchParams.set("status", "completed");
  endpoint.searchParams.set("per_page", "1");
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${githubToken}`,
      "user-agent": "Plixfy-Production-Monitor/1.0",
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
  return response.json();
}

async function checkAutomation() {
  if (skipAutomation) {
    recordSuccess("automation monitoring", { skipped: true, reason: "--skip-automation" });
    return;
  }
  if (!githubToken) {
    recordFailure("automation monitoring", new Error("GITHUB_TOKEN is required unless --skip-automation is used"));
    return;
  }

  for (const expectation of workflowExpectations) {
    try {
      const payload = await withRetries(() => fetchWorkflowRuns(expectation.file), { attempts: 2 });
      const details = validateAutomationRun(payload, expectation);
      recordSuccess(expectation.label, details);
    } catch (error) {
      recordFailure(expectation.label, error);
    }
  }
}

await Promise.all([
  checkPage("Arabic home", `${canonicalOrigin}/`),
  checkPage("English home", `${canonicalOrigin}/en`),
  checkPage("Search", `${canonicalOrigin}/search`),
  checkPage("Categories", `${canonicalOrigin}/categories`),
  checkPage("News", `${canonicalOrigin}/news`),
  checkPage("Blog", `${canonicalOrigin}/blog`),
]);

const sitemapUrls = await checkStaticFiles();
if (sitemapUrls.length) {
  try {
    const probes = selectSitemapProbes(sitemapUrls);
    for (const probe of probes) await checkPage(probe.label, probe.url);
  } catch (error) {
    recordFailure("sitemap route probes", error);
  }
}

await checkAutomation();

report.status = report.failures.length === 0 ? "healthy" : "unhealthy";
report.completedAt = new Date().toISOString();
await mkdir(reportDirectory, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Production health: ${report.status}; ${report.checks.length} checks; ${report.failures.length} failures.`);
console.log(`Report: ${reportPath}`);
if (report.failures.length) process.exitCode = 1;
