#!/usr/bin/env node
/**
 * Rewrite each `thumbnail:` field in registry-embed.ts so that the filename
 * matches `embed-<slug>.jpg`. The original registry used hand-picked short
 * names; we standardize on full slugs (predictable, scripted).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(__dirname, '..', 'games', 'registry-embed.ts');

const src = await readFile(REGISTRY_PATH, 'utf8');

// Walk each `{ kind: 'embed', ... }` block, rewrite its `thumbnail:` line.
const rewritten = src.replace(
  /(\{\s*kind:\s*'embed',[\s\S]*?\})/g,
  (block) => {
    const slugMatch = block.match(/slug:\s*'([^']+)'/);
    if (!slugMatch) return block;
    const slug = slugMatch[1];
    return block.replace(
      /thumbnail:\s*'[^']*'/,
      `thumbnail: '/assets/thumbnails/embed-${slug}.jpg'`,
    );
  },
);

await writeFile(REGISTRY_PATH, rewritten);
console.log('Registry normalized.');
