import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [index, navigation, worker, workflow] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../v47-mobile-navigation.js', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/pwa-shell-deploy.yml', import.meta.url), 'utf8'),
]);

test('media patches install before the initial cloud load', () => {
  const patchScript = index.indexOf('v47-mobile-navigation.js?v=4.41.2');
  const boot = index.indexOf('<script>boot();</script>');

  assert.notEqual(patchScript, -1);
  assert.notEqual(boot, -1);
  assert.ok(patchScript < boot);
  assert.equal(index.match(/<script>boot\(\);<\/script>/g)?.length, 1);
  assert.doesNotMatch(index.slice(0, patchScript), /^boot\(\);$/m);
});

test('list and preview renderers substitute stable thumbnail URLs', () => {
  assert.match(
    navigation,
    /\['renderAll','renderQueue','renderPlants','renderLocations','openPlant','setPlantPreview'\]/,
  );
  assert.match(navigation, /function sync\(\).*rebuildMap\(\);/);
});

test('mobile adjacent viewer slides use thumbnails while the current image remains original', () => {
  assert.match(navigation, /prevImg\.src=displayUrl\(data\.urls/);
  assert.match(navigation, /nextImg\.src=displayUrl\(data\.urls/);
  assert.match(navigation, /window\.plantThumbnailUrl=url=>originalToThumb/);
  assert.doesNotMatch(
    navigation,
    /document\.getElementById\('photoLightboxImg'\).*plantThumbnailUrl/,
  );
});

test('service worker and page use the same cache-busted media patch', () => {
  assert.match(worker, /jasper-plant-room-shell-v4\.41\.2/);
  assert.match(worker, /v47-mobile-navigation\.js\?v=4\.41\.2/);
  assert.match(workflow, /v47-mobile-navigation\.js\?v=4\.41\.2/);
});

test('location cards and future location uploads use deterministic derivatives', () => {
  assert.match(navigation, /function locationThumbPath\(value\)/);
  assert.match(navigation, /\/thumbs\/\$\{stem\}\.thumb\.jpg/);
  assert.match(index, /display=original&&typeof window\.plantThumbnailUrl/);
  assert.match(index, /uploadedThumbnailPath=window\.plantLocationThumbPath/);
  assert.match(index, /contentType:'image\/jpeg',cacheControl:'31536000',upsert:false/);
});
