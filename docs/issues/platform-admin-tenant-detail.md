## Objetivo

Permitir al superadmin **ver y gestionar un negocio** más allá de activar/suspender: detalle, plan, metadatos básicos.

## Contexto

- Hoy: `GET /api/platform/tenants`, `PATCH …/[tenantId]/status` ([`PlatformTenantsTable`](../../src/app/_components/platform/PlatformTenantsTable.tsx)).
- Planes tenant: catálogo `subscription_plans` (Basic / Pro / Premium), no Free/Starter/Enterprise del borrador de producto.
- Visión: [`docs/superadmin.md`](../superadmin.md) § Comercios.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/tenants/[tenantId]` detalle: nombre, slug, plan, estado, fecha alta, owners, contadores actividad | Eliminar tenant (hard delete) |
| `GET /api/platform/tenants/[tenantId]` | Impersonar (issue P3) |
| `PATCH` plan (`subscriptionPlanId` / assign use case existente) | Crear tenant desde UI (opcional v2) |
| `PATCH` nombre, slug (validación unicidad slug) | Editar branding del tenant |
| Acciones: suspender/reactivar (regresión #9) | Facturación Stripe manual |

## Criterios de aceptación

- [ ] Detalle tenant solo accesible con sesión platform.
- [ ] Cambiar plan desde superadmin persiste en BD y refleja guards de feature flags (#34).
- [ ] Slug duplicado → 409 con mensaje claro.
- [ ] `npm run verify:platform-admin-tenant-detail-use-case`
- [ ] `npm run verify:platform-admin-tenant-detail` (E2E)

## Capas / archivos principales

- Use cases: `GetPlatformTenantDetail`, `UpdatePlatformTenant`, reutilizar `AssignTenantSubscriptionPlan`
- API routes bajo `src/app/api/platform/tenants/[tenantId]/`
- UI detalle en `(platform)/platform/tenants/[tenantId]/`

## Issues relacionadas

- `platform-admin-kpi-dashboard.md` (P1)
- `platform-admin-impersonate-tenant.md` (P3)
- `platform-admin-plans-catalog-ui.md` (P5)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
- [`docs/domain/business-model.md`](../domain/business-model.md)
