## Objetivo

Cambiar el grid «Explorar» para que **zona guardada** y **Cerca de mí** **ordenen por distancia** sin ocultar locales: siempre se listan todos los establecimientos discoverables activos; los que no tienen coords van al final, ordenados alfabéticamente.

## Contexto

Hoy `GET /api/user/establishments?lat=&lng=&radiusKm=` aplica `WHERE distance_km <= radiusKm` en [`PrismaTenantRepository.listDiscoverableActiveNear`](../../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository.ts). Phase S5 (#97) usa ese filtro por defecto cuando hay zona o GPS.

El producto pide ver **todos** los locales; la proximidad solo afecta al **orden**.

## Alcance

| In | Fuera |
|----|-------|
| Query Prisma/SQL: quitar filtro por radio; `ORDER BY distance_km ASC NULLS LAST, name ASC, id ASC` | Cambios UI grid (issue U4) |
| Incluir tenants **sin** lat/lng en la lista (distance null → final) | Map screen |
| Mantener paginación offset/limit existente | Eliminar param `radiusKm` de la API (puede ignorarse para filtro) |
| Actualizar copy backend/tests si mencionan «radio vacío» | Markers map API (T4) |
| `npm run verify:discover-establishments-near-use-case` + E2E regresión/adaptación | |

## Criterios de aceptación

- [ ] Con `lat/lng`: respuesta incluye locales **fuera** del antiguo radio 25 km, ordenados por `distanceKm` ascendente
- [ ] Locales sin coords verificadas aparecen al final, orden alfabético por nombre
- [ ] Sin `lat/lng`: orden alfabético global (comportamiento actual sin near)
- [ ] `distanceKm` presente en ítems con coords cuando hay near; omitido o null sin coords
- [ ] Tags filter sigue funcionando
- [ ] Verifies discover near actualizados y pasan

## Capas / archivos principales

- [`PrismaTenantRepository.ts`](../../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository.ts) — `listDiscoverableActiveNear`
- [`DiscoverableEstablishment.ts`](../../src/contexts/tenants/tenants/domain/DiscoverableEstablishment.ts) — `distanceKm` opcional
- [`scripts/verify-discover-establishments-near-use-case.ts`](../../scripts/verify-discover-establishments-near-use-case.ts)
- [`scripts/verify-discover-establishments-near.ts`](../../scripts/verify-discover-establishments-near.ts)

## Issues relacionadas

- `profile-map-screen-route.md` (U2)
- `discover-grid-sort-all-integration.md` (U4)

## Referencias

- [Phase U domain spec](../domain/platform-user-map-screen.md)
