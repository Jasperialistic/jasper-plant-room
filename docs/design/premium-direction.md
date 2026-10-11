# Plant Room premium design language — Direction H "Noir Édition" (LOCKED)

Status: owner-selected (11 Oct 2026). Derived from moodboard review:
Direction E (Apple-style tactile components) × Direction F (fashion-noir palette),
with owner typography guidance: **premium serif/sans mix — elegant display serif,
clean sans UI, no cursive/script, highly readable**.

This document is the single source of truth for the premium revamp (Graph D/E/F/G).
Implementation must follow these tokens; do not invent competing palettes.

## Palette (from Direction F)

| Token | Hex | Role |
|---|---|---|
| `--pr-noir` | `#080808` | Page background |
| `--pr-espresso` | `#1C1915` | Secondary surfaces, inputs |
| `--pr-card-top` | `#181512` | Card gradient top |
| `--pr-card-bottom` | `#100E0B` | Card gradient bottom |
| `--pr-ivory` | `#F4F1EC` | Primary text |
| `--pr-muted` | `#9A948A` | Secondary text |
| `--pr-champagne` | `#C9B18A` | Accent, labels, primary actions |
| `--pr-champagne-hi` | `#E7D6B4` | Accent highlight, hover |
| `--pr-graphite` | `#221D17` | Tertiary surface |

Warm-noir family. No purple/blue gradients, no neon, no cold greys.

## Typography (premium serif/sans mix)

- Display serif: `Bodoni Moda` (upright only — never cursive/italic script) for
  page titles, hero headlines and plant names. High-contrast fashion-house
  character; weights 400–500, tight leading, normal tracking.
- Interface sans: `Inter` for buttons, forms, navigation, body copy, metadata.
- Scientific/cultivar names render as **letterspaced uppercase Inter labels**
  (0.18–0.22em tracking, 600 weight, champagne) beneath the serif display name.
- Labels/metadata: uppercase Inter, 0.16–0.24em tracking, 700 weight, muted/champagne.
- This pairing is the identity: do not collapse it to a single family (an all-sans
  look reads generic/"vibe-coded"), and do not reintroduce italic script.
- Contrast: ivory `#F4F1EC` on noir `#080808` (AAA); muted `#9A948A` for secondary
  only at ≥13px.

## Depth language (from Direction E)

Every interactive/raised surface is built physically, never flat:

- Cards: 22px radius, `linear-gradient(180deg, card-top, card-bottom)`,
  1px rim `rgba(244,241,236,.09)`, multi-layer shadow:
  `0 26px 52px rgba(0,0,0,.55), 0 6px 14px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.13)`.
- Buttons: pill (999px), gradient fill + inset top highlight + deep drop shadow.
  - Primary: champagne gradient `#E7D6B4 → #C9B18A 55% → #AE946B`, dark label `#171108`.
  - Secondary: espresso gradient `#2A251E → #171410`, ivory label.
  - Glass: `rgba(244,241,236,.07)` fill, faint rim, soft inner highlight.
- Inputs: soft inset shadow (`inset 0 2px 6px rgba(0,0,0,.5)`), 14px radius.
- Photos: 15–18px radius, deep ambient shadow, subtle top gloss overlay.
- Chips/pills: champagne tinted glass with rim + inner highlight.

## Headers & background atmosphere

- **Owner photography is CONTENT only** (specimen cards, galleries, profiles) —
  never used as background or decorative imagery.
- **Headers and backgrounds use GENERATED botanical artwork**: faint translucent
  leaf silhouettes and line-art in the champagne/espresso/emerald palette.
  Wallpaper-clean, elegant, explicitly **not photorealistic**. Motif family:
  **Anthurium hearts (crystallinum / warocqueanum) with prominent venation**,
  Monstera split-leaves, Alocasia arrowheads. Vector SVG assets
  (`img/art/header-garden.svg`, `banner-frond.svg`, `wallpaper-leaves.svg`).
- **Composition is symmetric and structural — never scattered wallpaper.**
  Motifs are arranged as mirrored left/right clusters, balanced pairs and edge
  frames that echo the UI grid, with clean centers for content. No random
  floral-repeat pattern ("grandmother wallpaper") anywhere.
- **Headers are image-wrapped, never bare text on flat color.** Page mastheads
  and major section headers layer the generated botanical art with dark gradient
  veils (top-dark → bottom-near-black) plus a warm champagne radial light; serif
  titles sit over the artwork with a soft text shadow for legibility.
- Section banners: ~158px tall, 18px radius, left-weighted veil
  (`rgba(8,8,8,.88)` → transparent) so titles stay readable at left.
- **Page background is atmospheric, not flat:** the generated leaf wallpaper
  layer sits behind all content with champagne/emerald radial glows and a bottom
  darkening gradient. No empty developer-grey surfaces anywhere.
- Artwork veils must keep the botanical silhouettes identifiable — subtle,
  never noisy; opacity tuned for text legibility (AAA contrast on titles).

## Layout & spacing

- 8px spacing rhythm; section gaps 28–34px; card padding 10/16px.
- Max content width 1240px (web); mobile gutters 14–16px with safe-area insets.
- Photography-first: images dominate cards and heroes; type supports, never competes.

## Mobile templates

Two existing templates are preserved and reskinned, not merged:

1. Web (desktop) template — `index.html` core views.
2. Mobile template — `v36-mobile-gallery.js`, `v37-mobile-plant-screen.js`,
   `v47-mobile-navigation.js` (bottom sheets, fixed bottom action bar, safe areas).

Owner's daily driver is the **iPhone home-screen PWA shortcut**: treat the mobile
web template as the primary mobile surface (iOS-native spacing, touch targets ≥44px).

Future Android APK (Node K–P) must adapt to **Samsung Fold8**: cover-screen
single-column and unfolded inner-screen two-pane layouts, state preserved
across fold transitions. It inherits this palette and depth language but uses
native Android interaction patterns (Material motion, system back).

## Component inventory to restyle (Graph E/F)

Navigation/topbar, plant cards, collection grid, plant profile hero, growth
timeline/gallery, upload queue states (queued/uploading/confirming/retrying/
complete/failed), care log, forms & editors, dialogs/sheets, buttons (all three
levels), inputs/selects/textarea, chips/badges, empty/loading/error states,
focus-visible rings (champagne), reduced-motion fallbacks.

## Guardrails

- No functionality changes in the restyle; data contracts untouched.
- Do not weaken RLS, bucket policies or auth boundaries.
- Do not degrade photo fidelity or delete originals.
- Performance is part of premium: no new persistent blur/animation costs on
  mobile; respect `prefers-reduced-motion`.
- Legacy AI controls (Graph "AI consolidation") are demoted to a clearly
  labelled secondary settings area, never silently disabled.
