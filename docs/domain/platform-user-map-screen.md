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

Manifest: [`docs/issues/manifest.phase-u-map-screen-discover-sort.json`](../issues/manifest.phase-u-map-screen-discover-sort.json)

| # | Issue | Valor |
|---|-------|-------|
| [#103](https://github.com/3urega/fidelization/issues/103) | U1: Discover sort-by-distance, show all | Backend: no filtrar por radio |
| [#104](https://github.com/3urega/fidelization/issues/104) | U2: Map screen `/home/map` | Pantalla mapa + editor zona |
| [#105](https://github.com/3urega/fidelization/issues/105) | U3: App header icons | Perfil icono + Ver en el mapa |
| [#106](https://github.com/3urega/fidelization/issues/106) | U4: Profile slim + CTA routes | Quitar mapa del perfil; links al mapa |
| [#107](https://github.com/3urega/fidelization/issues/107) | U5: Verify + docs Phase U | E2E + cierre batch |

**Orden sugerido:** U1 → U2 → U3 → U4 → U5 (U3 puede ir en paralelo con U2).

**Relacionado:** [`platform-user-profile-search-zone.md`](platform-user-profile-search-zone.md), [`platform-user-search-zone-interactive-map.md`](platform-user-search-zone-interactive-map.md).
