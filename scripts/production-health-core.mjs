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

export function decodeUtf8PreservingBom(bytes) {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}

export function validateAdsTxt(text, publisherId) {
  if (text.startsWith("\uFEFF")) {
    throw new Error("ads.txt must not contain a UTF-8 byte-order mark");
  }
  const normalizedLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const expected = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

  if (!normalizedLines.includes(expected)) {
    throw new Error(`ads.txt is missing the exact AdSense authorization for ${publisherId}`);
  }

  if (normalizedLines.length !== 1) {
    throw new Error("ads.txt contains unexpected or duplicate seller entries");
  }

  return { publisherId, sellerLines: normalizedLines.length };
}

export function validateAdSenseExcludedPage(html, { requireNoIndex = false } = {}) {
  if (/<script\b[^>]*\bsrc=["'][^"']*(?:pagead2\.googlesyndication\.com|adsbygoogle)[^"']*["']/i.test(html)) {
    throw new Error("AdSense delivery script is present on an excluded page");
  }
  if (/<ins\b[^>]*\bclass=["'][^"']*\badsbygoogle\b[^"']*["']/i.test(html)) {
    throw new Error("AdSense ad slot is present on an excluded page");
  }

  const noIndex = (html.match(/<meta\b[^>]*>/gi) || []).some((tag) =>
    /\bname=["']robots["']/i.test(tag)
    && /\bcontent=["'][^"']*\bnoindex\b[^"']*["']/i.test(tag));
  if (requireNoIndex && !noIndex) {
    throw new Error("excluded page is missing a noindex robots directive");
  }

  return { adDeliveryDisabled: true, noIndex };
}

export function validateAdSenseSourceBoundary(
  files,
  { isolatedImplementation = "src/components/DeferredAdSense.tsx" } = {},
) {
  const normalizedImplementation = isolatedImplementation.replaceAll("\\", "/");
  let implementationPresent = false;

  for (const file of files) {
    const filePath = file.path.replaceAll("\\", "/");
    if (filePath === normalizedImplementation) {
      implementationPresent = true;
      continue;
    }
    if (/\bDeferredAdSense\b/.test(file.source)) {
      throw new Error(`DeferredAdSense is referenced outside its isolated implementation: ${filePath}`);
    }
    if (/(?:pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle|adsbygoogle\.push|className?=["'][^"']*\badsbygoogle\b)/i.test(file.source)) {
      throw new Error(`AdSense loader or ad slot is present outside its isolated implementation: ${filePath}`);
    }
  }

  return {
    filesChecked: files.length,
    isolatedImplementation: implementationPresent ? normalizedImplementation : null,
  };
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

// 38 stable bilingual routes remain while legacy game guides await review.
export function parseSitemap(text, canonicalOrigin, minimumUrlCount = 38) {
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
    ["Arabic browser guide", /^https:\/\/[^/]+\/guides\/browser-games$/],
    ["English browser guide", /^https:\/\/[^/]+\/en\/guides\/browser-games$/],
  ];

  const probes = [];
  for (const [label, pattern] of patterns) {
    const url = urls.find((candidate) => pattern.test(candidate));
    if (url) probes.push({ label, url });
  }

  if (!probes.some((probe) => probe.label === "Arabic game") &&
      !(probes.some((probe) => probe.label === "Arabic browser guide") &&
        probes.some((probe) => probe.label === "English browser guide"))) {
    throw new Error("sitemap needs an editorial Arabic game route or both browser guide locales");
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
