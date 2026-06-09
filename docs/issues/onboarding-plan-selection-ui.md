## Objetivo

UI **Step 3**: tras crear el negocio, el owner elige plan (Basic / Pro / Premium) antes de usar el dashboard completo o como paso destacado en checklist `/home`.

Slice **E2** — depende de **subscription-plans-catalog-api**.

## Contexto

- API de planes implementada en issue previa (`GET /api/billing/plans`, assign plan).
- Patrón UI: [`StampCampaignsForm`](../../src/app/_components/loyalty/StampCampaignsForm.tsx), checklist [`HomeDashboard.tsx`](../../src/app/(app)/home/HomeDashboard.tsx).
- Hoy el owner llega a `/home` tras Step 2 sin elegir plan comercial.

## Alcance

| In | Fuera |
|----|-------|
| Ruta `/onboarding/plan` o redirect post-`/register/business/tenant` si tenant sin plan asignado | Stripe Checkout (#29) |
| Tarjetas/plan picker (nombre, precio mensual seed, features resumidas) | Trial countdown UI avanzada |
| `POST`/`PATCH` assign plan vía API existente | Cambio de plan con prorrateo |
| Checklist `/home`: «Elige tu plan» hasta plan ≠ default vacío | Feature flags (#31) |
| `verify:onboarding-plan-selection` E2E | Capacitor |

## Criterios de aceptación

- [ ] Owner recién registrado ve selector de plan (o redirect claro desde `/home`).
- [ ] Tras elegir plan, `GET /api/me` muestra plan correcto; checklist marcado.
- [ ] Nav/settings existentes siguen funcionando (regresión onboarding #13).
- [ ] `verify:onboarding-plan-selection` pasa (dev + `DATABASE_URL`).
- [ ] `AGENTS.md` + roadmap actualizados.

## Capas / archivos principales

- `src/app/(app)/onboarding/plan/page.tsx` (o `(auth)/` según flujo)
- `src/app/_components/billing/PlanSelectionForm.tsx`
- `src/app/(app)/home/HomeDashboard.tsx` — checklist item
- `src/middleware.ts` — redirect opcional si falta plan
- `scripts/verify-onboarding-plan-selection.ts`

## Issues relacionadas

- **subscription-plans-catalog-api** — prerrequisito
- **stripe-checkout-subscription** — sustituir assign gratuito por pago

## Referencias

- [`business-onboarding.md`](../domain/business-onboarding.md) — Step 3
- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Deferred Steps 3–4
