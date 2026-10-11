# Plant Room Android v1 — DEV candidate handover

Branch `dev/premium-revamp-h` · web baseline: Noir Édition v1 (owner PASS,
frozen) · this document covers the native app + release candidate.

## 1. Native v1 capabilities actually implemented

- Public visitor collection browsing (anon RLS), search, responsive adaptive
  layouts (cover single-pane / inner two-pane at ≥840dp), loading/empty/error
  states, thumbnails with cover selection (cloud + bundled base photos).
- Owner sign-in (GoTrue, real endpoint verified) + owner-gated UI.
- Plant details: cover photo, full web-contract metadata, growth-history
  timeline (chronological), collection-photo strip, native Back handling.
- Growth-photo upload: native Photo Picker (zero storage permissions), preview,
  date/observation entry, bounded queue (1–2 workers), per-item states,
  retry/backoff, cancellation, partial-failure isolation, duplicate-safe
  metadata, single-decode/two-encode preparation with deterministic bitmap
  recycling.
- Owner management: edit plant (full field set + unsaved-change guard), add
  plant, log care (web `addCare` semantics incl. derived next-check).

## 2. Web features without Android parity (honest list)

AI review UI, Telegram ingestion/share, ChatGPT share bridge, cloud backup
export/import, grow-zone management UI, location photos editing, base-photo
hide/purge administration, patch notes, alias management. (Deliberate v1 scope;
all preserved on web.)

## 3. Verification results

- Builds: `:app:assembleDebug` green (AGP 9.1.1 / Kotlin 2.2.10 / Gradle 9.3.1).
- JVM tests: 12/12 green (`PhotoUploaderTest` ×6, `PlantWriterTest` ×6),
  exit-code captured.
- Emulator (AVD Resizable_Experimental): install/launch green; 55 real
  specimens; details/timeline render real rows; cover fallback fixed; Back
  fixed; visitor sees zero owner UI. Screenshots in `docs/baseline/android-*`.
- Defects found & fixed during verification: missing BackHandler, queue
  cancellation-reset bug, bundled-photo cover gap, v47 queue clobber (web).

## 4. Auth & data consistency

See `data-consistency-evidence.md` (exact field-level matches). Writes use the
identical `plants`/`care_log`/`plant_photos` contracts as web.

## 5. Photo upload & performance measurements

- Web: `docs/perf/egress-media-report.md` (decode ops halved 2→1 per photo;
  caching verified; no unmeasured CPU claims).
- Android: single decode → two encodes (mirrors v5.0.0); bounded concurrency
  unit-tested; heap/bitmap recycling deterministic. On-device thermal = OPEN.

## 6. Physical Fold8 acceptance still required (OPEN)

Owner-gated: exact-APK install approval → bounded upload/thermal session →
physical heat + upload UX acceptance. Nothing installed without approval.

## 7. Supabase changes

NONE. No schema, RLS, bucket, credential, function or record changes.

## 8. Exact APK candidate identity (debug DEV candidate)

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| SHA-256 | see `docs/handover/apk-identity.txt` (generated at packaging) |
| Package | `com.jasper.plantroom.dev` (release id reserved: `com.jasper.plantroom`) |
| Version | 1 / `0.1.0-dev` |
| min/target/compile | 28 / 37 / 37 |
| Permissions | `INTERNET` only |
| Signer | Android Debug (`c522e3de…cdaf`) — separate from Guren Mobile |
| Release signing | env-driven (`PLANTROOM_ANDROID_KEYSTORE[_PASSWORD]`, alias
`plantroom-v1`), owner-held; production release identity stays separate |

## 9. Git checkpoints

`d2dc0fd` v5.0.0 media → `6ec4814`+`7a56c17`+`24e6fad` Noir Édition →
`427f837` queue-clobber fix → `2a0ef06`+`31a3cf3` measurements →
`68358e2`→`17a0fb0` Android foundation → `c3b7122` details/timeline →
`e6a3fcb` picker/upload → `eb35fbc` owner management → `860c3e3` handover docs.

## 10. Guren Core integration handover

`guren-integration-contract.md` — **QUEUED / NOT STARTED** (separate HQ
milestone; Codex owns the adapter). Legacy AI: preserved per
`legacy-ai-audit.md`; no deletions or disabling.

## 11. Smallest owner test plan → installed PRODUCT GREEN

1. Approve the exact APK SHA-256 (8) → I install on Fold8 (additive).
2. Sign in on the app with your Plant Room account.
3. Upload 5–10 real growth photos on Wi-Fi; watch per-photo states; try
   airplane-mode mid-batch (retry path); confirm photos appear on the website.
4. Log one care event on Android; confirm the website shows it.
5. Edit one plant field on Android; confirm on website (and vice versa).
6. Fold/unfold during browsing and during an upload; confirm state survives.
7. During a larger batch (~20 photos), note device warmth; physical thermal
   verdict is yours (the heat gate stays OPEN until you say otherwise).
8. Accept or report defects → we close the milestone and return to
   maintenance-only; Guren integration stays QUEUED.

## Rollback

- Web: `dev/premium-revamp-h` is unmerged; production Pages still serves the
  accepted site. Rollback = don't merge (or revert the merge commit).
- Android: `adb uninstall com.jasper.plantroom.dev` removes only the dev app;
  no user data of other apps is touched. No Play deployment exists to roll back.
