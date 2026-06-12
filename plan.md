Exactamente. Si quieres que Cursor genere tarjetas dinámicamente, no necesitas una imagen bonita de ejemplo. Necesitas un **sistema de assets reutilizable**.

La forma profesional de hacerlo es crear un documento tipo:

# `docs/domain/visual-assets-system.md`

```md
# Visual Assets System

## Objective

All loyalty cards must be generated dynamically using reusable sprite assets.

The UI must never depend on pre-rendered images.

Cards are built by combining:

- Empty sprite
- Filled sprite
- Reward sprite

This allows unlimited campaigns while maintaining a consistent design system.

---

# Asset Structure

public/

  assets/

    loyalty/

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

      generic/

        generic-empty.svg
        generic-filled.svg
        generic-reward.svg

---

# Rendering Rules

Example:

Required stamps: 10

Current stamps: 7

Render:

filled x7
empty x2
reward x1

Visual:

☕ ☕ ☕ ☕ ☕ ☕ ☕ ○ ○ 🎁

---

# React Component

Component:

<LoyaltyProgress />

Props:

{
  template: "coffee",
  current: 7,
  required: 10
}

---

# Rendering Algorithm

for index in required:

  if index <= current:
    render filled sprite

  else:
    render empty sprite

last position:
  render reward sprite

---

# Mobile Rules

Sprites:

width: 40px
height: 40px

Tablet:

width: 56px
height: 56px

Desktop:

width: 64px
height: 64px

---

# Visual Behaviour

Filled:
- Full color

Empty:
- 30% opacity

Reward:
- Larger than stamps
- Gold accent
- Subtle animation

---

# Future Templates

coffee
croissant
burger
pizza
beer
icecream
generic

All templates must implement:

- empty
- filled
- reward
```

---

Luego le abriría una issue a Cursor:

# Issue: Create Loyalty Asset Library

```md
Create the complete loyalty sprite system.

Requirements:

Use SVG.

Each template must include:

- empty state
- filled state
- reward state

Templates:

- coffee
- croissant
- burger
- pizza
- generic

All assets must:

- be flat SVG
- support CSS color overrides
- work on dark mode
- work on light mode

Store assets under:

public/assets/loyalty/
```

---

Y lo más importante:

## NO generes PNG

Haz que Cursor genere SVG.

Por ejemplo:

```svg
coffee-empty.svg
coffee-filled.svg
coffee-reward.svg
```

Porque entonces podrás:

```css
fill: var(--tenant-primary);
```

y automáticamente el café de Barcelona tendrá los sellos azules y el de Madrid los tendrá verdes sin crear imágenes nuevas.

---

La arquitectura que yo usaría sería:

```text
campaign
    ↓
template = coffee
    ↓
coffee-filled.svg
coffee-empty.svg
coffee-reward.svg
    ↓
LoyaltyCard component
    ↓
Tarjeta renderizada
```

Así no diseñas 500 promociones.

Diseñas 5–10 packs de sprites y el sistema genera millones de combinaciones automáticamente.

---

## Implementación (Phase J)

Plan detallado y issues: [`docs/domain/visual-assets-system.md`](docs/domain/visual-assets-system.md).

| Slice | GitHub |
|-------|--------|
| J1 Doc dominio | [#49](https://github.com/3urega/fidelization/issues/49) — **Closed** |
| J2 Sprites SVG + fondos | [#50](https://github.com/3urega/fidelization/issues/50) — **Closed** |
| J3 LoyaltyProgress | [#51](https://github.com/3urega/fidelization/issues/51) — **Closed** |
| J4 API visualTemplate | [#52](https://github.com/3urega/fidelization/issues/52) — **Closed** |
| J5 Owner picker + preview | [#53](https://github.com/3urega/fidelization/issues/53) — **Closed** |
| J6 Cliente LoyaltyCard | [#54](https://github.com/3urega/fidelization/issues/54) — **Closed** |

**Phase J complete** (2026-06-11).
