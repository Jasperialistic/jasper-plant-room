# Guren Core ↔ Plant Room capability contract (QUEUED — NOT STARTED)

Status: **QUEUED / NOT STARTED**. A future Guren Core adapter (owned by Codex)
will implement this contract after a separate HQ milestone authorization.
Nothing here is implemented, integrated or installed. This document is the
handover artifact only.

Scope: the smallest reusable, authenticated capabilities a Guren assistant needs
to help the owner with their plant collection. One data authority: the existing
Plant Room Supabase project `vslyrabiqgbgbcqgooxb`. No second backend, no
duplicate inventory, no sync server.

## Authentication & authorization

- Owner identity: existing Supabase Auth (email/password). The Guren adapter
  acts as an owner-scoped client after explicit owner sign-in; it never holds
  service-role credentials and never bypasses RLS.
- All reads respect existing RLS (public collection reads; owner-only private
  fields). All writes require the owner session and fail closed otherwise.
- Destructive actions (deleting photos/records, permanent delete) REQUIRE
  explicit per-action owner confirmation through Guren before execution; the
  adapter must implement propose→confirm, never silent execution.

## Capabilities — READ

| Capability | Source | Notes |
|---|---|---|
| `plants.list` / `plants.search(query)` | `plants` | name/group/location fields; public-read |
| `plants.get(id)` | `plants` | full profile incl. care fields |
| `photos.growth(plantId)` | `plant_photos` where `kind='growth'` | chronological (`photo_date` asc) |
| `photos.gallery(plantId)` | `plant_photos` + `plant_base_photos` | web-identical ordering rules |
| `care.history(plantId)` | `care_log` | owner-scoped |
| `notes.get(plantId)` | `plants.notes`, `plants.check_rule` | owner observations |

## Capabilities — WRITE (owner session required)

| Capability | Target | Constraints |
|---|---|---|
| `plants.update(id, fields)` | `plants` | field meanings identical to web editor; `plants.check_days`/`next_check` validated |
| `photos.addGrowth(plantId, image, date, note)` | `plant-media` + `plant_photos` | see upload constraints; idempotent per storage path |
| `care.record(plantId, action, details)` | `care_log` + `plants` | web `addCare` semantics incl. derived `next_check` |
| `notes.update(id, notes)` | `plants.notes` | free text |
| `sensitive.propose/confirm` | any write above | two-step confirmation for destructive or bulk changes |

## Image-upload constraints

- Bucket `plant-media` (public read), 15 MB per-file limit; originals are never
  overwritten, deleted or recompressed in place.
- Create-only storage paths: `{userId}/{plantId}/{gallery|growth}/{uuid}-{safeName}`;
  derivatives: `.../thumbs/{...}.thumb.jpg` (640px, JPEG q72).
- Uploads set `Cache-Control: max-age=31536000`; CDN/HTTP caching verified
  working (see `docs/perf/egress-media-report.md`).
- Metadata idempotency: before insert, check `plant_photos.storage_path`;
  an existing path means the record already exists.

## Data models

Canonical schema lives in the production database; authoritative field meanings
are documented in `index.html` (`rowToPlant`/`plantToRow`), mirrored by
`android/app/src/main/java/com/jasper/plantroom/net/` data classes and by the
web tests (`tests/*.test.mjs`). Do not invent fields.

## Deep-link contracts (stable, ready to use)

- Web: `https://jasperialistic.github.io/jasper-plant-room/#plant/{legacyId}`
  (collection anchor style used by the current site).
- Android (registered in a future milestone): `plantroom://plant/{legacyId}` and
  `https://jasperialistic.github.io/jasper-plant-room/app/plant/{legacyId}`.
- "Ask Guren" handoff (future): pass `plantId`, `legacyId`, `name` and a
  read-only context blob; Plant Room must work fully when Guren is offline.

## Contract tests (for the adapter's milestone)

1. `plants.list` returns the same rows/fields as the web collection query.
2. `photos.growth` ordering matches the web timeline exactly.
3. `plants.update` as owner succeeds; as anonymous fails (RLS).
4. `photos.addGrowth` creates exactly one `plant_photos` row per storage path
   across retries (idempotency).
5. `care.record` produces the same `care_log` + `plants` update shape as web
   `addCare`, including derived `next_check`.
6. Destructive actions without explicit confirmation are refused.

## Known limitations / open gates

- Real end-to-end write testing on both frontends remains owner-credential
  gated (OPEN). Everything above is source-verified and unit/contract tested.
- Android v1 intentionally excludes: AI review UI, Telegram flows, backup
  export, grow-zone editing UI (web has them; port later if wanted).
- No production schema, RLS, bucket policy or credential changes are part of
  this contract, now or in the adapter milestone, without separate approval.
