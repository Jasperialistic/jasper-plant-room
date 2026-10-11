# Plant Room egress & growth-photo performance report (dev/premium-revamp-h)

Date: 11 Oct 2026 · Method: Chromium/Playwright against local preview of this
branch, plus read-only `curl -sI` against public `plant-media` objects. All
upload-side tests used synthetic 3024×4032 fixtures with stubbed transport —
**no production records, photos or storage objects were created or modified.**

## 1. Growth-photo transform: old two-pass vs v50 single-pass (A/B, identical input)

Synthetic photo: 3024×4032 JPEG, 880 KB source. Instrumented decode counters.

| Metric | Old (v4.42 two-pass) | New (v50 single-pass) |
|---|---|---|
| Full decode operations | **2** | **1** |
| Wall-clock (desktop Chromium) | 186 ms | 189 ms |
| Resized original out | 361,031 B | 359,746 B |
| Thumbnail out (640px) | 60,510 B | 61,384 B |
| JS heap after | ~4 MB (stable) | ~4 MB (stable) |

Honest claims:
- **Decode operations per photo halved (2 → 1).** The removed decode is the
  full-resolution one; mobile JPEG decoders pay far more for it than desktop.
- **Wall-clock on desktop is unchanged** — the second decode ran on an
  already-resized file and is cheap on desktop. No speedup is claimed.
- **No CPU/thermal percentage is claimed.** On-device effect remains to be
  measured on the Fold8 / owner phone; the physical thermal gate is OPEN.
- Output quality/size parity within 0.4 %; originals preserved when re-encode
  would not shrink (contract-tested).

## 2. Upload pipeline is genuinely wired (runtime-verified)

- `window.v50MediaEfficiency === true`; `window.plantUploadPair` is the v50
  single-pass implementation.
- **Defect found and fixed:** v47's recurring `sync()` clobbered
  `uploadPhoto`/`uploadNewPlantPhotos` back to the pre-queue v441 single-photo,
  abort-on-first-failure variants. The dialog button kept the queue, but global
  callers silently lost multi-select, per-item retry and error isolation.
  Fixed by carrying `v441LightweightThumbnails` flags (commit `427f837`,
  v48 → `?v=4.43.1`), regression-tested, and verified stable across forced DOM
  churn. Chain now: UI button → `uploadPhotoQueued` (bounded queue) →
  `plantUploadPair` (single-pass) → idempotent metadata.

## 3. Collection-load egress profile (public visitor, 55-plant collection)

- 92 requests total: 55 Supabase thumbnails (`/thumbs/` derivatives — **zero
  originals in list/grid paths**), 6 Supabase REST calls (4 table projections +
  2 batched alias lookups — no per-plant query storms), 28 same-origin scripts,
  fonts/favicon/doc.
- Thumbnail sizes observed (curl `content-length`): 20–71 KB each; ≈2 MB for a
  full collection first load.
- Originals load only in the deliberate full-resolution viewer (unchanged
  contract).
- Note: cross-origin `transferSize` is zeroed in Resource Timing (no
  Timing-Allow-Origin on storage responses); byte counts above come from
  headers/network layer.

## 4. Caching behavior (measured)

- **Service worker photo cache works:** `jasper-plant-room-photos-v1` holds 55
  entries after one visit; cache-first path serves repeat visits with zero
  network egress for already-seen photos.
- Same-origin shell: all 28 scripts served from SW cache on repeat visits.
- **CDN/HTTP cache defect found:** every sampled `plant-media` object — legacy
  `base-*`, recent `photo-*`, and `.thumb.jpg` derivatives uploaded with
  `cacheControl:'31536000'` — serves `Cache-Control: no-cache` with
  `CF-Cache-Status: MISS`. HTTP/CDN caching of photos is therefore ineffective
  bucket-wide; repeat-visit savings currently come ONLY from the SW cache.

### Cache-control remediation (prepared, NOT executed — owner gate)

Changing object cache-control metadata is a production storage mutation and is
owner-gated per the graph's rules. Options when approved:
1. Re-upload/copy-in-place with `cacheControl:'31536000'` for all `plant-media`
   derivatives (bytes unchanged; needs authenticated owner session), or
2. Raise with Supabase whether the platform overrides object cache-control on
   public object delivery (the upload setting appears ineffective).
The queue (v48/v50) continues to set `cacheControl:'31536000'` on every new
upload, so new objects are covered the moment delivery honors it.

## 5. Known limitations

- No authenticated owner upload was performed; production upload path verified
  by wiring/runtime checks and stubbed transport only.
- Physical thermal confirmation on the owner's phone remains OPEN.
- Egress billing attribution (Supabase dashboard) unavailable to this worker
  (no Supabase connector); all figures are observed client-side transfer.
