## Objetivo

Listar **comerciantes** (personas con rol `owner` en algún tenant) para soporte y operaciones comerciales.

## Contexto

- Modelo: `users` + `tenant_memberships.role = owner` ([`saas-architecture.md`](../domain/saas-architecture.md)).
- Identidad unificada: mismo `users` puede ser owner y cliente app ([`customer-platform-app.md`](../domain/customer-platform-app.md)).
- Visión: [`docs/superadmin.md`](../superadmin.md) § Comerciantes.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/owners` listado paginado | Reset password desde UI (delegar a flujo email futuro) |
| Columnas: nombre, email, negocios (slugs), plan principal del tenant, estado tenant | Bloquear usuario global (v2) |
| `GET /api/platform/owners` | CRUD membership |
| Enlace a detalle tenant y acción impersonar (si P3 listo) | Último acceso (requiere tracking; omitir o mostrar «N/D») |

## Criterios de aceptación

- [ ] Lista solo memberships `owner`; no mezcla employees ni superadmin.
- [ ] Superadmin sin membership no aparece como comerciante.
- [ ] Búsqueda por email o nombre (query param).
- [ ] Verify use case + E2E.

## Capas / archivos principales

- `ListPlatformOwners` use case + Prisma query join memberships/tenants/plans
- `(platform)/platform/owners/page.tsx`

## Issues relacionadas

- `platform-admin-impersonate-tenant.md` (P3)
- `platform-admin-end-users-list.md` (P9)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
