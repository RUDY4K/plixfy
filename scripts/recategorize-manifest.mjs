#!/usr/bin/env node
/**
 * Recategorize and prune the existing harvest manifest in place.
 *
 *   1. Re-run categorize() on every entry using the new shared rules.
 *   2. Drop entries failing passesQualityFilter (low-effort meme/old/brand).
 *   3. Cap 'girls' at MAX_GIRLS to rebalance the catalog.
 *
 * Writes harvest-manifest.json with the updated set; the rejected list
 * grows with reason='pruned' so we can see what was dropped.
 *
 * Usage: node scripts/recategorize-manifest.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { categorize, passesQualityFilter } from './lib/categorize.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, 'harvest-manifest.json');

/**
 * Per-category caps. Scaled up for the 2000+ catalog: most categories run
 * uncapped (Infinity) so we let the catalog grow naturally. Only girls and
 * casual still have hard ceilings — those buckets attract long-tail filler
 * we don't want dominating browse rows.
 *
 * If you want to rebalance, lower individual values; missing keys are
 * treated as uncapped.
 */
const CAPS = {
  girls: 120,
  casual: 200,
};

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const before = manifest.games.length;

  const kept = [];
  const dropped = [];

  for (const g of manifest.games) {
    // Re-categorize first so quality filter has correct context.
    const { category } = categorize({ title: g.title, description: g.description, keywords: g.keywords });
    const updated = { ...g, category };

    if (!passesQualityFilter(updated)) {
      dropped.push({ id: g.id, slug: g.slug, title: g.title, reason: 'quality' });
      continue;
    }
    kept.push(updated);
  }

  // Enforce per-category caps. For each category, sort by description
  // length (proxy for richness) and keep the top N.
  const byCat = new Map();
  for (const g of kept) {
    if (!byCat.has(g.category)) byCat.set(g.category, []);
    byCat.get(g.category).push(g);
  }
  const keepIds = new Set();
  for (const [cat, list] of byCat.entries()) {
    list.sort((a, b) => (b.description?.length ?? 0) - (a.description?.length ?? 0));
    const cap = CAPS[cat] ?? list.length;
    for (const g of list.slice(0, cap)) keepIds.add(g.id);
    for (const g of list.slice(cap)) {
      dropped.push({ id: g.id, slug: g.slug, title: g.title, reason: `cap:${cat}` });
    }
  }
  const finalKept = kept.filter((g) => keepIds.has(g.id));

  manifest.games = finalKept;
  manifest.rejected = manifest.rejected ?? [];
  for (const d of dropped) manifest.rejected.push(d);
  manifest.recategorized = new Date().toISOString();

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const finalCounts = finalKept.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Before: ${before}, after: ${finalKept.length} (dropped ${dropped.length}).`);
  console.log('By category:', finalCounts);
  console.log(`Drop reasons:`, dropped.reduce((acc, d) => { acc[d.reason] = (acc[d.reason] ?? 0) + 1; return acc; }, {}));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
