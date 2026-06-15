#!/usr/bin/env node
/**
 * Downloads the current Monetag service worker, pins it by SHA-256 hash,
 * writes it to public/, and updates public/sw.js to import from the
 * locally hosted, hash-named file.
 *
 * Run when Monetag changes their SW (or on a quarterly cadence):
 *   node scripts/refresh-monetag-sw.mjs
 *
 * The point of self-hosting: if 5gvci.com is ever compromised, malicious
 * code does NOT auto-deploy to plixfy.com's service worker scope. We pay
 * the cost of manual refresh in exchange for supply-chain isolation.
 */
import { createHash } from "node:crypto";
import { writeFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const REMOTE = "https://5gvci.com/act/files/service-worker.min.js?r=sw";
const PUBLIC_DIR = "public";
const VENDOR_PREFIX = "monetag-sw-";

async function main() {
  console.log("Fetching", REMOTE);
  const res = await fetch(REMOTE);
  if (!res.ok) throw new Error(`HTTP ${res.status} from Monetag`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`  ${buf.length} bytes downloaded`);

  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const fileName = `${VENDOR_PREFIX}${hash}.js`;
  const outPath = join(PUBLIC_DIR, fileName);

  // Remove old pinned versions
  const entries = await readdir(PUBLIC_DIR);
  for (const entry of entries) {
    if (entry.startsWith(VENDOR_PREFIX) && entry !== fileName) {
      await unlink(join(PUBLIC_DIR, entry));
      console.log(`  removed stale ${entry}`);
    }
  }

  await writeFile(outPath, buf);
  console.log(`  wrote ${outPath}`);

  // Rewrite sw.js to point at the pinned file
  const swContent = `self.options = {
  "domain": "5gvci.com",
  "zoneId": 11150632
};

self.lary = "";

// Pinned Monetag SW vendor script (hash: ${hash})
// Refresh with: node scripts/refresh-monetag-sw.mjs
importScripts('/${fileName}');
`;
  await writeFile(join(PUBLIC_DIR, "sw.js"), swContent);
  console.log(`  updated public/sw.js → ${fileName}`);
  console.log(`\n✓ Monetag SW pinned at hash ${hash}`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
