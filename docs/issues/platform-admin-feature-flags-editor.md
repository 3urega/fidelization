## Objetivo

UI de **feature flags** para operar módulos por ámbito: global (defaults), por plan y por comercio.

## Contexto

- Enforcement parcial: `AssertTenantPlanFeature`, `subscription_plans.features`, `planFeatures` en `/api/me` (#34).
- Visión: [`docs/superadmin.md`](../superadmin.md) § Feature Flags (ruleta, referidos, etc.).
- Claves gamificación Premium existen en JSON pero sin motor de juegos aún.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/features` editor de flags por plan (Basic/Pro/Premium) | Motor de ruleta/rasca |
| Override por tenant (`tenants.features` o campo dedicado si falta) | A/B testing framework |
| `GET/PATCH /api/platform/features/plans`, `…/tenants/[id]` | Flags runtime sin persistencia |
| Lista de claves conocidas documentadas en `business-model.md` | Biblioteca de juegos (P11) |

## Criterios de aceptación

- [ ] Cambiar flag en plan afecta tenants de ese plan tras siguiente request (sin cache stale indefinido).
- [ ] Override tenant gana sobre plan (precedencia documentada).
- [ ] Promotions sigue gated Pro+ tras editar flags.
- [ ] Verify use case + regresión `verify:tenant-feature-flags`.

## Capas / archivos principales

- Use cases en `billing/subscriptions` o nuevo `platform/features`
- UI toggles theme-driven

## Issues relacionadas

- `platform-admin-plans-catalog-ui.md` (P5)
- `platform-admin-gamification-library.md` (P11)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
- [`docs/domain/business-model.md`](../domain/business-model.md)
