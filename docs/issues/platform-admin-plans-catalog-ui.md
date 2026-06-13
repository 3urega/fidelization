## Objetivo

Habilitar la gestión del **catálogo de planes SaaS** (Basic / Pro / Premium) desde el panel de plataforma.

## Contexto

- Catálogo en BD: `subscription_plans` con `features` y `limits` JSON (#30–#34).
- Nav ya prevé `/platform/plans` con `comingSoon: true`.
- Nomenclatura producto: **Basic / Pro / Premium** (no Free/Starter/Enterprise del borrador).

## Alcance

| In | Fuera |
|----|-------|
| Activar ruta `/platform/plans` | Stripe Price creation automática |
| Listar planes con precio referencia, features, límites | Nuevos tiers comerciales sin migración |
| `GET/PATCH /api/platform/plans` (superadmin only) | Checkout desde superadmin |
| Editor JSON o formulario para `features[]` y límites empleados | Add-ons Gamification SKU |

## Criterios de aceptación

- [ ] Cambios en features se reflejan en `AssertTenantPlanFeature` para tenants del plan.
- [ ] Employee sin acceso; regresión owner assign plan vía onboarding intacta.
- [ ] UI theme-driven; sin colores hardcodeados.
- [ ] Verify scripts.

## Capas / archivos principales

- Extender contexto `billing/subscriptions`: `ListSubscriptionPlans`, `UpdateSubscriptionPlan` (platform scope)
- Quitar `comingSoon` en [`platformNavItems.ts`](../../src/app/_components/platform/platformNavItems.ts)

## Issues relacionadas

- `platform-admin-feature-flags-editor.md` (P7)
- `platform-admin-tenant-detail.md` (P2)

## Referencias

- [`docs/domain/business-model.md`](../domain/business-model.md)
- [`docs/superadmin.md`](../superadmin.md) § Planes
