# Pantalla de mapa y orden discover sin filtro (Phase U)

## Problema

Phase T (#98–#102) integró el mapa interactivo y el editor de zona en el tab **Información personal** del perfil. Eso mezcla datos de cuenta con una experiencia espacial que merece pantalla propia.

Además, el grid «Explorar» con zona guardada o «Cerca de mí» **filtra** por radio (25 km): el usuario deja de ver locales lejanos. El producto debe **ordenar por distancia** cuando hay referencia (zona o GPS), pero **mostrar siempre todos** los establecimientos discoverables.

## Visión de producto

### Pantalla `/home/map`

- Punto único para **ver el mapa**, **establecer/cambiar zona de búsqueda** y ver **markers** de locales geocodificados.
- Al abrir: centro en GPS actual (si el usuario lo permite) o en la **zona guardada**; si no hay ninguna, centro por defecto (Terrassa).
- Misma UX interactiva que Phase T (suggest, pan/zoom, pin, confirmar zona).
- Accesible desde el header («Ver en el mapa») y desde CTAs del grid («Establecer zona de búsqueda»).

### Header app personal

- Enlace **Perfil** → icono de usuario (`/home/profile`).
- Enlace **Ver en el mapa** junto al icono → `/home/map`.

### Perfil (`/home/profile`)

- Tab personal: nombre, email; **resumen** de zona guardada (label) + enlace «Cambiar en el mapa».
- **Sin** mapa interactivo ni editor embebido.

### Grid «Explorar»

| Referencia activa | Comportamiento lista |
|-------------------|----------------------|
| Ninguna (sin zona ni GPS) | Todos los locales, orden **alfabético** |
| Zona guardada o GPS | Todos los locales; **orden por distancia**; sin coords al **final**, alfabético entre ellos |

El parámetro `radiusKm` deja de **filtrar** resultados; solo puede usarse en APIs de mapa/markers si aplica.

## Arquitectura

| Capa | Cambio |
|------|--------|
| **API** | `GET /api/user/establishments` con `lat/lng`: sort-by-distance, sin `WHERE distance <= radius` |
| **UI mapa** | Nueva ruta `(mobile)/home/map`, reutiliza `InteractiveSearchZoneMap` + hooks T |
| **UI shell** | `PlatformAppHeader` compartido en home (y mapa) |
| **Perfil** | Resumen zona; CTAs → `/home/map` |

## Fuera de alcance Phase U

- Reverse geocode al arrastrar pin.
- Clustering en mapa.
- Mapa en perfil owner tenant.
- Edición nombre/email en perfil.

## Issues GitHub (Phase U)

| # | Issue | Estado |
|---|-------|--------|
| [#103](https://github.com/3urega/fidelization/issues/103) | U1: Discover sort-by-distance, show all | **Implemented** 2026-06-19 |
| [#104](https://github.com/3urega/fidelization/issues/104) | U2: Map screen `/home/map` | **Implemented** 2026-06-19 |
| [#105](https://github.com/3urega/fidelization/issues/105) | U3: App header icons | **Implemented** 2026-06-19 |
| [#106](https://github.com/3urega/fidelization/issues/106) | U4: Profile slim + CTA routes | **Implemented** 2026-06-19 |
| [#107](https://github.com/3urega/fidelization/issues/107) | U5: Verify + docs Phase U | **Implemented** 2026-09-11 |

**Orden sugerido:** U1 → U2 → U3 → U4 → U5 (U3 puede ir en paralelo con U2).

## Implementation status (U1)

| Artefacto | Ruta |
|-----------|------|
| Use case | [`ListDiscoverableEstablishments`](../../src/contexts/tenants/tenants/application/list/ListDiscoverableEstablishments.ts) — sort-by-distance, sin filtro radio |
| API | `GET /api/user/establishments?lat=&lng=` |
| Verifies | `npm run verify:discover-sort-all-establishments-use-case`, `npm run verify:discover-sort-all-establishments` |

## Implementation status (U2)

| Artefacto | Ruta |
|-----------|------|
| UI | [`/home/map`](../../src/app/(mobile)/home/map/page.tsx) — [`PlatformSearchZoneMapScreen.tsx`](../../src/app/(mobile)/home/map/PlatformSearchZoneMapScreen.tsx) |
| Verifies | `npm run verify:search-zone-map-screen` |

## Implementation status (U3–U4)

| Artefacto | Ruta |
|-----------|------|
| Header | [`PlatformAppHeader`](../../src/app/_components/platform-app/PlatformAppHeader.tsx) — icono perfil + «Ver en el mapa» |
| Perfil slim | [`/home/profile`](../../src/app/(mobile)/home/profile/) — resumen zona, link `/home/map` |
| Verifies | `npm run verify:platform-user-profile-shell`, `npm run verify:platform-user-search-zone-editor`, `npm run verify:discover-grid-search-zone` |

## Implementation status (U5)

| Artefacto | Ruta |
|-----------|------|
| Operativa | [`AGENTS.md`](../../AGENTS.md) — rutas Phase U + bloque `verify:*` |
| Verifies registry | [`package.json`](../../package.json) — scripts canónicos U1/U2 + aliases `verify:discover-establishments-near*` |

Phase U cerrada (#103–#107). Manifest `manifest.phase-u-map-screen-discover-sort.json` eliminado al cerrar #107.

**Relacionado:** [`platform-user-profile-search-zone.md`](platform-user-profile-search-zone.md), [`platform-user-search-zone-interactive-map.md`](platform-user-search-zone-interactive-map.md).
