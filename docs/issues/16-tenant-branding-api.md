## Objetivo

Permitir que el **owner** persista el branding del negocio (`logoUrl`, `primaryColor`, `secondaryColor`) tras el onboarding.

Parte de **Phase A — slice A1** en [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md).

## Contexto

- Campos ya existen en `tenants` (Prisma) con defaults al crear el tenant.
- No hay caso de uso ni API para actualizarlos después del wizard paso 2.
- Depende de: onboarding Steps 1–2 (#11–#15) completados.

## Alcance

| In | Fuera |
|----|-------|
| Caso de uso `UpdateTenantBranding` (o equivalente en contexto `tenants`) | Subida de ficheros / S3 |
| `PATCH /api/tenant/branding` con `requireTenantSession` | Cambio de nombre del negocio o slug |
| Validación de colores (hex) y URL de logo (string) | Loyalty setup, planes |

**Rol:** solo `owner` (recomendado); documentar si se permite `admin`.

## Criterios de aceptación

- [ ] Owner autenticado (`kind: tenant`, `role: owner`) puede enviar `{ logoUrl?, primaryColor?, secondaryColor? }`.
- [ ] Cambios persistidos en `tenants` vía Prisma en transacción simple.
- [ ] Respuesta incluye tenant actualizado (mismo shape que `tenantToJson`).
- [ ] Staff sin rol owner recibe **403**.
- [ ] Tenant de otra sesión / cross-tenant: **403** (vía `requireTenantSession` + membership).
- [ ] Registrado en DI (`diod.config.ts`).

## Capas / archivos principales

- `src/contexts/tenants/tenants/application/update/UpdateTenantBranding.ts` (o similar)
- `src/contexts/tenants/tenants/domain/` — repositorio si hace falta `save` parcial
- `src/app/api/tenant/branding/route.ts`
- `src/lib/auth/requireTenantSession.ts`

## Verificación manual

1. Login owner → `PATCH /api/tenant/branding` con nuevos colores.
2. `GET /api/me` devuelve `tenant.primaryColor` actualizado.

## Issue relacionada

- **#17** — UI settings + checklist en `/home` (consume esta API).

## Referencias

- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Phase A
- [`business-onboarding.md`](../domain/business-onboarding.md) — Step 5 Branding
