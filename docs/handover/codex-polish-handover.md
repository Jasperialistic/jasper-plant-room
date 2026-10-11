# Plant Room — Codex Polish Handover (from MiMo/Hermes, 2026-10-11)

You are taking over **polish** of Plant Room (Guren's Garden). Read this whole file first.
This is a self-contained handover: repo state, contracts, verified behaviour, commands,
pitfalls, and what remains. The owner's standing rule: **the mobile web is the reference —
the native app mirrors it; "keep the app looking the same as the website".**

---

## 1. Repository & deployment

- Repo: `Jasperialistic/jasper-plant-room` (GitHub, public)
- Local checkout: `C:\Users\jaspe\.codex\.chatgpt-projects\g-p-6a8583429bc88191886611efbf6c7161\plant-app`
- Work branch: `dev/premium-revamp-h` — HEAD `ea611a9` (chain back through `211435a`,
  `4f69cb1`, `c345106`, `64c6aca`, `3503f51`, `9b559cf`, `12ab017`, `3503f51`… to `d1abf59`)
- `main` = live website. Deploy = merge `dev/premium-revamp-h` → `main` → push.
  GitHub Pages serves `main` root (workflow `pwa-shell-deploy.yml` may append a
  "Refresh Plant Room PWA shell" commit; direct pushes use `[skip ci]`).
- Live: https://jasperialistic.github.io/jasper-plant-room/ — currently Noir Édition v5.2.0.

## 2. Products

| Product | Where | State |
|---|---|---|
| Website / PWA | `index.html` + versioned patch stack `v25…v51-*.js` | LIVE, owner visual PASS (Noir Édition) |
| Android app | `android/` — package `com.jasper.plantroom.dev`, vName `0.1.0-dev` | Dev APK on owner's Fold8, feature-complete mirror |
| Home widget | `widget/PlantRoomWidget.kt` (RemoteViews, no deps) | Registered; owner adds from launcher |
| Supabase | `vslyrabiqgbgbcqgooxb` (ap-southeast-1) | One shared DB; app = web = future Guren |

## 3. Build & test commands (Windows, bash shell)

```bash
# Web gate (19 tests) — run explicit files, NOT the tests/ dir (dir mode misbehaves):
node --test tests/egress-audit.test.mjs tests/media-efficiency.test.mjs tests/premium-design.test.mjs

# Android:
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="C:/Users/jaspe/AppData/Local/Android/Sdk"
cd android && ./gradlew :app:assembleDebug          # APK: app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:testDebugUnitTest                     # JVM tests

# Install to Fold8 (device serial R5GL80730EF; cover display 1248x1972, inner ~2448x1848):
"$ANDROID_HOME/platform-tools/adb.exe" -s R5GL80730EF install -r app/build/outputs/apk/debug/app-debug.apk
```

Toolchain (pinned, do not casually upgrade): Gradle 9.3.1 wrapper, AGP 9.1.1,
Kotlin 2.2.10, compileSdk 37 / minSdk 28, JDK 17 (Android Studio `jbr`).
**Pitfall:** supabase-kt 3.6.0 + ktor 3.4.3 are pinned (3.8.x needs Kotlin 2.4 metadata);
`kotlin-stdlib` is force-pinned to 2.3.21 in `build.gradle.kts` (Coil drags 2.4.10).
Do not add dependencies without owner approval.

## 4. Architecture — web (source of truth)

- `index.html`: SPA, giant inline CSS + ~1,860 lines. Key functions to mirror:
  - `statusOf/isReservoir/statusLabel` (≈line 1653) — care status rules
  - `addCare` (≈1797) + `saveCustomLog` (≈1801) — care writes + scheduling
  - `renderStats` (≈1741), `renderQueue` (≈1746), `renderPlants` (≈1753), `photo()` (≈1668)
- `v47-mobile-navigation.js`: **#mobileAppNav** bottom bar (Dashboard · Plants · ＋ · Zones ·
  More), Quick action sheet (＋ Add Plant / Growth Photo / Care Entry), More sheet
  (Care log / To profile), `renderSpeciesCounters` (#v414SpeciesStats, ≈808),
  `renderGrowthUpdateAge` (≈870 — "Last growth update · Today/Yesterday/N days ago"),
  persisted plant views (list/compact/large).
- `v51-noir-premium.js`: the Noir Édition design layer (palette + typography). NOTE: it is
  a fragile template-literal style block; any edit must keep `node --check` green AND be
  verified in a real browser (one broken line once killed the whole theme silently).
- Service worker `service-worker.js`: cache `jasper-plant-room-shell-v5.2.0` (bump on shell
  changes to purge stale clients), photo cache `jasper-plant-room-photos-v1`, navigation
  network-first, assets cache-first. Supabase traffic never cached.

## 5. Architecture — Android app (mirror of the web)

```
android/app/src/main/java/com/jasper/plantroom/
  MainActivity.kt        shell: hero + TODAY card, species strip, dashboard/plants/log/zones/profile
  PlantDetailScreen.kt   profile: two-page spread on wide, growth/collection photos
  ui/WebParity.kt        web-metric components (cards, stats, queue rows, species strip, rules)
  ui/MobileNav.kt        bottom bar + Quick/More/PlantPicker sheets (web #mobileAppNav)
  ui/PhotoViewer.kt      full-screen viewer (one deck per plant, swipe + double-tap zoom)
  ui/PlantForms.kt       AddPlantSheet / CareLogSheet / GrowthUploadSheet / PlantEditSheet
  net/PlantRepository.kt Supabase client (lazy), read models, logCare(), coverUrl()
  net/PersistentSessionManager.kt  stay-logged-in owner session (SharedPreferences)
  widget/PlantRoomWidget.kt        home-screen quick view
```

- **Parity doctrine:** component metrics come from the web CSS verbatim (plant card: 4:3
  photo, 18px radius, `.chips{margin:13px 0}`, `.care-line` top border + 12px pad;
  `.stat` label 13px / value 31px; grid 3/2/1 columns at 900/620dp).
- **Fonts** (`res/font/`, OFL): `pr_bodoni` (display/numbers/names), `pr_inter` (UI),
  `pr_parisienne` (hero quote). Web's serif selector list = app's Bodoni mapping.
- **Artwork:** web `assets/art/*.svg`; app rasters in `res/drawable-nodpi/`
  (`pr_wallpaper.png` blurred @ .38 alpha, `pr_header.png`, `pr_leaf.png` account icon).
- **Dashboard quick actions** (owner's most-used): queue rows show exactly **Still moist** +
  **Watered** (owner explicitly removed Reservoir/＋). Writes mirror web `addCare`
  ("Checked — still moist" → next +1 day; "Watered" → next + check_days). Refresh is
  SILENT (`load(silent=true)`) — never blank the UI on a tap.
- **Persisted prefs:** `plantroom_prefs` SharedPreferences (plants grid/cards view mode).

## 6. Data contract (also for future Guren Core)

`docs/handover/guren-read-contract.md` + `.json` — exact table shapes (plants, care_log,
plant_photos, plant_base_photos, grow_zones), status/care rules, storage URL shapes,
access boundaries (care_log is OWNER-ONLY: anon SELECT = 42501, verified). Supabase anon
key is public by design (RLS enforces); never embed or mint owner credentials.

## 7. Verified this session (evidence in `docs/baseline/`)

- Web: 19/19 tests; live browser checks (v51 loads, tokens warm, fonts render).
- App on Fold8: owner session persists; species counter + growth-age line verified via
  uiautomator; quick-care write verified in logcat + DB semantics; photo viewer
  ("2 / 4" merged deck) + swipe after gesture fix; grid persistence across restart;
  bottom nav replaces top tabs; two quick buttons only; silent refresh (0 loading frames).
- Widget provider registered (`dumpsys appwidget`); APK debug-signed
  (`com.jasper.plantroom.dev`, INTERNET only, additive installs).

## 8. Known gaps / polish candidates (owner's call)

1. **Web ↔ app live updates**: shared DB but no Supabase Realtime — clients show changes on
   next fetch. Adding Realtime push or app pull-to-refresh is a candidate.
2. **Web plant views** are list/compact/large (v4.8, persisted) vs app Cards/Grid — could
   be harmonised to the web's three modes.
3. **"Custom" care entry** quick action exists on web (dialog with action/details/next) —
   app routes custom care via CareLogSheet instead.
4. Android **release signing** not set up (debug signer only; production id
   `com.jasper.plantroom` reserved). Photo-upload **thermal gate** on the real Fold8 is
   still OPEN (owner judges heat physically).
5. Layout-fit QA at exotic widths; any remaining wording the owner flags.

## 9. Hard constraints (from owner/HQ)

- Production data safety: no destructive photo ops, no test records without owner approval;
  care-log writes are REAL records (the owner uses them for watering schedules).
- Do not weaken RLS, make buckets public, embed credentials, or touch `Guren Core`
  (`C:\Users\jaspe\Documents\ChatGPT\Guren Core`) or its repo/session. Codex's Guren Core
  work is separate from this polish.
- Do not deploy to `main` without owner approval (owner reviews live first).
- Any new APK must report SHA-256 / package / signer / permissions before install; the
  owner approves exact bytes for the physical device.
- Web gate must be green (explicit test files, capture exit codes) before any web deploy.

## 10. Tooling pitfalls hit this session (save yourself the time)

- Playwright captures land in `C:\Users\jaspe\Documents\GurenCore-DevHermes\.playwright-mcp`
  (Guren Core worktree!) — move them out immediately, never commit there.
- `patch` tool fuzzy matching can mangle quoted strings — verify diffs; prefer exact
  anchors; `write_file` refuses overwrites it hasn't fully read (rm+write is the workaround).
- Git checkout warns LF→CRLF constantly — harmless.
- `grep -c` returning 0 exits 1 — don't chain blindly with `&&`.
- adb: use `-s R5GL80730EF`; `uiautomator` dumps only COMPOSED items (scroll first);
  the owner's phone has edge-back gestures — automated swipes must stay mid-screen.
- Edge headless (`msedge --headless=new --screenshot=... --default-background-color=00000000`)
  rasterises the brand SVGs exactly (ImageMagick's SVG renderer is not faithful).
