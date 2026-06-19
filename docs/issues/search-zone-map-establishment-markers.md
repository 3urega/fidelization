## Objetivo

Mostrar en el mapa del editor los **locales** con coordenadas verificadas cerca del punto de búsqueda, para que el usuario vea dónde hay negocios antes de confirmar su zona.

## Contexto

`ListDiscoverableEstablishments` (Phase Q) ya ordena por distancia cuando hay `lat/lng/radiusKm`. Este slice expone un DTO ligero **solo para mapa** (slug, nombre, coords, logo opcional) y lo consume el componente interactivo (T3).

Solo tenants con `latitude` y `longitude` no nulos.

Depende de: T3 (render markers). Puede desarrollarse en paralelo con T3 si se acuerda contrato `markers[]`.

## Alcance

| In | Fuera |
|----|-------|
| VO dominio `EstablishmentMapMarker` | Detalle de promos en popup |
| Use case `ListEstablishmentMapMarkersNearPoint` | Todos los tenants globales sin filtro geo |
| `GET /api/user/search-zone/nearby-establishments?lat=&lng=&radiusKm=` | Paginación infinite scroll |
| Reutilizar Haversine / repo discover near existente | Geocodificar tenants sin coords |
| Marker click → enlace opcional a `/home/establishments/[slug]` en T5 | Owner map |

## Criterios de aceptación

- [ ] Respuesta `{ markers: [{ id, slug, name, latitude, longitude, logoUrl? }] }`
- [ ] Solo establecimientos discoverables activos con coords
- [ ] `radiusKm` default = `DEFAULT_DISCOVER_NEAR_RADIUS_KM` (25); no mostrar en UI
- [ ] Sin sesión user → 401; coords inválidas → 400
- [ ] `npm run verify:search-zone-map-markers-use-case`
- [ ] `npm run verify:search-zone-map-markers` (dev + DATABASE_URL; seed demo geocoded)

## Capas / archivos principales

- `src/contexts/tenants/tenants/domain/EstablishmentMapMarker.ts`
- `…/application/list/ListEstablishmentMapMarkersNearPoint.ts`
- Extensión `TenantRepository` o query Prisma dedicada
- `src/app/api/user/search-zone/nearby-establishments/route.ts`
- Integración props `markers` en `InteractiveSearchZoneMap` (T3)

## Issues relacionadas

- `search-zone-interactive-map-ui.md` (T3)
- `search-zone-editor-interactive-integration.md` (T5)

## Referencias

- [Phase T domain spec](../domain/platform-user-search-zone-interactive-map.md)
- [`ListDiscoverableEstablishments`](../../src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments.ts)
