## Objetivo

Añadir en el grid **Explorar locales** un control **«Cerca de mí»** que obtiene la ubicación del usuario (web o Capacitor), llama al API near de Q3 y muestra **distancia** en cada tarjeta.

## Contexto

- Depende de **Q3** (`discover-establishments-near-filter.md`).
- UI actual: `EstablishmentDiscoverGrid`, `EstablishmentDiscoverCard`, `DiscoverTagFilterBar`.
- App Capacitor: permiso geolocation; fallback si denegado.

## Alcance

| In | Fuera |
|----|-------|
| Toggle/chip «Cerca de mí» junto a filtros de tags | Mapa interactivo |
| Hook `useUserLocation` (browser `navigator.geolocation`; Capacitor `@capacitor/geolocation` si disponible) | Búsqueda manual por ciudad/CP (follow-up) |
| Al activar: `GET …?lat=&lng=&radiusKm=` + reset paginación | Persistir ubicación en servidor |
| Mostrar `distanceKm` formateado en card (p. ej. «1,2 km») | Abrir Google Maps desde card (opcional follow-up) |
| Estados UX: cargando permiso, permiso denegado, sin locales cercanos, error red | |
| Desactivar near vuelve al listado alfabético actual | |
| Combinable con filtro tags | |

### UX permiso denegado

- Mensaje claro: «Activa la ubicación para ver locales cerca de ti» + botón reintentar.
- No bloquear el grid: usuario puede seguir explorando sin near.

### Capacitor

- Reutilizar patrón `platformFetch` / env API URL.
- Documentar permiso en `AndroidManifest` / Info.plist si falta (ver `verify:platform-app-capacitor-config`).

## Criterios de aceptación

- [ ] Toggle near activo solicita ubicación y carga grid ordenado por distancia.
- [ ] Cards muestran distancia cuando `distanceKm` presente.
- [ ] Permiso denegado muestra mensaje sin romper el grid.
- [ ] Tags + near funcionan juntos.
- [ ] Regresión: `verify:platform-app-discover-establishments` pasa (modo sin near).
- [ ] `npm run verify:discover-grid-cerca-de-mi` smoke E2E (dev + DATABASE_URL + coords seed + geolocation mockeable o query params de test).

## Verify

```bash
npm run verify:platform-app-discover-establishments
npm run verify:discover-grid-cerca-de-mi
```

## Capas / archivos principales

- `src/app/_components/platform-app/EstablishmentDiscoverGrid.tsx`
- `src/app/_components/platform-app/EstablishmentDiscoverCard.tsx`
- `src/app/_components/platform-app/DiscoverNearMeToggle.tsx` (nuevo)
- `src/lib/platform/useUserLocation.ts` (nuevo)
- `src/app/_components/platform-app/DiscoverTagFilterBar.tsx` — layout conjunto
- `scripts/verify-discover-grid-cerca-de-mi.ts`
- `AGENTS.md`, `docs/localization.md`

## Issues relacionadas

- `discover-establishments-near-filter.md` (Q3) — prerequisito

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/domain/customer-platform-app.md`](../domain/customer-platform-app.md)
