import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const [index, navigation, worker, workflow, uploadQueue, kemuri, experience, bundledImages] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../v47-mobile-navigation.js', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/pwa-shell-deploy.yml', import.meta.url), 'utf8'),
  readFile(new URL('../v48-upload-queue.js', import.meta.url), 'utf8'),
  readFile(new URL('../v48-kemuri.js', import.meta.url), 'utf8'),
  readFile(new URL('../v49-organic-experience.js', import.meta.url), 'utf8'),
  readdir(new URL('../assets/images/', import.meta.url), { recursive: true }),
]);

test('media patches install before the initial cloud load', () => {
  const patchScript = index.indexOf('v47-mobile-navigation.js?v=4.43.0');
  const uploadScript = index.indexOf('v48-upload-queue.js?v=4.43.0');
  const designScript = index.indexOf('v48-kemuri.js?v=4.43.0');
  const experienceScript = index.indexOf('v49-organic-experience.js?v=4.43.0');
  const boot = index.indexOf('<script>boot();</script>');

  assert.notEqual(patchScript, -1);
  assert.notEqual(uploadScript, -1);
  assert.notEqual(designScript, -1);
  assert.notEqual(experienceScript, -1);
  assert.notEqual(boot, -1);
  assert.ok(patchScript < boot);
  assert.ok(uploadScript < boot);
  assert.ok(designScript < boot);
  assert.ok(experienceScript < boot);
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
  assert.match(worker, /jasper-plant-room-shell-v4\.43\.0/);
  assert.match(worker, /v47-mobile-navigation\.js\?v=4\.43\.0/);
  assert.match(worker, /v48-upload-queue\.js\?v=4\.43\.0/);
  assert.match(worker, /v48-kemuri\.js\?v=4\.43\.0/);
  assert.match(worker, /v49-organic-experience\.js\?v=4\.43\.0/);
  assert.match(workflow, /v47-mobile-navigation\.js\?v=4\.43\.0/);
  assert.doesNotMatch(worker, /fetch\(req,\{cache:'reload'\}\)/);
  for (const source of [...index.matchAll(/<script src="(v\d+[^"?]+\.js)\?v=[^"]+"><\/script>/g)].map(match => match[1])) {
    assert.match(worker, new RegExp(source.replaceAll('.', '\\.')));
  }
});

test('location cards and future location uploads use deterministic derivatives', () => {
  assert.match(navigation, /function locationThumbPath\(value\)/);
  assert.match(navigation, /\/thumbs\/\$\{stem\}\.thumb\.jpg/);
  assert.match(index, /display=original&&typeof window\.plantThumbnailUrl/);
  assert.match(index, /uploadedThumbnailPath=window\.plantLocationThumbPath/);
  assert.match(index, /contentType:'image\/jpeg',cacheControl:'31536000',upsert:false/);
});

test('bundled originals are external files instead of navigation-blocking data URLs', () => {
  assert.equal((index.match(/data:image\//g) || []).length, 0);
  assert.ok(Buffer.byteLength(index) < 250_000);
  const imageFiles = new Set(bundledImages.filter(path => /\.(?:jpe?g|png|webp)$/i.test(path)).map(path => `assets/images/${path.replaceAll('\\', '/')}`));
  const imageMap = JSON.parse(index.match(/window\.PLANT_IMAGES=(\{[^\r\n]+\});/)?.[1] || '{}');
  assert.equal(imageFiles.size, 167);
  assert.equal(Object.keys(imageMap).length, 167);
  for (const [key, value] of Object.entries(imageMap)) {
    assert.equal(value, key);
    assert.ok(imageFiles.has(value), `Missing external image: ${value}`);
  }
});

test('uploads are bounded, retryable, and confirm metadata idempotently', () => {
  assert.match(uploadQueue, /MAX_ATTEMPTS=3/);
  assert.match(uploadQueue, /Math\.min\(concurrency,items\.length\)/);
  assert.match(uploadQueue, /\.eq\('storage_path',path\)\.limit\(1\)\.maybeSingle\(\)/);
  assert.match(uploadQueue, /Retry failed/);
  assert.match(uploadQueue, /item\.state='complete'/);
  assert.match(navigation, /plantPrepared:true/);
  assert.match(navigation, /window\.plantUploadPair=uploadPair/);
});

test('focus refresh is cooled down and KEMURI removes mobile backdrop blur', () => {
  assert.match(index, /now-lastFocusRefresh<60000/);
  assert.match(kemuri, /@media\(max-width:700px\),\(pointer:coarse\)/);
  assert.match(kemuri, /backdrop-filter:none!important/);
  assert.match(experience, /@media\(max-width:700px\),\(pointer:coarse\)/);
  assert.match(experience, /backdrop-filter:none!important/);
  assert.match(experience, /prefers-reduced-motion:reduce/);
  assert.match(experience, /typeof navigator\.vibrate!=='function'/);
  assert.match(experience, /visibilitychange/);
});
