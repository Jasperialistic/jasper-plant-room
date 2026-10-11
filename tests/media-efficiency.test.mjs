import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [media, index, worker] = await Promise.all([
  readFile(new URL('../v50-media-efficiency.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8'),
]);

test('media preparation decodes each photo exactly once', () => {
  assert.match(media, /function decodeOnce\(file\)/);
  assert.equal((media.match(/createImageBitmap\(/g) || []).length, 1);
  assert.equal((media.match(/new Image\(\)/g) || []).length, 1);
  // drawScaled handles every resize+encode; no second decode pipeline exists.
  assert.equal((media.match(/function drawScaled\(/g) || []).length, 1);
  assert.equal((media.match(/await drawScaled\(/g) || []).length, 2);
});

test('decoders are released and canvases are emptied', () => {
  assert.match(media, /function releaseDecoder\(/);
  assert.match(media, /typeof image\?\.close==='function'\)image\.close\(\)/);
  assert.match(media, /canvas\.width=1;canvas\.height=1/);
});

test('originals are preserved when re-encoding would not help', () => {
  assert.match(media, /resized&&resized\.size<file\.size/);
  assert.match(media, /Photo decode failed; uploading untouched/);
  assert.match(media, /const needsResize=file\.size>OPTIMIZE_MIN_BYTES&&Math\.max\(width,height\)>MAX_EDGE/);
});

test('upload pair keeps the stable two-object contract', () => {
  assert.match(media, /async function uploadPair\(path,file\)/);
  assert.match(media, /\/thumbs\//);
  assert.match(media, /\.thumb\.jpg'/);
  assert.match(media, /plantPrepared:true/);
  const cacheControls = media.match(/cacheControl:'31536000'/g) || [];
  assert.equal(cacheControls.length, 2);
  // Storage duplicates are retry-safe, never fatal.
  assert.equal((media.match(/already exists\|duplicate/g) || []).length, 2);
});

test('v50 is loaded before boot and precached by the service worker', () => {
  const script = index.indexOf('v50-media-efficiency.js?v=5.0.0');
  const boot = index.indexOf('<script>boot();</script>');
  assert.notEqual(script, -1);
  assert.ok(script < boot);
  assert.match(worker, /'\.\/v50-media-efficiency\.js\?v=5\.0\.0'/);
});
