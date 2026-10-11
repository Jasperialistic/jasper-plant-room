# Plant Room legacy AI / ChatGPT bridge — audit record

Status: **PRESERVE EVERYTHING**. This is an inventory, not a removal. No table,
row, credential, function or working feature was deleted or disabled. Retirement
of any legacy AI component is gated on the future Guren Core connection being
installed AND owner-accepted (separate HQ milestone).

## Inventory (production Supabase vslyrabiqgbgbcqgooxb)

| Component | Type | Assessment |
|---|---|---|
| `plant_ai_settings` | table | Active configuration for AI review behaviour. Keep. |
| `plant_ai_reviews` | table | Historical AI review records — personal data. Keep permanently. |
| `plant_ai_evidence` | table | Evidence images/rows behind reviews. Keep permanently. |
| `plant_ai_monthly_usage` | table | Usage accounting. Keep (harmless, historical). |
| `chatgpt_bridge_selection` | table | Bridge state for the ChatGPT visual evidence flow. Keep until replacement accepted. |
| `plant_ai_review` / `plant_ai_review_safe` | Edge Functions | Review entry points (`_safe` variant = restricted). Authorization: inspect before any future change; do not alter JWT settings. |
| `v36-ai-review.js` | web UI | AI review panel. Currently reachable from owner UI. Keep working; future: move to clearly-labelled secondary settings area (Node 2 of the AI-consolidation brief) — no silent disabling. |
| `v35-telegram-reference-packet.js`, `v28-chatgpt-share.js`, `v31/32/33` Telegram | integrations | Telegram ingestion/share and ChatGPT share flows. Working owner features. Keep. |
| `v36-ai-review.js` evidence JPEG path | client code | Canvas-based evidence conversion — used by the review flow only. |

## Observations

- The AI review surface is owner-facing and functional; it is NOT part of the
  core collection/photo workflows, so the Android v1 app deliberately does not
  port it (listed as a web-only feature in the handover).
- Noir Édition web keeps these controls working but out of the primary flow;
  they are secondary owner utilities, matching the "no silent disabling" rule.
- No new AI provider, chatbot or second intelligence layer has been added.

## Retirement dependency chain (for the future milestone)

1. Guren Core capability adapter (Codex) implements the contract in
   `guren-integration-contract.md` and passes its contract tests.
2. Owner accepts the Guren-connected replacement for a given legacy function.
3. Only then may the corresponding legacy component be removed, in its own
   verified cleanup commit, never mixed with feature work.
4. `plant_ai_*` historical data is never deleted, regardless of code retirement.
