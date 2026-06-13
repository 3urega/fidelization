## Objetivo

Extender **`GET /api/user/establishments`** y `ListDiscoverableEstablishments` para filtrar y ordenar locales **por distancia** cuando el cliente envía coordenadas (`lat`, `lng`, `radiusKm` opcional).

## Contexto

- Depende de **Q2** (tenants con `latitude`/`longitude`).
- API actual: paginación + filtro tags; orden alfabético (`PrismaTenantRepository.listDiscoverableActive`).
- Phase I discover: `verify:platform-app-discover-establishments*`.

## Alcance

| In | Fuera |
|----|-------|
| Params query opcionales: `lat`, `lng`, `radiusKm` (default p. ej. 25 km, max 100) | PostGIS / índice espacial |
| Validación dominio: `DiscoverNearFilter`, `InvalidDiscoverNearFilter` | Reverse geocoding por ciudad |
| Haversine en SQL (`$queryRaw`) o capa repo dedicada | Mapa embebido |
| Solo tenants `status=active` **con coords no null** entran en modo near | Ocultar locales sin coords del modo near (sí: excluirlos) |
| Respuesta: `distanceKm` en cada `DiscoverableEstablishment` cuando near activo | Enviar coords del usuario al servidor sin sesión user |
| Orden: distancia ASC, desempate `name` | Geocoding (Q1/Q2) |
| Compatibilidad: sin params near → comportamiento actual (nombre ASC) | |
| Combinable con filtro `tags` (AND) | |

### Contrato API (ejemplo)

```http
GET /api/user/establishments?lat=41.579&lng=1.617&radiusKm=10&offset=0&limit=6
```

```json
{
  "establishments": [
    { "id": "…", "name": "…", "slug": "…", "distanceKm": 1.2, "tags": [] }
  ],
  "hasMore": true
}
```

- `lat`/`lng` inválidos o fuera de rango → 400 `InvalidDiscoverNearFilter`.
- Solo `lat` o solo `lng` → 400.

## Criterios de aceptación

- [ ] Near filter devuelve locales ordenados por distancia dentro del radio.
- [ ] Locales sin coordenadas no aparecen en modo near.
- [ ] Sin params near, regresión idéntica a hoy (tags + paginación).
- [ ] `npm run verify:discover-establishments-near-use-case` (stub repo con coords fijas).
- [ ] `verify:platform-app-discover-establishments*` extendido o `verify:discover-establishments-near` E2E con tenants seed con coords.

## Verify

```bash
npm run verify:discover-establishments-near-use-case
npm run verify:discover-establishments-near
```

## Capas / archivos principales

- `src/contexts/tenants/tenants/domain/DiscoverableEstablishment.ts` — añadir `distanceKm?`
- `src/contexts/tenants/tenants/domain/DiscoverNearFilter.ts`
- `src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments.ts`
- `src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository.ts`
- `src/contexts/shared/domain/` o `tenants/` — util Haversine si aplica
- `src/app/api/user/establishments/route.ts`
- `scripts/verify-discover-establishments-near*.ts`

## Issues relacionadas

- `tenant-geocoding-on-profile-save.md` (Q2) — prerequisito
- `discover-grid-cerca-de-mi-ui.md` (Q4)

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/domain/customer-platform-app.md`](../domain/customer-platform-app.md) — Phase I discover
