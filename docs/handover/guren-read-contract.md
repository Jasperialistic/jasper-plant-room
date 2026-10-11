# Guren Core × Plant Room — READ CONTRACT v1 (machine-readable schema alongside: guren-read-contract.json)

Status: **READY FOR FUTURE INTEGRATION — QUEUED, NOT STARTED.** No Guren Core code was
touched. Codex continues Guren Mobile/Phase 4 independently. This document defines the
seam so a future authorized integration can read Plant Room completely and correctly.

## 1. Single authority

One backend: Supabase project `vslyrabiqgbgbcqgooxb` (ap-southeast-1, PostgreSQL 17).
Website (https://jasperialistic.github.io/jasper-plant-room/), the native Android app
(`com.jasper.plantroom.dev`) and a future Guren Core adapter MUST all read this one model.
No second backend, no derived local stores.

Base REST endpoint: `https://vslyrabiqgbgbcqgooxb.supabase.co/rest/v1/`
Auth header: `apikey: <anon publishable key>` + `Authorization: Bearer <key or user JWT>`.
The anon key is public by design (RLS enforces access). Service-role keys must NEVER be
used by any client or worker.

## 2. Tables and exact read shapes

### plants (public read)
| field | type | notes |
|---|---|---|
| id | uuid | primary key |
| name | text | display name |
| plant_group | text? | e.g. "Alocasia" (JS: `group`) |
| location | text? | grow-zone NAME (join key to grow_zones.name) |
| light, environment | text? | |
| pot, pot_type, outer_pot, medium | text? | |
| watering_mode | text? | JS `mode`; reservoir detection input |
| last_care, last_action | date?, text? | updated by every care action |
| next_check | date? | scheduling input for statusOf |
| check_days | int? | watering scheduling horizon |
| check_rule | text? | human care rule |
| notes, confidence | text? | |

### care_log (OWNER read only — anon is denied, verified 2026-10-11: `42501 permission denied`)
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | owner |
| plant_id | uuid | → plants.id |
| care_date | date | |
| plant_name, action, details, location | text? | denormalised snapshot |

### plant_photos (public read) — growth + gallery rows
id, plant_id, kind ("growth"/"gallery"), storage_path, thumbnail_path, photo_date, note,
sort_order, is_thumbnail.

### plant_base_photos (public read) — bundled legacy photos
id, plant_id, asset_path (relative to the site host), sort_order, is_thumbnail, photo_date,
hidden, purged.

### grow_zones (public read)
id, name (unique label used by plants.location), details, humidity, par, grow_lights,
notes, photo_asset_path (full URL), icon, sort_order.

## 3. Derived semantics — MUST be replicated exactly (web index.html:1653-1655)

```
isReservoir(plant) = watering_mode contains "reservoir" (case-insensitive)
statusOf(plant):
  reservoir -> "reservoir"
  no next_check -> "none"
  days(today -> next_check) < 0  -> "overdue"
  == 0 -> "today"
  >  0 -> "upcoming"
labels: Overdue / Check today / Reservoir / Upcoming
```

Care action write contract (web `addCare`, mirrored by the app's `PlantRepository.logCare`):
insert care_log {user_id, plant_id, care_date=today, plant_name, action, details, location}
then update plants {last_care=today, last_action=action, next_check}.
Scheduling rules (`saveCustomLog`): action "Watered" → next_check = today + check_days;
action "Checked — still moist" → next_check = today + 1 day; explicit next_check wins.
Action vocabulary: "Checked — still moist", "Watered", "Reservoir topped up",
"Reservoir changed", "Flushed", "Repotted", "Trimmed", "Fertilised", "Custom".

## 4. Storage (public read)

Bucket `plant-media` under `/storage/v1/object/public/plant-media/`.
Original: `<uid>/<plant-id>/photo-<ts>.jpg` ; thumbnail derivative:
`<uid>/<plant-id>/thumbs/photo-<ts>.jpg`. List/grid surfaces MUST use `/thumbs/`
(verified CDN: `public, max-age=31536000`, CF HIT). Originals are personal records —
never recompress or delete.

## 5. Recommended future Guren adapter (not built)

1. Read-only REST client over the same anon key for public tables; owner-scoped reads
   (care_log) require a user JWT obtained through the owner's own sign-in — Guren must
   never embed or mint owner credentials.
2. Use `guren-read-contract.json` as the machine schema. Field renames are BREAKING and
   require a contract version bump.
3. Status and care rules must come from this contract, not re-derivation.
4. Suggested read surface for Guren answers: plants (n=55), statusOf counts, care_log
   recency, growth timeline per plant (plant_photos kind=growth ordered by photo_date).
5. Write actions (if ever authorised) go through the same addCare contract so web, app
   and Guren stay consistent.

## 6. Verified facts (2026-10-11)

- 55 specimen records; 13 groups; 41 gallery + 88 growth photos (app stats, live).
- care_log SELECT denied to anon (42501) — owner-only, by design.
- App quick-care write verified live: "Checked — still moist" logged for
  Alocasia Heterophylla ‘Metallic Blue’ (2026-10-11), next_check 2026-10-12 (test entry).
- Widget reads the same model read-only.
