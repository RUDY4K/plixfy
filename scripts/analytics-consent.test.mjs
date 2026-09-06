import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/GoogleAnalytics.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Exercise the real transpiled component and initializer; stub only browser storage,
// React scheduling and consent notifications. No scripts or network are loaded.
function harness(initial = null, ready = true) {
  let choice = initial;
  let enabled = false;
  let effect;
  let change;
  let clear;
  const calls = [];
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const window = ready ? { gtag: (...args) => calls.push(args) } : {};
  const exports = {};
  const context = vm.createContext({
    exports, window, localStorage: storage, sessionStorage: storage,
    navigator: { userAgent: 'Test ordinary visitor' },
    require: specifier => {
      if (specifier === 'react') return { useState: () => [enabled, value => { enabled = value; }], useEffect: callback => { effect = callback; } };
      if (specifier === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' };
      if (specifier === 'next/script') return { default: 'Script' };
      if (specifier === '@/lib/consent') return {
        getConsent: () => choice,
        onConsentChange: callback => { change = callback; return () => { change = undefined; }; },
        onConsentCleared: callback => { clear = callback; return () => { clear = undefined; }; },
      };
      throw new Error(`Unexpected dependency ${specifier}`);
    },
  });
  vm.runInContext(compiled, context);
  const render = () => exports.default({ gaId: 'G-TESTONLY' });
  render();
  const cleanup = effect();
  return {
    calls, data, exports, window, render, cleanup,
    choose(next) { choice = next; change?.(next); },
    clear() { choice = null; clear?.(); },
    init(callback = render().props.onReady) {
      callback();
      return (window.dataLayer ?? []).map(args => Array.from(args));
    },
  };
}
const events = calls => calls.filter(call => call[0] === 'event');

test('restoring accepted consent updates storage permission without inventing a banner event', () => {
  const h = harness('accept');
  assert.equal(events(h.calls).length, 0);
  assert.equal(h.calls[0][2].analytics_storage, 'granted');
  h.choose('accept');
  assert.equal(events(h.calls).length, 0);
});

test('a real acceptance emits once per transition with a non-attribution parameter', () => {
  const h = harness();
  assert.equal(h.render(), null);
  h.exports.trackEvent('preconsent');
  h.choose('accept');
  h.choose('accept');
  assert.equal(events(h.calls).length, 1);
  const [, name, params] = events(h.calls)[0];
  assert.equal(name, 'consent_accept');
  assert.equal(params.consent_source, 'banner');
  assert.equal('source' in params, false);
  h.choose('reject');
  h.exports.trackEvent('afterreject');
  assert.equal(events(h.calls).length, 1);
  h.choose('accept');
  assert.equal(events(h.calls).length, 2);
});

test('acceptance before gtag is ready queues once and initializer delivers once', () => {
  const h = harness(null, false);
  h.choose('accept');
  h.choose('accept');
  assert.equal(JSON.parse(h.data.get('plixfy_ga_queue')).length, 1);
  assert.equal(events(h.init()).filter(call => call[1] === 'consent_accept').length, 1);
  assert.equal(h.data.has('plixfy_ga_queue'), false);
});

test('revocation clears queued events and prevents a stale lazy initializer sending them', () => {
  const h = harness(null, false);
  h.choose('accept');
  const scheduled = h.render().props.onReady;
  h.choose('reject');
  assert.equal(h.render(), null);
  assert.equal(h.data.has('plixfy_ga_queue'), false);
  assert.equal(h.init(scheduled).length, 0);
});

test('direct queue flushing cannot bypass rejected or missing consent', () => {
  for (const consent of [null, 'reject']) {
    const h = harness(consent);
    h.data.set('plixfy_ga_queue', JSON.stringify([{ name: 'old-event' }]));
    h.exports.flushQueuedEvents();
    assert.equal(events(h.calls).length, 0);
  }
});

test('clearing consent disables analytics, drops the queue and resets transition state', () => {
  const h = harness('accept');
  h.data.set('plixfy_ga_queue', JSON.stringify([{ name: 'old-event' }]));
  h.clear();
  assert.equal(h.render(), null);
  assert.equal(h.data.has('plixfy_ga_queue'), false);
  h.exports.trackEvent('afterclear');
  assert.equal(events(h.calls).length, 0);
  h.choose('accept');
  assert.equal(events(h.calls).length, 1);
});

test('unmount removes both consent listeners', () => {
  const h = harness();
  h.cleanup();
  h.choose('accept');
  h.clear();
  assert.equal(events(h.calls).length, 0);
});


test('a cached script can initialize after a revoked first load and never configures twice', () => {
  const h = harness(null, false);
  h.choose('accept');
  const firstLoadReady = h.render().props.onReady;
  h.choose('reject');
  assert.equal(h.init(firstLoadReady).length, 0);
  assert.equal(h.window.plixfyAnalyticsInitialized, undefined);
  h.choose('accept');
  let commands = h.init();
  assert.equal(commands.filter(call => call[0] === 'config').length, 1);
  assert.equal(events(commands).filter(call => call[1] === 'consent_accept').length, 1);
  h.choose('reject');
  h.choose('accept');
  commands = h.init();
  assert.equal(commands.filter(call => call[0] === 'config').length, 1);
  assert.equal(events(commands).filter(call => call[1] === 'consent_accept').length, 2);
});
