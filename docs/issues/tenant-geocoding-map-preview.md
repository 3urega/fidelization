## Objetivo

Mostrar un **mapa estático con pin** en `/settings/profile` cuando el tenant tiene coordenadas, para que el owner **vea dónde quedó marcado** su negocio en el mapa.

## Contexto

- Depende de coords persistidas (Phase Q2 #86) y feedback UI (R2) recomendado antes o en paralelo.
- Sin mapa interactivo ni arrastrar pin en este issue.

## Alcance

| In | Fuera |
|----|-------|
| Componente `TenantGeocodingMapPreview` bajo el campo dirección | Mapa interactivo (Leaflet/Mapbox GL) |
| Mapa estático: Mapbox Static Images (dev) o URL equivalente Google Static Maps | Reverse geocoding |
| Solo render si `latitude`/`longitude` not null | Exponer API keys al cliente (usar proxy server o token público restringido por dominio) |
| Alt text / label accesible «Ubicación de tu negocio en el mapa» | Ajuste fino del pin arrastrando |
| Placeholder cuando no hay coords: «Añade y guarda una dirección para ver el mapa» | |

### Implementación sugerida

- Ruta server `GET /api/tenant/geocoding-map-preview` que devuelve URL de imagen firmada o redirect, **o** helper server-side que genera URL con token server-only.
- Evitar filtrar `MAPBOX_ACCESS_TOKEN` al bundle cliente si no hay token público restringido.

## Criterios de aceptación

- [ ] Tenant con coords → preview visible con pin cercano a la dirección guardada.
- [ ] Tenant sin coords → mensaje placeholder, sin imagen rota.
- [ ] Owner empleado no ve formulario de perfil (sin regresión auth).
- [ ] `npm run verify:tenant-geocoding-map-preview` (unit URL builder + E2E opcional con coords seed).

## Capas / archivos principales

- `src/app/_components/tenant/TenantGeocodingMapPreview.tsx`
- `src/lib/platform/tenantGeocodingMapUrl.ts` o API route proxy
- `src/app/_components/tenant/TenantProfileForm.tsx`
- `scripts/verify-tenant-geocoding-map-preview.ts`

## Issues relacionadas

- GitHub #90 (R2, implemented)
- `tenant-geocoding-panel-checklist.md` (R4)

## Referencias

- [`docs/localization.md`](../localization.md)
- [Mapbox Static Images API](https://docs.mapbox.com/api/maps/static-images/)
