## Objetivo

En **`/settings/profile`**, el owner ve **feedback claro** tras guardar la dirección: ubicación confirmada, pendiente de verificar o error con acción de reintentar. Sin mapa aún (issue R3).

## Contexto

- Depende de **R1** (`geocodingStatus` en API) o lectura de `latitude`/`longitude`/`geocodedAt` en `GET /api/me`.
- Hoy `TenantProfileForm` muestra solo «Datos guardados correctamente» aunque el geocode falle.
- `TenantSessionProvider` no tipa coords en sesión.

## Alcance

| In | Fuera |
|----|-------|
| Extender `TenantSessionTenant` con `latitude`, `longitude`, `geocodedAt`, `geocodingProvider?` | Mapa embebido (R3) |
| Tras PATCH: banner según `geocodingStatus` (ok / failed / cleared) | Editar coords manualmente |
| Estado persistente al cargar: «Ubicación confirmada el …» si hay coords | |
| Botón «Reintentar ubicación» → `POST /api/tenant/profile/regeocode` | |
| Mensaje si hay address pero coords null: «Revisa la dirección o reintenta» | |
| Theme tokens; sin colores hardcodeados | |

## Criterios de aceptación

- [ ] Guardar dirección + geocode OK → mensaje de éxito con indicación de ubicación confirmada.
- [ ] Guardar dirección + geocode failed → aviso visible (no solo éxito genérico) + reintentar.
- [ ] Recargar página con coords → estado «confirmada» sin guardar de nuevo.
- [ ] Regresión: `verify:tenant-profile` pasa.
- [ ] `npm run verify:tenant-geocoding-profile-feedback` smoke (dev + PATCH asserts en JSON).

## Capas / archivos principales

- `src/app/_components/tenant/TenantProfileForm.tsx`
- `src/app/_components/tenant/TenantGeocodingStatusBanner.tsx` (nuevo)
- `src/app/_components/shell/TenantSessionProvider.tsx`
- `scripts/verify-tenant-geocoding-profile-feedback.ts`

## Issues relacionadas

- `tenant-geocoding-status-api.md` (R1)
- `tenant-geocoding-map-preview.md` (R3)

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/frontend/style-guidelines.md`](../frontend/style-guidelines.md)
