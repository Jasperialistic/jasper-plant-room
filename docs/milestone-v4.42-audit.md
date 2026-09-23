# Plant Room v4.42 milestone audit

Date: 23 September 2026

Baseline: `main` at `95e811cb74cd6f0d47f02ce90520c5825e8c5f70` (`v4.41.2`). This milestone is confined to Plant Room. It does not integrate with or modify Guren Core.

## Production architecture

- Framework-free static PWA deployed from GitHub Pages.
- Supabase provides Auth, Postgres, Storage, and Edge Functions. The public browsing path does not open a Realtime subscription.
- Public media is stored in the `plant-media` bucket. `plant_photos` records an original `storage_path` and its deterministic 640 px `thumbnail_path`.
- List, grid, and adjacent mobile viewer surfaces use derivatives. A full original is requested only when the owner or visitor deliberately opens the full-resolution viewer.
- The ten historical location originals and their generated thumbnails remain intact. This milestone does not run another historical backfill or weaken RLS.

## Measurements and heat investigation

The v4.41.2 production shell was 4,520,639 bytes because 167 images (3,271,110 decoded bytes) were embedded as data URLs. The v4.42 source shell is 167,128 bytes, a 96.3% reduction. The 167 originals are now ordinary static assets and are fetched only when a view references them.

On the live public dashboard, the DOM held 1,231 elements and its element count, markup length, and text length stayed unchanged over a ten-second idle sample. That rules out an active idle render loop in the sampled state. The patch stack still contains 32 MutationObserver instances (20 in `v47-mobile-navigation.js`); most are scoped or animation-frame-coalesced, but their consolidation remains architectural debt.

The largest identified heat contributors were:

1. parsing and decoding the multi-megabyte embedded-image shell on every network-first navigation;
2. duplicate image preprocessing in the upload wrapper and thumbnail pipeline;
3. repeated cloud refreshes on short focus changes;
4. mobile backdrop blur and layered shadow compositing; and
5. broad observer-based enhancement passes accumulated by the patch stack.

This milestone externalizes the embedded media, caches same-origin static assets without a background re-download, precaches the full local script shell, preprocesses each upload once, applies a 60-second focus-refresh cooldown, and removes backdrop blur on mobile/coarse-pointer devices. Observer consolidation is deliberately deferred because changing the mature enhancement lifecycle in the same release would raise regression risk.

## Upload pipeline

The previous multi-file path was sequential and aborted at the first failure. A twenty-photo batch required forty Storage writes plus twenty metadata writes, but exposed only aggregate status and had no retryable per-item state.

The v4.42 queue:

- accepts multi-select in both new-plant and existing-plant flows;
- validates each file independently and displays queued, uploading, confirming, retrying, complete, or failed state;
- uses one worker on mobile or low-memory devices and at most two elsewhere;
- retries transient failures up to three times with backoff;
- keeps a stable, create-only Storage path for each in-memory item;
- treats existing objects as retry-safe and checks `plant_photos.storage_path` before inserting metadata;
- preserves successful items when another item fails; and
- lets the owner retry failed items or explicitly keep the successful subset.

No original is deleted as part of queue recovery. Standard Supabase uploads remain appropriate because images are resized/compressed before upload; resumable TUS uploads are a future option for intentionally retained files over 6 MB or consistently unstable networks.

## Dependency graph and implementation order

```text
v4.41.2 derivative-first baseline and historical backfill
  -> external static image assets and aligned PWA cache version
  -> single-pass image preparation
  -> bounded, retryable, metadata-idempotent upload queue
  -> focus/compositing heat reductions
  -> KEMURI visual tokens and component treatment
  -> regression and owner-device acceptance
```

## Bug and debt ledger

### BLOCKING THIS MILESTONE / FIX NOW

Fixed in v4.42:

- multi-megabyte navigation-blocking embedded media;
- batch upload abort-on-first-failure behavior;
- duplicate upload preprocessing;
- unsafe retry ambiguity between Storage and metadata confirmation;
- frequent focus-triggered cloud reloads; and
- high-cost mobile backdrop blur.

### RELATED / LOW RISK

- Precache every same-origin JavaScript dependency in the PWA shell.
- Align manifest, service-worker, workflow, page, and visible release versions.
- Make the one-time bundled-image extraction utility safe to rerun.

### UNRELATED / DEBT

Recorded for later milestones:

- the monolithic patch stack and observer fan-out;
- lack of a build/bundling system and comprehensive browser automation;
- a CDN-loaded Supabase client pinned only to major version `2`;
- startup still downloads full public table projections rather than view-specific fields; and
- the queue is recoverable during the open page session, but is not persisted across a full browser restart.

## Gates and validation

Automated checks: JavaScript syntax checks, `node --test tests/egress-audit.test.mjs`, and `git diff --check`.

Still owner-gated before release:

- visual acceptance of the KEMURI direction on the owner's phone;
- an authenticated real-device batch upload (recommended test: twenty representative photos, including an induced network interruption); and
- explicit authorization to push and deploy.
