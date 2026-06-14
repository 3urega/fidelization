## Objetivo

Exponer el **resultado explícito del geocoding** al guardar el perfil del tenant y permitir **reintentar** la geocodificación sin cambiar la dirección, para que frontend y verifies puedan distinguir éxito, fallo y dirección sin coords.

## Contexto

- Phase Q2 (#86): `UpdateTenantProfile` geocodifica al cambiar `address`, pero los fallos se tragan (`console.warn`) y la respuesta solo dice «guardado».
- Depende de `GeocodeAddressString` + `GeocodingGateway` (#85).
- La UI owner (R2) consumirá `geocodingStatus` en la respuesta de `PATCH /api/tenant/profile`.

## Alcance

| In | Fuera |
|----|-------|
| Tipo dominio `TenantGeocodingStatus`: `ok` \| `failed` \| `skipped` \| `cleared` | Autocomplete de dirección |
| `UpdateTenantProfile` devuelve status + mensaje legible (sin filtrar secretos del proveedor) | Mapa / preview (issue R3) |
| `PATCH /api/tenant/profile` incluye `geocodingStatus` y `geocodingMessage?` en JSON | Cambiar campos de dirección estructurados (city/CP) |
| `POST /api/tenant/profile/regeocode` (owner-only): re-ejecuta geocode con `address` actual | Notificaciones email/push al owner |
| Verify use-case stub + E2E mínimo | |

### Semántica

- `ok`: coords persistidas (`latitude`/`longitude` not null).
- `failed`: dirección no vacía pero geocode falló o no configurado; coords null.
- `skipped`: dirección sin cambios respecto al tenant existente (no se geocodifica).
- `cleared`: dirección vaciada; coords borradas.

## Criterios de aceptación

- [ ] PATCH con dirección nueva y geocode OK → `geocodingStatus: "ok"` + tenant con coords.
- [ ] PATCH con dirección nueva y geocode fallido → `geocodingStatus: "failed"` + mensaje útil; dirección guardada.
- [ ] PATCH sin cambio de address → `geocodingStatus: "skipped"`.
- [ ] PATCH con address vacío → `geocodingStatus: "cleared"`.
- [ ] POST regeocode con address existente reintenta y devuelve status.
- [ ] `npm run verify:tenant-geocoding-status-use-case` + extensión E2E de `verify:tenant-geocoding`.

## Capas / archivos principales

- `src/contexts/tenants/tenants/domain/TenantGeocodingStatus.ts`
- `src/contexts/tenants/tenants/application/update/UpdateTenantProfile.ts`
- `src/contexts/tenants/tenants/application/update/RegeocodeTenantProfile.ts` (nuevo)
- `src/app/api/tenant/profile/route.ts`
- `src/app/api/tenant/profile/regeocode/route.ts` (nuevo)
- `scripts/verify-tenant-geocoding-status-use-case.ts`

## Issues relacionadas

- `tenant-geocoding-profile-feedback-ui.md` (R2)
- Phase Q #86 (implementado)

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/backend/external-services-env.md`](../backend/external-services-env.md)
