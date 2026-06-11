## Objetivo

Exponer un listado paginado de establecimientos activos para que la app personal pueda mostrar el catálogo global de negocios dados de alta.

## Contexto

Phase I — [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) · [`customer-platform-app.md`](../domain/customer-platform-app.md) (§ Explorar locales). Depende de Phase G (#41 dashboard autenticado). Solo apex; sesión `kind: user`.

## Alcance

| In | Fuera |
|----|-------|
| `DiscoverableEstablishment` + paginación en `TenantRepository` | Búsqueda por texto / filtros |
| `ListDiscoverableEstablishments` (use case) | Geo / mapa |
| `GET /api/user/establishments?page=&limit=` | Incluir tenants `suspended` |
| Solo tenants `status: active`, orden por nombre | Staff / owner APIs |

## Criterios de aceptación

- [ ] `GET` sin sesión user → 401
- [ ] `GET` en subdominio tenant → 403
- [ ] Respuesta `{ establishments: [{ id, name, slug, logoUrl }], hasMore }`
- [ ] `logoUrl` vacío en BD → `null` en JSON
- [ ] Paginación: `page` ≥ 0, `limit` 1–50 (default 20)
- [ ] `npm run verify:platform-app-discover-establishments-use-case`

## Capas / archivos principales

- `src/contexts/tenants/tenants/domain/DiscoverableEstablishment.ts`
- `src/contexts/tenants/tenants/domain/TenantRepository.ts` (`listDiscoverableActive`)
- `src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository.ts`
- `src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments.ts`
- `src/app/api/user/establishments/route.ts`
- `scripts/verify-platform-app-discover-establishments-use-case.ts`

## Issues relacionadas

- `discover-establishments-grid-ui.md`
- `discover-establishments-home-integration.md`

## Referencias

- [post-onboarding-mvp-roadmap.md](../domain/post-onboarding-mvp-roadmap.md) — Phase I
- [customer-platform-app.md](../domain/customer-platform-app.md) — Explorar locales

## Verify

```bash
npm run verify:platform-app-discover-establishments-use-case
```
