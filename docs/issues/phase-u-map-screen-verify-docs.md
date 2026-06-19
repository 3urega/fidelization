## Objetivo

Verifies E2E/domain, documentación (`AGENTS.md`, domain Phase U) y cierre del batch Phase U tras U1–U4.

## Contexto

Batch Phase U: mapa en pantalla propia, header, perfil slim, discover sin filtro por radio. Este issue consolida pruebas smoke y docs.

Depende de: U1, U2, U3, U4.

## Alcance

| In | Fuera |
|----|-------|
| `verify:discover-sort-all-establishments` (use-case + E2E adaptación near) | Nueva funcionalidad |
| `verify:search-zone-map-screen` E2E: `/home/map`, PATCH zona, suggest opcional | |
| Actualizar `verify:discover-grid-search-zone`, `verify:platform-user-search-zone-editor` (perfil sin mapa) | |
| `AGENTS.md` entradas Phase U | |
| Marcar Phase U **Implemented** en domain doc al cerrar | |

## Criterios de aceptación

- [ ] Verify demuestra: con lat/lng la API devuelve más resultados que el antiguo radio (si hay seed lejano)
- [ ] Verify E2E `/home/map` accesible con sesión user
- [ ] Verify perfil sin mapa embebido (HTML shell o API-only según patrón existente)
- [ ] `npm run verify:platform-user-search-zone-editor` pasa (geocode API intacto)
- [ ] `AGENTS.md` documenta nuevos verifies

## Capas / archivos principales

- `scripts/verify-discover-sort-all-establishments.ts`
- `scripts/verify-search-zone-map-screen.ts`
- [`AGENTS.md`](../../AGENTS.md)
- [`platform-user-map-screen.md`](../domain/platform-user-map-screen.md)

## Issues relacionadas

- `discover-sort-all-establishments.md` (U1)
- `profile-map-screen-route.md` (U2)
- `platform-app-header-map-link.md` (U3)
- `profile-slim-search-zone-summary.md` (U4)

## Referencias

- [Phase U domain spec](../domain/platform-user-map-screen.md)
