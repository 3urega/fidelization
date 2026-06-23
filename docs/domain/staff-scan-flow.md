# Staff scan flow (target-first)

**Status:** **Phase M complete** ([#65](https://github.com/3urega/fidelization/issues/65)–[#70](https://github.com/3urega/fidelization/issues/70), 2026-06-13).

## Implementation status (M1)

| Artefacto | Ruta |
|-----------|------|
| Target types + parser | [`StaffScanTarget.ts`](../../src/contexts/loyalty/customers/domain/StaffScanTarget.ts) |
| Outcome union + messages | [`StaffScanOutcome.ts`](../../src/contexts/loyalty/customers/domain/StaffScanOutcome.ts) |
| Domain verify | `npm run verify:staff-scan-flow-spec-use-case` |

## Implementation status (M2)

| Artefacto | Ruta |
|-----------|------|
| Read models | [`StaffScanTargets.ts`](../../src/contexts/loyalty/customers/domain/StaffScanTargets.ts) |
| Staff-only guard | [`StaffScanForbidden.ts`](../../src/contexts/loyalty/customers/domain/StaffScanForbidden.ts) |
| List use case | [`ListStaffScanTargets.ts`](../../src/contexts/loyalty/customers/application/scan/ListStaffScanTargets.ts) |
| API route | [`GET /api/loyalty/scan/targets`](../../src/app/api/loyalty/scan/targets/route.ts) |
| Domain verify | `npm run verify:staff-scan-targets-use-case` |
| E2E verify | `npm run verify:staff-scan-targets` (dev + `DATABASE_URL`) |

## Implementation status (M3)

| Artefacto | Ruta |
|-----------|------|
| QR resolver (auto-join) | [`ResolveCustomerByQrForStaffScan.ts`](../../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan.ts) |
| Record use case | [`RecordStaffScanByTarget.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts) |
| API route | [`POST /api/loyalty/scan`](../../src/app/api/loyalty/scan/route.ts) — `{ qrValue, targetType, targetId }` → `{ customer, outcomes[] }` |
| Promo use delegation | [`POST /api/loyalty/promotions/[id]/use`](../../src/app/api/loyalty/promotions/[promotionId]/use/route.ts) → `RecordStaffScanByTarget` |
| Domain verify | `npm run verify:staff-scan-record-by-target-use-case` |
| E2E verify | `npm run verify:staff-scan-record-by-target` (dev + `DATABASE_URL`) |

## Implementation status (M4)

| Artefacto | Ruta |
|-----------|------|
| Target picker | [`StaffScanTargetPicker.tsx`](../../src/app/_components/loyalty/StaffScanTargetPicker.tsx) |
| Outcomes list | [`StaffScanOutcomesList.tsx`](../../src/app/_components/loyalty/StaffScanOutcomesList.tsx) |
| Scan form | [`StaffScanForm.tsx`](../../src/app/_components/loyalty/StaffScanForm.tsx) |
| Page | [`/scan`](../../src/app/(app)/scan/page.tsx) — [`StaffScanPageClient.tsx`](../../src/app/(app)/scan/StaffScanPageClient.tsx) |

## Staff scan + ruleta (Flujo A-v2, A-legacy y B)

### Flujo A-v2 — Autorizar giro ruleta (config `staff_explicit`)

Independiente de visita/sello. El cliente debe haber activado la ruleta en su app.

1. Empleado elige **Autorizar giro de ruleta** en el picker.
2. Introduce el **importe de la compra** (€).
3. Pega/escanea el QR del cliente.
4. Pulsa **Autorizar giro de ruleta**.
5. Outcome `roulette_auth_granted` (éxito) o `roulette_auth_denied` con motivo (`not_enrolled`, `min_purchase`, `quota_exhausted`, …).
6. El cliente gira en su app (`/home/establishments/[slug]/ruleta`).

### Flujo A-legacy — Registrar visita y desbloquear ruleta (config `after_staff_scan`, superseded)

Solo si `scan-context.unlockEnabled === true`. Mezcla visita loyalty con ruleta.

1. Empleado elige **una tarjeta o promoción**.
2. Pega/escanea el QR del cliente.
3. Pulsa **Registrar visita y desbloquear ruleta**.
4. Outcome `roulette_spin_granted` → el cliente gira en su app.

### Flujo B — Cliente ya ganó premio físico (secundario)

1. Sección colapsada **Canjear premio físico (ruleta)** en `/scan`.
2. Tras cualquier scan, se auto-buscan premios `pending_redeem` del mismo QR; también búsqueda manual.
3. Empleado marca **Canjeado** cuando entrega el premio.

| Caso | Target / acción | Outcome principal |
|------|-----------------|-------------------|
| Ruleta v2 | `roulette_authorize` + `purchaseAmountEuros` | `roulette_auth_granted` / `roulette_auth_denied` |
| Visita/sello | `stamp_campaign` / `promotion` | `point_recorded` + sello/promo |
| Ruleta legacy | sello/promo + `after_staff_scan` | + `roulette_spin_granted` |
| Canje físico | UI colapsada (no scan target) | redeem spin |

| Artefacto | Ruta |
|-----------|------|
| Scan context API | `GET /api/loyalty/games/ruleta/scan-context` → `{ unlockEnabled, authorizeEnabled, minPurchaseEuros }` |
| Ruleta hints | [`StaffScanRouletteHint.tsx`](../../src/app/_components/loyalty/StaffScanRouletteHint.tsx) (legacy + authorize) |
| Canje físico | [`StaffRoulettePendingRedeem.tsx`](../../src/app/_components/loyalty/StaffRoulettePendingRedeem.tsx) |
| E2E UX verify | `npm run verify:staff-scan-roulette-ux` (dev server) |
| E2E flujo v2 | `npm run verify:roulette-participation-flow-e2e` (dev + `DATABASE_URL`) |
| E2E authorize | `npm run verify:roulette-staff-authorize` (dev + `DATABASE_URL`) |

## Implementation status (X4/X5)

| Artefacto | Ruta |
|-----------|------|
| Target `roulette_authorize` | [`StaffScanTarget.ts`](../../src/contexts/loyalty/customers/domain/StaffScanTarget.ts) |
| Authorize use case | [`RecordStaffRouletteAuthorizeByQr.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffRouletteAuthorizeByQr.ts) |
| Legacy gate | [`RecordStaffScanByTarget.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts) — sin auto-elegibilidad en v2 |
| E2E flujo completo | `npm run verify:roulette-participation-flow-e2e` |

## Implementation status (M5)

| Artefacto | Ruta |
|-----------|------|
| Verify helpers | [`scripts/lib/staff-scan-verify-helpers.ts`](../../scripts/lib/staff-scan-verify-helpers.ts) |
| Regresión E2E | Todos los `verify:*` que llaman `POST /api/loyalty/scan` usan `{ qrValue, targetType, targetId }` + `outcomes[]` |

## Implementation status (M6)

| Artefacto | Ruta |
|-----------|------|
| Docs + cleanup | `AGENTS.md`, roadmaps Phase H/M, settings copy |
| Legacy removed | `RecordCustomerVisitByQr`, `ResolveStampScanOptions`; `StampProgressSummary` en dominio |
| `GET stamp-types` | Solo catálogo owner (`types[]`); sin `selectionRequired` |

## Invariante de negocio (no negociable)

> **Un escaneo afecta exactamente a un target: una tarjeta concreta o una promoción concreta.**  
> Nunca a varias tarjetas a la vez, aunque compartan el mismo `stampTypeId`.

El comportamiento legacy (`stampTypeId` → sello en **todas** las campañas del tipo) fue eliminado en Phase M ([#65](https://github.com/3urega/fidelization/issues/65)–[#70](https://github.com/3urega/fidelization/issues/70)).

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
| `promotion` | +1 punto + registrar uso promoción (`RecordStaffScanByTarget`) |
| `roulette_authorize` | Solo autoriza ruleta v2 (`AuthorizeRouletteSpin`); **no** registra visita ni puntos. Body incluye `purchaseAmountEuros`. |

`targetType` + `targetId` are **required** on `POST /api/loyalty/scan` for stamp/promo. For `roulette_authorize`, `targetId` is optional (default `ruleta`).

## API (target)

- `GET /api/loyalty/scan/targets` — lista tarjetas activas + promos + `rouletteAuthorize { enabled, minPurchaseEuros }` cuando config v2 `staff_explicit`.
- `POST /api/loyalty/scan` — body `{ qrValue, targetType, targetId [, purchaseAmountEuros] }` → `{ customer, outcomes[] }`.
- `GET /api/loyalty/games/ruleta/scan-context` — `{ unlockEnabled, authorizeEnabled, minPurchaseEuros }` (legacy vs v2).

`outcomes[]` discriminated union: `point_recorded`, `stamp_added`, `card_completed`, `card_already_completed`, `promotion_applied`, `promotion_exhausted`, `roulette_spin_granted` (legacy `after_staff_scan`; incluye `expiresAt` ISO), `roulette_auth_granted`, `roulette_auth_denied` (v2 `staff_explicit`; rechazos de negocio en **200** con `reasonCode` + `message`).

## Edge cases (dominio)

| Caso | Comportamiento |
|------|----------------|
| Tarjeta ya completada | `point_recorded` + `card_already_completed`; sin sello |
| Promo límite agotado | `point_recorded` + `promotion_exhausted`; sin uso extra |
| Platform user QR sin customer | Auto-join en **tarjeta y promo** (misma resolución) |
| Tenant sin campañas | Picker vacío; scan bloqueado en UI |
| `POST …/promotions/[id]/use` | Delega a `RecordStaffScanByTarget` (200 con `promotion_exhausted` + `outcomes` si agotada) |

## Eliminaciones (no deprecación suave)

- **Eliminar** `stampTypeId` del body de `POST /api/loyalty/scan` y del picker de `/scan`.
- **Eliminar** `addStampsForActiveCampaigns` (bucle por tipo) en favor de sello en **una** `campaignId`.
- `GET /api/loyalty/stamp-types` sigue solo para `/settings/stamps`, no para scan.
- Actualizar `verify:customer-stamp-scan-targeted*` al nuevo contrato (un scan = una tarjeta).

## GitHub issues (published)

| # | Slice | Issue |
|---|-------|-------|
| [#65](https://github.com/3urega/fidelization/issues/65) | M1 | Domain spec + outcome types — **Closed** (2026-06-13) |
| [#66](https://github.com/3urega/fidelization/issues/66) | M2 | List scan targets API — **Closed** (2026-06-13) |
| [#67](https://github.com/3urega/fidelization/issues/67) | M3 | Record scan by target + outcomes — **Closed** (2026-06-13) |
| [#68](https://github.com/3urega/fidelization/issues/68) | M4 | `/scan` page redesign — **Closed** (2026-06-13) |
| [#69](https://github.com/3urega/fidelization/issues/69) | M5 | Verify E2E (todos los scripts scan) — **Closed** (2026-06-13) |
| [#70](https://github.com/3urega/fidelization/issues/70) | M6 | Docs + cleanup Phase H — **Closed** (2026-06-13) |

Manifest: [`manifest.phase-m-staff-scan.json`](../issues/manifest.phase-m-staff-scan.json).
