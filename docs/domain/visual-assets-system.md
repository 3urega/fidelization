# Visual Assets System

**Status:** **Implemented** [#49](https://github.com/3urega/fidelization/issues/49) (2026-06-11). Source: [`plan.md`](../../plan.md) at repo root.

## Objective

All loyalty **stamp progress** on customer cards must be generated dynamically using reusable SVG sprite assets. The UI must never depend on pre-rendered PNG/JPEG images for stamp slots.

Cards are built by combining:

- Empty sprite
- Filled sprite
- Reward sprite (last slot)

This allows unlimited stamp campaigns while maintaining a consistent design system. Tenant branding (`--tenant-primary`, theme tokens) tints sprites via CSS without per-tenant image files.

## Architecture

```text
stamp_campaign.visualTemplate = "coffee"
        ↓
public/assets/loyalty/coffee/{empty,filled,reward}.svg
        ↓
<LoyaltyProgress template="coffee" current={7} required={10} />
        ↓
Tarjeta de fidelización (LoyaltyCard · sellos)
```

**Scope note:** In product language the owner «diseña la promoción de la tarjeta» al crear una **campaña de sellos** (`/settings/stamps` → Campañas). Las promociones de texto Pro (`/settings/promotions`) quedan fuera de Phase J.

## Asset structure

```text
public/assets/loyalty/
  coffee/
    coffee-empty.svg
    coffee-filled.svg
    coffee-reward.svg
  croissant/
    croissant-empty.svg
    croissant-filled.svg
    croissant-reward.svg
  burger/
    burger-empty.svg
    burger-filled.svg
    burger-reward.svg
  pizza/
    pizza-empty.svg
    pizza-filled.svg
    pizza-reward.svg
  generic/
    generic-empty.svg
    generic-filled.svg
    generic-reward.svg
```

Future templates (documented, not required in J2 MVP): `beer`, `icecream`.

Each template implements exactly three states: `empty`, `filled`, `reward`.

**Implemented (Phase J2 — [#50](https://github.com/3urega/fidelization/issues/50)):**

- `public/assets/loyalty/{template}/*-{empty|filled|reward}.svg` — 5 templates × 3 states (15 files)
- [`loyaltyVisualTemplates.ts`](../src/app/_components/loyalty/loyaltyVisualTemplates.ts) — registry + `getStampSpriteUrl()`
- `npm run verify:loyalty-visual-assets`

## Card background sprite (`public/fondos.png`)

Single **2×2 PNG sprite** (1254×1254 px) with four café-themed backgrounds for the loyalty card shell. Display one quadrant via CSS — no separate image files per variant.

| Variant id | Quadrant | `background-position` (with `background-size: 200% 200%`) |
|------------|----------|-------------------------------------------------------------|
| `coffee-photo` | Imagen 1 — top-left | `0% 0%` |
| `coffee-sketch` | Imagen 2 — top-right | `100% 0%` |
| `coffee-pattern` | Imagen 3 — bottom-left | `0% 100%` |
| `coffee-minimal` | Imagen 4 — bottom-right | `100% 100%` |

**Implemented (Phase J2):**

- `src/app/_components/loyalty/loyaltyCardBackgrounds.ts` — registry + CSS helper
- `src/app/_components/loyalty/LoyaltyCardBackground.tsx` — wrapper + `LoyaltyCardBackgroundSwatch` for owner picker (J5)
- `LoyaltyCard` — optional `cardBackgroundVariant` on sellos section

**Data model (J4):** add `card_background_variant` on `stamp_campaigns` (enum above; default `coffee-photo`).

## Rendering rules

Example: `required = 10`, `current = 7`

Render slots 1–9 as stamp icons; slot 10 is always the reward icon:

- Positions `1..current` → filled sprite
- Positions `current+1 .. required-1` → empty sprite
- Position `required` → reward sprite (not counted as a «sello» earned)

Visual metaphor: `☕ ☕ ☕ ☕ ☕ ☕ ☕ ○ ○ 🎁`

## React component

`<LoyaltyProgress />`

**Implemented (Phase J3 — [#51](https://github.com/3urega/fidelization/issues/51)):**

- [`LoyaltyProgress.tsx`](../src/app/_components/loyalty/LoyaltyProgress.tsx) — mask-based SVG tinting, responsive sizes, reward gold accent
- `buildLoyaltyProgressSlots()` + `npm run verify:loyalty-progress-component`

| Prop | Type | Description |
|------|------|-------------|
| `template` | `LoyaltyVisualTemplate` | Asset pack id (`coffee`, `generic`, …) |
| `current` | `number` | Stamps earned |
| `required` | `number` | Total stamp slots before reward |
| `completed` | `boolean` | Optional; all filled + reward highlighted |

## Rendering algorithm

For each index `i` in `1..required`:

- If `i < required` and `i <= current` → filled
- If `i < required` and `i > current` → empty (30% opacity)
- If `i === required` → reward (larger, gold accent, subtle animation)

When `completed === true`, treat all stamp slots as filled and emphasize reward.

## Responsive sizes

| Breakpoint | Sprite size |
|------------|-------------|
| Mobile (default) | 40×40 px |
| Tablet (`md:`) | 56×56 px |
| Desktop (`lg:`) | 64×64 px |

Reward sprite: ~1.15× stamp size.

## Visual behaviour

| State | Behaviour |
|-------|-----------|
| Filled | Full color; `fill: var(--tenant-primary, var(--color-primary))` where SVG allows |
| Empty | 30% opacity |
| Reward | Gold accent token; optional subtle pulse animation |

All SVGs must be flat, support CSS `currentColor` / `fill` overrides, and work on light and dark surfaces (`bg-surface`).

## Data model (Phase J4)

Add to `stamp_campaigns`:

| Field | Type | Notes |
|-------|------|-------|
| `visual_template` | `text` | Default `generic`; validated enum in domain |
| `card_background_variant` | `text` | Default `coffee-photo`; quadrant from `fondos.png` |

**Implemented (Phase J4 — [#52](https://github.com/3urega/fidelization/issues/52)):** migración `20260611150000_stamp_campaign_visual_assets`; expuesto en CRUD owner y `stampProgress[]` como `visualTemplate` / `cardBackgroundVariant`.

## Owner UX (Phase J5)

In `StampCampaignsForm` when creating/editing a campaign:

1. Select stamp type (existing)
2. **Pick visual template** — grid of mini previews
3. **Pick card background** — `LoyaltyCardBackgroundSwatch` × 4
4. **Live preview** — `LoyaltyProgress` with sample `current` (demo 3/N)

**Implemented (Phase J5 — [#53](https://github.com/3urega/fidelization/issues/53)):** [`StampCampaignsForm.tsx`](../src/app/_components/loyalty/StampCampaignsForm.tsx) + [`LoyaltyVisualTemplatePicker.tsx`](../src/app/_components/loyalty/LoyaltyVisualTemplatePicker.tsx).

## Customer UX (Phase J6)

Replace text-only `current / required` in [`LoyaltyCard`](../src/app/_components/loyalty/LoyaltyCard.tsx) sellos section with `LoyaltyProgress`. Same component in platform app establishment detail and tenant `/app/card`.

**Implemented (Phase J6 — [#54](https://github.com/3urega/fidelization/issues/54)):** sellos visuales por campaña; fondo por `cardBackgroundVariant`; regresión `verify:customer-stamp-progress` + `verify:platform-app-establishment-detail`.

## GitHub issues (published)

| # | Slice | Título |
|---|-------|--------|
| [#49](https://github.com/3urega/fidelization/issues/49) | **J1** | Visual assets system domain doc — **Closed** (2026-06-11) |
| [#50](https://github.com/3urega/fidelization/issues/50) | **J2** | Loyalty visual assets (SVG stamps + fondos sprite) — **Closed** (2026-06-11) |
| [#51](https://github.com/3urega/fidelization/issues/51) | **J3** | LoyaltyProgress component — **Closed** (2026-06-11) |
| [#52](https://github.com/3urega/fidelization/issues/52) | **J4** | Stamp campaign visualTemplate API — **Closed** (2026-06-11) |
| [#53](https://github.com/3urega/fidelization/issues/53) | **J5** | Owner template picker + card preview — **Closed** (2026-06-11) |
| [#54](https://github.com/3urega/fidelization/issues/54) | **J6** | Customer LoyaltyCard visual stamps — **Closed** (2026-06-11) |

Phase J complete (issues #49–#54).

## Out of scope (Phase J)

- PNG/JPEG exports or server-side image generation
- Per-campaign custom SVG upload
- Visual styling for text promotions (`promotions` table)
- Animated Lottie / video backgrounds
