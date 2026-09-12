import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/pageTracking.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });

const { buildPageSnapshot, pageViewsAfterConsent } = exports;

test('landing snapshot preserves paid-search identifiers until consent', () => {
  const landing = buildPageSnapshot(
    '/all-games',
    'gclid=test-click&utm_source=google&utm_medium=cpc',
    'https://www.plixfy.com/all-games?gclid=test-click&utm_source=google&utm_medium=cpc',
    'All games',
    'https://www.google.com/',
  );
  const current = buildPageSnapshot(
    '/all-games',
    '',
    'https://www.plixfy.com/all-games',
    'All games',
  );

  const views = pageViewsAfterConsent(landing, current);
  assert.equal(views.length, 2);
  assert.match(views[0].page_location, /gclid=test-click/);
  assert.equal(views[0].page_referrer, 'https://www.google.com/');
  assert.equal(views[1].page_location, 'https://www.plixfy.com/all-games');
});

test('accepting on the original landing sends one page view without duplication', () => {
  const landing = buildPageSnapshot(
    '/all-games',
    'utm_source=google&utm_medium=cpc',
    'https://www.plixfy.com/all-games?utm_source=google&utm_medium=cpc',
    'All games',
  );

  const views = pageViewsAfterConsent(landing, { ...landing });
  assert.equal(views.length, 1);
  assert.equal(views[0].page_location, landing.page_location);
  assert.equal(views[0].page_path, landing.page_path);
});

test('visitors with prior consent receive the current page only', () => {
  const current = buildPageSnapshot(
    '/play/example',
    '',
    'https://www.plixfy.com/play/example',
    'Example',
  );

  const views = pageViewsAfterConsent(null, current);
  assert.equal(views.length, 1);
  assert.equal(views[0].page_location, current.page_location);
  assert.equal(views[0].page_path, current.page_path);
});
