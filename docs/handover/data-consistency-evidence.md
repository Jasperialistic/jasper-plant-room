# Web ↔ Android shared-authority consistency evidence (Node 8)

Method: all three views read the same production Supabase project
(`vslyrabiqgbgbcqgooxb`) through the same RLS contracts. Compared: the web app
(Playwright session, this milestone), the Android app (emulator, uiautomator
dumps), and direct REST reads (ground truth).

## Collection

| Check | Web | Android | REST |
|---|---|---|---|
| Specimen count | 55 | "55 specimens" | 55 rows |
| Sample names | Hoya krohniana ‘Silver’ #2, Aglaonema tri-color, Money tree (2) | identical names rendered | identical |

## Field-level sample (Hoya krohniana ‘Silver’ #2)

| Field | Android render | REST ground truth | Match |
|---|---|---|---|
| light | `★ · PPFD 50–70 µmol/m²/s` | same | ✓ |
| environment | `Indoor overhead shelf` | same | ✓ |
| pot | `10 × 12 cm · Original nursery pot` (= `pot` + `pot_type`) | `10 × 12 cm` | ✓ |
| watering_mode | `Drain-through` | same | ✓ |

## Growth chronology (Anthurium Vittarifolium = `ba72346a-…`)

REST rows in `photo_date` order:
`gallery 2026-08-19 · growth 2026-08-19 · growth 2026-08-19 · growth 2026-08-19 ·
gallery 2026-08-20 · growth 2026-09-01`

Android detail screen rendered the growth timeline showing `2026-09-01` and the
collection photos strip showing `2026-08-20` (cloud) and bundled base photos —
ordering and dates identical to the web's comparator (`sort_order`, then
`photo_date`).

## Authorization consistency

- Anonymous: Android shows zero owner UI (verified: 0 EDIT / 0 ADD GROWTH PHOTOS
  buttons on detail as visitor); web shows public visitor mode.
- Owner writes: both frontends use the same `plants`/`care_log`/`plant_photos`
  contracts (code-level field parity: `PlantUpdate`/`CareLogInsert` mirror
  `plantToRow`/`addCare`). Real write E2E remains owner-gated (OPEN).

## Interrupted-operations safety

- Upload queue is duplicate-safe per `storage_path` (unit-tested; same rule as
  web v4.42 queue) → no duplicate records after retries/interruptions.
