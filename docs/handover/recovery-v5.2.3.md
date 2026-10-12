# Plant Room recovery release — 12 October 2026

The owner requested release after focused checks and will perform daily-use testing personally. Owner acceptance remains open.

## Website

- Release: v5.2.3, existing GitHub Pages production site.
- Noir Edition design, owner Dashboard Still moist / Watered / Custom controls and existing integrations are preserved.
- Fixed the stale `brandSubtitle` access that aborted boot after the header was removed. This exposed 44 bundled fallback plants even though Supabase held 55 canonical plants.
- Resolved `base:spanish-moss-big` through `legacy_id` to the existing cloud UUID. No identifiers were rewritten.
- Care writes retain a retry ID in browser session storage until the care row and schedule are both verified. Retries after partial saves or reloads reuse that ID. Concurrent duplicate taps share the operation; other actions on the same plant wait.
- Care requests have bounded timeouts; buttons recover in `finally`. SQL NULL remains the no-next-check value. A refresh failure after verified writes is reported separately.
- Corrected the visible version, missing recovery notes and release ordering. Cache keys and deployment wiring are aligned.
- Focused web suite: 32 passed, 0 failed, exit 0. Inline script parsing and changed JS syntax checks passed. Earlier public browser smoke verified 55 plants, search, Spanish Moss profile and full-photo viewer. Authenticated production writes were deliberately not simulated with real records.

## Android candidate

- Native Kotlin/Compose, package `com.jasper.plantroom.dev`, versionCode 1, versionName `0.1.0-dev`.
- Candidate: `android/app/build/outputs/apk/debug/app-debug.apk`.
- SHA-256: `6903dfd8666133180ca5797e229f0ac7e3e3140f7b5786da3faccf1a1cce3f57`.
- Signer certificate SHA-256: `c522e3dea053eb1fedba2c3044987a59a586fb4c3b6c3f650e63766ff8e2cdaf` (Android Debug; matches the installed baseline).
- Permissions: INTERNET plus the generated application-scoped signature permission `com.jasper.plantroom.dev.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; no sensitive permission addition.
- Centralized quick/custom care into one verified two-write coordinator. Pending retry IDs survive app restarts. Synthetic IDs are rejected before transport; timeout/cancellation releases the action lock. Edit updates require a returned matching row.
- Fixed growth retries generating a new random storage path on every attempt. Paths and completed upload stages remain stable, metadata IDs are deterministic per path, completed queue items cannot be enqueued twice, and active cancellation can resume safely.
- Wrapped care/upload controls to fit narrow dialogs and restored upload busy state through `finally`.
- `:app:testDebugUnitTest :app:assembleDebug`: BUILD SUCCESSFUL, exit 0. 21 tests: care coordinator 6, photo queue 8, plant rules 7.
- Installation is pending: `R5GL80730EF` was verified as SM-F971B on 11 October, but is absent from ADB on 12 October. No uninstall, data clearing or device reset was attempted.
- Physical authenticated care/photo writes, fold lifecycle and photo-batch heat remain owner tests.

## Data and rollback

- No Supabase schema, RLS, functions, records or storage objects were changed during recovery.
- Read-only inventory: 55 plants, 820 care entries, 129 uploaded photo rows, 160 base-photo rows and 10 growing zones. Owner-only care policies were inspected; public care reads were denied.
- The failing synthetic-ID insert cannot create a UUID care row; no destructive correction was made. Two similar earlier Metallic Blue check entries were observed and preserved.
- Web baseline before recovery: `e129a0d64e10d9519e45cce2ddbfd3236639a810`; boot-corrected intermediate: `ed00348d0bc62016ee26ccc5936ee071f776b062`.
- Installed APK baseline SHA-256: `6a3ba0dcb1d1e76ea6b140f8d984dfabe4e3e4a6c1c793182f8a42c3bb73bcdf`. Preserved at `android/app/build/outputs/apk/debug/installed-baseline.apk` (ignored build output).
- Rollback uses source reversion and a compatible in-place DEV APK update, retaining current Supabase records and application data.
- Original photos, historical derivatives and the previous 10-photo backfill are preserved. Guren Core integration remains queued / not started.

## Owner checks

Use the signed-in website for Still moist / Watered / Custom, editing and a real photo batch. After the Fold8 is reconnected and the compatible update is installed, check native browsing, care logging, growth uploads and cross-device refresh. Judge photo-batch warmth physically; no thermal resolution is claimed.
