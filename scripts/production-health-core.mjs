const XML_ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeXml(value) {
  return value.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITY_MAP[entity] ?? entity);
}

export function validateAdsTxt(text, publisherId) {
  const normalizedLines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const expected = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

  if (!normalizedLines.includes(expected)) {
    throw new Error(`ads.txt is missing the exact AdSense authorization for ${publisherId}`);
  }

  return { publisherId, sellerLines: normalizedLines.length };
}

export function validateRobotsTxt(text, canonicalOrigin) {
  const expectedSitemap = `Sitemap: ${canonicalOrigin}/sitemap.xml`;
  if (!text.includes(expectedSitemap)) {
    throw new Error(`robots.txt is missing ${expectedSitemap}`);
  }
  if (/^\s*Disallow:\s*\/ads(?:\.txt)?\s*$/im.test(text)) {
    throw new Error("robots.txt blocks ads.txt");
  }
  return { sitemap: `${canonicalOrigin}/sitemap.xml` };
}

export function parseSitemap(text, canonicalOrigin, minimumUrlCount = 50) {
  const canonical = new URL(canonicalOrigin);
  const urls = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()))
    .filter(Boolean);

  if (urls.length < minimumUrlCount) {
    throw new Error(`sitemap contains ${urls.length} URLs; expected at least ${minimumUrlCount}`);
  }

  for (const value of urls) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.host !== canonical.host) {
      throw new Error(`sitemap URL is outside the canonical HTTPS host: ${value}`);
    }
  }

  return urls;
}

export function selectSitemapProbes(urls) {
  const patterns = [
    ["Arabic game", /^https:\/\/[^/]+\/play\/[^/]+$/],
    ["English game", /^https:\/\/[^/]+\/en\/play\/[^/]+$/],
    ["Arabic article", /^https:\/\/[^/]+\/(?:news|blog)\/[^/]+$/],
    ["English article", /^https:\/\/[^/]+\/en\/(?:news|blog)\/[^/]+$/],
  ];

  const probes = [];
  for (const [label, pattern] of patterns) {
    const url = urls.find((candidate) => pattern.test(candidate));
    if (url) probes.push({ label, url });
  }

  if (!probes.some((probe) => probe.label === "Arabic game")) {
    throw new Error("sitemap does not contain an editorial Arabic game route for production probes");
  }

  return probes;
}

export function validateAutomationRun(payload, { label, maxAgeHours, now = new Date() }) {
  const run = payload?.workflow_runs?.[0];
  if (!run) throw new Error(`${label} has no completed scheduled run`);
  if (run.conclusion !== "success") {
    throw new Error(`${label} latest scheduled run concluded with ${run.conclusion ?? "unknown"}`);
  }

  const completedAt = new Date(run.updated_at ?? run.created_at);
  const ageMs = now.getTime() - completedAt.getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    throw new Error(`${label} returned an invalid completion timestamp`);
  }

  const ageHours = ageMs / 3_600_000;
  if (ageHours > maxAgeHours) {
    throw new Error(`${label} last succeeded ${ageHours.toFixed(1)} hours ago (limit ${maxAgeHours})`);
  }

  return {
    runId: run.id,
    conclusion: run.conclusion,
    completedAt: completedAt.toISOString(),
    ageHours: Number(ageHours.toFixed(2)),
    url: run.html_url,
  };
}

export async function withRetries(operation, { attempts = 3, delayMs = 1_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
