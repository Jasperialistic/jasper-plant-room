# Plant Room Android maintenance — owner accepted, closed (12 October 2026)

## Owner acceptance

**PASS.** The owner accepted the Android-only maintenance: Grid navigation now
opens plant detail exactly like Cards, and the photo viewer offers native
Copy image / Save to Gallery / Share on long-press.

- Accepted installed APK SHA-256: `f06c1089bffd96b8a124dd7f99fe01f8fef4205394bb693a44311f93072f3761`
- Accepted maintenance branch: `dev/android-maintenance-2026-10-12`
- Accepted commits: `076a9db` (Grid tile opens plant detail exactly like Cards), `47fb731` (photo viewer long-press actions)
- Merged into `main` as a fast-forward `04326f1..47fb731`. Android-only diff (10 files under `android/`); no website file, Supabase object or Guren Core file changed. No deploy workflow triggered (all four workflows are paths-filtered away from `android/`).

## Installed identity (Fold8 R5GL80730EF)

- Package `com.jasper.plantroom.dev`, versionCode 1, versionName `0.1.0-dev` (unchanged)
- Signer: `CN=Android Debug`, certificate SHA-256 `c522e3dea053eb1fedba2c3044987a59a586fb4c3b6c3f650e63766ff8e2cdaf` (same signing identity as every prior DEV build)
- Permissions unchanged: `INTERNET` plus the generated dynamic-receiver permission; no storage or gallery grant
- Installed in place (data preserved, `firstInstallTime` 2026-10-11 15:29:19); installed bytes verified equal to the delivered APK by pull-back hash

## Rollback

- Source reversion: revert `076a9db` and `47fb731` on `main`, rebuild the DEV APK, update in place (same package and signer; no uninstall or data loss).
- Byte rollback: reinstall the previous verified candidate `6903dfd8666133180ca5797e229f0ac7e3e3140f7b5786da3faccf1a1cce3f57` (v5.2.3 recovery build, preserved as `android/app/build/outputs/apk/debug/app-debug.apk` at the recovery baseline) or the earlier baseline `6a3ba0dcb1d1e76ea6b140f8d984dfabe4e3e4a6c1c793182f8a42c3bb73bcdf` (`installed-baseline.apk`).
- Website and Supabase are untouched by this work; no rollback needed there.

## Notes

- Feature behavior: long-press downloads the original full-resolution bytes only on demand and writes them untouched (resolution and EXIF orientation preserved). Save lands in Gallery › Pictures/PlantRoom (API 29+) or the app folder (API 28); Copy and Share use a cache-only FileProvider. Supabase originals are only ever read.
- A saved test photograph from verification remains in the owner's Gallery (`Pictures/PlantRoom/photo-5290e21d-d1bc-45e5-afaa-8cbf710ce4.jpg`, the owner's own Aglaonema growth photo). Deliberately left untouched at owner instruction.
- Unit suite at merge: 31 tests passed (`PlantSelectionTest`, `ImageActionsTest` plus the existing coordinator/uploader/writer tests).
- Plant Room returns to MAINTENANCE ONLY. Guren Core integration remains queued and untouched.
