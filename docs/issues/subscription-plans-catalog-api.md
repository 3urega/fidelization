## Objetivo

Catálogo de planes SaaS (**Basic / Pro / Premium**) persistido en `subscription_plans`, API owner para listar planes y asignar plan al tenant (sin pago aún). Base para Step 3 del onboarding.

Slice **E1** — [`business-onboarding.md`](../domain/business-onboarding.md) Step 3 (parcial) + [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) Deferred Steps 3–4.

## Contexto

- Tablas `subscription_plans` y `subscriptions` ya migradas ([`data-model.md`](../database/data-model.md)).
- Seed demo crea plan `basic` ([`prisma/seed.ts`](../../prisma/seed.ts)); `TenantBillingRepository` parcial en `billing` context.
- `tenant.subscriptionPlan` (string) y `subscriptionPlanId` coexisten; unificar hacia FK + catálogo.
- Phase D (#24–#27) completada; trigger del roadmap cumplido para iniciar monetización.

## Alcance

| In | Fuera |
|----|-------|
| Seed/upsert planes Basic, Pro, Premium (`features` JSON alineado con [`business-model.md`](../domain/business-model.md)) | Stripe / Checkout |
| `ListSubscriptionPlans`, `AssignTenantSubscriptionPlan` (owner-only) | UI wizard Step 3 (#28 draft) |
| `GET /api/billing/plans`, `PATCH /api/billing/tenant-plan` (o similar) | Feature-flag enforcement (#31) |
| Opcional: `tenant.status = trial` al asignar plan sin pago (configurable) | Precios reales en producción |
| `verify:subscription-plans-use-case` + `verify:subscription-plans` | Downgrade prorrateado |

## Criterios de aceptación

- [ ] Tres planes activos en Prisma con `features`/`limits` JSON documentados.
- [ ] Owner autenticado lista planes (`GET`); respuesta sin secretos Stripe.
- [ ] Owner asigna `planId` a su tenant; `GET /api/me` refleja plan actualizado.
- [ ] Tenant `suspended` no puede cambiar plan (403 coherente).
- [ ] `verify:subscription-plans-use-case` pasa (stub).
- [ ] `verify:subscription-plans` pasa (dev + `DATABASE_URL`).

## Capas / archivos principales

- `src/contexts/billing/subscriptions/application/` — casos de uso list/assign
- `src/contexts/billing/subscriptions/domain/` — ampliar `SubscriptionPlan`, errores dominio
- `src/contexts/billing/subscriptions/infrastructure/PrismaTenantBillingRepository.ts`
- `src/app/api/billing/plans/route.ts`, `src/app/api/billing/tenant-plan/route.ts` (nombres finales al implementar)
- `diod.config.ts`, `scripts/verify-subscription-plans*.ts`, `package.json`, `AGENTS.md`

## Issues relacionadas

- **onboarding-plan-selection-ui** — UI Step 3 (depende de esta API)
- **stripe-checkout-subscription** — pago real tras elegir plan
- **tenant-feature-flags** — consumir `features` del plan

## Referencias

- [`business-model.md`](../domain/business-model.md) — planes Basic/Pro/Premium
- [`business-onboarding.md`](../domain/business-onboarding.md) — Step 3
- [`saas-architecture.md`](../domain/saas-architecture.md) — billing per tenant
