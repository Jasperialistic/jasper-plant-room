import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const supabaseUrl = index.match(/const SUPABASE_URL='([^']+)'/)?.[1];
const publishableKey = index.match(/const SUPABASE_KEY='([^']+)'/)?.[1];

if (!supabaseUrl || !publishableKey) {
  throw new Error('Could not read the Plant app Supabase configuration.');
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/grow_zones?select=id,name,photo_asset_path&photo_asset_path=not.is.null&order=name`,
  { headers: { apikey: publishableKey } },
);
if (!response.ok) throw new Error(`Grow-zone query failed (${response.status}).`);

const zones = await response.json();
const publicPrefix = `${supabaseUrl}/storage/v1/object/public/plant-media/`;

function storagePath(publicUrl) {
  return String(publicUrl || '').startsWith(publicPrefix)
    ? decodeURIComponent(String(publicUrl).slice(publicPrefix.length))
    : null;
}

function proposedThumbnailPath(originalPath) {
  if (!originalPath) return null;
  const slash = originalPath.lastIndexOf('/');
  const directory = originalPath.slice(0, slash);
  const filename = originalPath.slice(slash + 1).replace(/\.[^/.]+$/, '');
  return `${directory}/thumbs/${filename}.thumb.jpg`;
}

async function objectInfo(path) {
  if (!path) return { exists: false, bytes: null };
  const result = await fetch(`${publicPrefix}${path}`, { method: 'HEAD' });
  return {
    exists: result.ok,
    bytes: result.ok ? Number(result.headers.get('content-length')) || null : null,
  };
}

const plan = [];
for (const zone of zones) {
  const originalPath = storagePath(zone.photo_asset_path);
  const thumbnailPath = proposedThumbnailPath(originalPath);
  const [original, thumbnail] = await Promise.all([
    objectInfo(originalPath),
    objectInfo(thumbnailPath),
  ]);
  plan.push({
    zone_id: zone.id,
    zone_name: zone.name,
    original_path: originalPath,
    original_bytes: original.bytes,
    proposed_thumbnail_path: thumbnailPath,
    thumbnail_already_exists: thumbnail.exists,
  });
}

const missing = plan.filter(item => !item.thumbnail_already_exists);
console.log(JSON.stringify({
  mode: 'dry-run',
  writes_performed: 0,
  zones_with_photos: plan.length,
  thumbnails_missing: missing.length,
  original_bytes_to_read_once: missing.reduce((sum, item) => sum + (item.original_bytes || 0), 0),
  plan,
}, null, 2));
