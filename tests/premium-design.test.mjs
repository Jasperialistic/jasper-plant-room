import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [design, tokens, index, worker] = await Promise.all([
  readFile(new URL('../v51-noir-premium.js', import.meta.url), 'utf8'),
  readFile(new URL('../docs/design/premium-direction.md', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8'),
]);

test('Noir Edition tokens match the locked direction document', () => {
  assert.match(tokens, /#080808/);
  assert.match(tokens, /#C9B18A/);
  assert.match(tokens, /#F4F1EC/);
  assert.match(design, /--pr-noir:#080808/);
  assert.match(design, /--pr-champagne:#C9B18A/);
  assert.match(design, /--pr-champagne-hi:#E7D6B4/);
  assert.match(design, /--pr-ivory:#F4F1EC/);
});

test('typography is the Bodoni display x Inter UI mix (no cursive, no all-sans)', () => {
  assert.match(design, /Bodoni\+Moda/);
  assert.match(design, /'Bodoni Moda','Georgia',serif/);
  assert.match(design, /'Inter',ui-sans-serif,system-ui,sans-serif/);
  assert.doesNotMatch(design, /font-style:\s*italic/);
});

test('surfaces carry physical depth, not flat fills', () => {
  assert.match(design, /inset 0 1px 0 rgba\(255,255,255,/);
  assert.match(design, /0 26px 52px rgba\(0,0,0,\.55\)/);
  assert.match(design, /border-radius:999px!important/);
});

test('generated botanical artwork wraps headers and background; owner photos stay content', () => {
  assert.match(design, /assets\/art\/wallpaper-leaves\.svg/);
  assert.match(design, /assets\/art\/header-garden\.svg/);
  assert.doesNotMatch(design, /assets\/images\//);
});

test('v51 loads last before boot and its artwork is precached', () => {
  const script = index.indexOf('v51-noir-premium.js?v=5.1.2');
  const v50 = index.indexOf('v50-media-efficiency.js?v=5.0.0');
  const boot = index.indexOf('<script>boot();</script>');
  assert.notEqual(script, -1);
  assert.ok(v50 < script);
  assert.ok(script < boot);
  assert.match(worker, /'\.\/v51-noir-premium\.js\?v=5\.1\.2'/);
  assert.match(worker, /'\.\/assets\/art\/wallpaper-leaves\.svg'/);
  assert.match(worker, /'\.\/assets\/art\/header-garden\.svg'/);
});
