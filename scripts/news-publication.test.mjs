import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { newsContentHash, mergeNewsEditorial, isNewsPublicationApproved, getPublishedNews } from './news-publication.mjs';

test('news publication requires exact content, locale and evidence, ignoring old eligibility flags', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'plixfy-news-review-'));
  try {
    const item = { slug: 'story', title: 'Title', summary: 'Summary', titleEn: 'English', summaryEn: 'English summary', sourceUrl: 'https://example.com/story', searchEligible: true };
    const evidencePath = 'docs/editorial-evidence/story.md';
    mkdirSync(path.join(root, 'docs/editorial-evidence'), { recursive: true });
    writeFileSync(path.join(root, evidencePath), 'Verified source and original analysis.');
    const review = { slug: item.slug, locale: 'ar', reviewer: 'Fixture reviewer', reviewedAt: '2026-01-01T00:00:00Z', contentSha256: newsContentHash(item), evidencePath, evidenceSha256: createHash('sha256').update('Verified source and original analysis.').digest('hex') };
    assert.equal(isNewsPublicationApproved(item, 'ar', [], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [review], root), true);
    assert.equal(isNewsPublicationApproved(item, 'en', [review], root), false);
    assert.equal(isNewsPublicationApproved({ ...item, summary: 'Changed' }, 'ar', [review], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [review, review], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [{ ...review, reviewer: '' }], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [{ ...review, reviewedAt: '2999-01-01' }], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [{ ...review, evidencePath: '../../outside.md' }], root), false);
    assert.equal(isNewsPublicationApproved(item, 'ar', [{ ...review, evidencePath: 'docs/editorial-evidence/missing.md' }], root), false);
    assert.deepEqual(getPublishedNews([item], { orphan: { searchEligible: true } }, [review], 'ar', root), [item]);
    assert.deepEqual(getPublishedNews([item], { story: { whyItMatters: 'Changed context' } }, [review], 'ar', root), []);
    writeFileSync(path.join(root, evidencePath), 'Evidence changed');
    assert.equal(isNewsPublicationApproved(item, 'ar', [review], root), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('hash covers enhancements and is stable across key insertion order', () => {
  assert.equal(newsContentHash({ slug: 'a', summary: 'b' }), newsContentHash({ summary: 'b', slug: 'a' }));
  const item = { slug: 'a', summary: 'b' };
  assert.notEqual(newsContentHash(item), newsContentHash(mergeNewsEditorial(item, { a: { keyPoints: ['new analysis'] } })));
  assert.deepEqual(getPublishedNews([item], {}, [{ slug: 'orphan', locale: 'ar' }]), []);
});
