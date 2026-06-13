# Staff scan flow (target-first)

**Status:** Planned — Phase M (issues #65–#69, actualizado 2026-06-13).

## Invariante de negocio (no negociable)

> **Un escaneo afecta exactamente a un target: una tarjeta concreta o una promoción concreta.**  
> Nunca a varias tarjetas a la vez, aunque compartan el mismo `stampTypeId`.

El comportamiento actual (`stampTypeId` → sello en **todas** las campañas del tipo) es un **bug de diseño** que Phase M elimina por completo.

## Problem

`/scan` today asks for a **consumption type** (`stampTypeId`) and then adds a stamp to **every** active campaign linked to that type. Promotions (Pro+) live on a separate API (`POST /api/loyalty/promotions/[id]/use`) and are not part of the scan screen. Feedback is a single concatenated string; there is no clear outcome for card completion or exhausted promotions.

## Target UX

1. Staff opens `/scan` and sees **all active stamp cards** and **all active promotions** (when plan allows) — **una fila por tarjeta**, no agrupadas por tipo.
2. Staff **must select exactly one target** (one tarjeta or one promoción) before scanning the customer QR.
3. Staff scans / pastes QR → one action applies **only** to the selected target (máximo 1 campaña de sellos mutada por request).
4. UI shows a **clear outcome message** depending on what happened:

| Outcome | Mensaje (ES) |
|---------|----------------|
| Sello en tarjeta (caso habitual) | **«¡Producto anotado! {current} de {required} completados»** |
| Punto registrado | «Punto anotado» (puede combinarse con el anterior) |
| Tarjeta completada | «¡Has completado la tarjeta!» |
| Promoción aplicada | «Promoción aplicada» |
| Promoción agotada | «¡La promoción ya ha sido agotada!» |

Ejemplo tras escanear tarjeta «Café 10 sellos» con 4 sellos previos:  
**«¡Producto anotado! 5 de 10 completados»**

Multiple lines may appear (e.g. punto + producto anotado; producto anotado + tarjeta completada).

## Scan targets

| `targetType` | Acción |
|--------------|--------|
| `stamp_campaign` | +1 punto (MVP fijo) + +1 sello **solo** en `targetId` (esa campaña) |
| `promotion` | +1 punto + registrar uso promoción (`RecordPromotionUse`) |

`targetType` + `targetId` are **required** on `POST /api/loyalty/scan`.

## API (target)

- `GET /api/loyalty/scan/targets` — lista tarjetas activas + promos activas para el picker.
- `POST /api/loyalty/scan` — body `{ qrValue, targetType, targetId }` → `{ customer, outcomes[] }`.

`outcomes[]` discriminated union: `point_recorded`, `stamp_added`, `card_completed`, `promotion_applied`, `promotion_exhausted`.

## Eliminaciones (no deprecación suave)

- **Eliminar** `stampTypeId` del body de `POST /api/loyalty/scan` y del picker de `/scan`.
- **Eliminar** `addStampsForActiveCampaigns` (bucle por tipo) en favor de sello en **una** `campaignId`.
- `GET /api/loyalty/stamp-types` sigue solo para `/settings/stamps`, no para scan.
- Actualizar `verify:customer-stamp-scan-targeted*` al nuevo contrato (un scan = una tarjeta).

## GitHub issues (published)

| # | Slice | Issue |
|---|-------|-------|
| [#65](https://github.com/3urega/fidelization/issues/65) | M1 | Domain spec + outcome types |
| [#66](https://github.com/3urega/fidelization/issues/66) | M2 | List scan targets API |
| [#67](https://github.com/3urega/fidelization/issues/67) | M3 | Record scan by target + outcomes |
| [#68](https://github.com/3urega/fidelization/issues/68) | M4 | `/scan` page redesign |
| [#69](https://github.com/3urega/fidelization/issues/69) | M5 | Verify E2E |

Manifest: [`manifest.phase-m-staff-scan.json`](../issues/manifest.phase-m-staff-scan.json).
