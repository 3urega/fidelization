## Objetivo

Permitir al owner **diseñar cómo se verá la tarjeta de sellos** al crear una campaña: elegir plantilla visual y ver preview en vivo.

## Contexto

Phase J5 — UI owner en `/settings/stamps` → pestaña Campañas. Depende de J3 (`LoyaltyProgress`) y J4 (`visualTemplate` en API).

En lenguaje de producto esto es la «promoción de fidelización» (campaña de sellos), no la promoción de texto Pro.

## Alcance

| In | Fuera |
|----|-------|
| Selector de template sellos + **fondo tarjeta** (`LoyaltyCardBackgroundSwatch` × 4) | Editor drag-and-drop |
| Preview en vivo con `LoyaltyProgress` + fondo elegido | Cambios en `PromotionsForm` |
| POST/PATCH envía `visualTemplate` + `cardBackgroundVariant` | Nuevos fondos fuera de `fondos.png` |

## Criterios de aceptación

- [ ] Al crear campaña, owner elige plantilla sellos (default `generic`) **y fondo** (default `coffee-photo`)
- [ ] Preview actualiza al cambiar plantilla, fondo o `requiredStamps`
- [ ] Lista de campañas muestra nombre de plantilla o icono mini
- [ ] `npm run verify:stamp-campaigns` E2E crea campaña con `visualTemplate: coffee` (o similar)

## Capas / archivos principales

- `src/app/_components/loyalty/StampCampaignsForm.tsx`
- `src/app/_components/loyalty/LoyaltyVisualTemplatePicker.tsx` (nuevo, opcional)
- `src/app/_components/loyalty/LoyaltyCardBackground.tsx`
- `src/app/_components/loyalty/loyaltyCardBackgrounds.ts`

## Issues relacionadas

- `stamp-campaign-visual-template-api.md` (J4)
- `customer-loyalty-card-visual-stamps.md` (J6)

## Referencias

- [`visual-assets-system.md`](../domain/visual-assets-system.md)
- [`StampSettingsPanel.tsx`](../../src/app/_components/loyalty/StampSettingsPanel.tsx)
