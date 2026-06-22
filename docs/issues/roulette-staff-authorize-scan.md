## Objetivo

En `/scan`, el empleado elige explícitamente **Autorizar giro de ruleta**, introduce el importe de la consumición, escanea el QR, y recibe un mensaje claro de éxito o de rechazo con motivo. Eliminar la concesión automática de ruleta al registrar una visita de sello.

## Contexto

Phase X — depende de X1 (`AuthorizeRouletteSpin`). Hoy `RecordStaffScanByTarget` llama siempre a `IssueRouletteSpinEligibility` al final del scan de sello/promo, mezclando visita loyalty con ruleta. El botón dice «Registrar visita **y desbloquear ruleta**», confundiendo flujos.

**Escenario producto:** cliente paga 15€ → camarero: «¿Tienes ruleta? Dame tu QR» → scan → target ruleta → importe 15 → «Autorizado: puede girar en la app».

## Alcance

| In | Fuera |
|----|-------|
| Nuevo target staff: `targetType: "roulette_authorize"` (+ `purchaseAmountEuros` en body) | Autorizar sin QR (manual customer id) |
| `POST /api/loyalty/scan` o ruta dedicada `POST /api/loyalty/games/ruleta/authorize` | Validar ticket/factura adjunta |
| Outcomes: `roulette_auth_granted`, `roulette_auth_denied` con `reasonCode` + `message` | Canje premio físico (sigue Flujo B V7) |
| **Quitar** auto `IssueRouletteSpinEligibility` de `RecordStaffScanByTarget` cuando `authorizationMode === staff_explicit` | Mantener dual mode forever (solo flag transitorio v1) |
| UI `/scan`: target picker incluye «Autorizar giro ruleta»; campo importe €; sin mezclar con sello | POS |
| Actualizar `StaffScanRouletteHint`, copy página scan, `scan-context` API | |

**Códigos rechazo (ejemplo):**

| reasonCode | Mensaje staff |
|------------|---------------|
| `not_enrolled` | El cliente no ha activado la ruleta en la app |
| `quota_exhausted` | Sin giros disponibles en este periodo |
| `daily_limit` | Ya autorizaste el giro de hoy |
| `min_purchase` | Importe 8€ · mínimo 10€ |
| `game_disabled` | Ruleta desactivada |
| `pending_auth` | Ya tiene un giro pendiente de usar |

## Criterios de aceptación

- [ ] Scan sello/promo **no** emite `roulette_spin_granted` en tenants con config v2.
- [ ] Scan ruleta con QR válido + importe 15€ (mín 10) → `roulette_auth_granted`.
- [ ] Casos negativos muestran mensaje humano en UI staff (no solo 4xx JSON).
- [ ] Cliente recibe estado listo en app tras auth exitosa (integración con X2).
- [ ] `npm run verify:roulette-staff-authorize-use-case`
- [ ] `npm run verify:roulette-staff-authorize` (dev + `DATABASE_URL`)
- [ ] Regresión: `verify:roulette-staff-redeem`, `verify:staff-scan-roulette-ux` actualizados

## Capas / archivos principales

- `src/contexts/loyalty/customers/domain/StaffScanTarget.ts` — tipo `roulette_authorize`
- `src/contexts/loyalty/customers/domain/StaffScanOutcome.ts` — outcomes nuevos
- `src/contexts/loyalty/customers/application/scan/ListStaffScanTargets.ts` — incluir target ruleta si gamification
- `src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts` — quitar side-effect ruleta
- `src/contexts/loyalty/games/application/participation/AuthorizeRouletteSpin.ts`
- `src/app/_components/loyalty/StaffScanForm.tsx`, `StaffScanTargetPicker.tsx`
- `src/app/(app)/scan/StaffScanPageClient.tsx`

## Issues relacionadas

- `roulette-config-v2-participation-domain.md`
- `roulette-client-enrollment-ui.md`
- `phase-x-roulette-flow-verify-docs.md`

## Referencias

- [`staff-scan-flow.md`](../domain/staff-scan-flow.md)
- [`RecordStaffScanByTarget.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts)
