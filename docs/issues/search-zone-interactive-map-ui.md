## Objetivo

Componente React de **mapa interactivo** para el editor de zona: pan, zoom (rueda/pinch), pin arrastrable y API uniforme independiente del proveedor (Mapbox GL JS o Google Maps JS).

## Contexto

Phase S muestra `<img>` del proxy estático. Este slice entrega la pieza UI reutilizable consumiendo `GET /api/user/search-zone/map-client-config` (T2).

El dominio no importa SDKs; solo la capa `_components` / adapters cliente.

Depende de: T2. Bloquea T4 y T5.

## Alcance

| In | Fuera |
|----|-------|
| `InteractiveSearchZoneMap` con props: `center`, `zoom`, `onCenterChange`, `markers[]`, `interactive` | Integración completa en editor (T5) |
| Adapter Mapbox GL JS (`mapbox-gl` o `@mapbox/mapbox-gl`) | Adapter Leaflet |
| Adapter Google Maps JS (`@react-google-maps/api` o loader oficial) | Clustering |
| Carga dinámica del SDK según `provider` | SSR del mapa |
| Estados: loading, error (sin config), fallback mensaje | Markers API (T4) |
| Pin draggable → emite nuevas coords al soltar | Reverse geocode label |
| Controles zoom +/- o gestos nativos del SDK | |

## Criterios de aceptación

- [ ] Usuario puede **desplazar** y **ampliar/reducir** el mapa con ratón/touch
- [ ] Al arrastrar el pin, `onCenterChange` recibe `{ latitude, longitude }` actualizados
- [ ] Cambio de `center` externo (p. ej. al elegir sugerencia T1) mueve la cámara (`flyTo` / equivalente)
- [ ] Funciona con provider Mapbox **o** Google según config API (probar ambos en dev si hay keys)
- [ ] Sin credenciales → UI de fallback clara (no crash)
- [ ] Estilos acordes a tokens theme (`docs/frontend/style-guidelines.md`)
- [ ] Story/dev page mínima o verify que monta el componente con coords demo (opcional en verify E2E T5)

## Capas / archivos principales

- `src/app/_components/platform-app/maps/InteractiveSearchZoneMap.tsx`
- `…/maps/MapboxInteractiveMap.tsx`, `…/GoogleInteractiveMap.tsx`
- `src/app/_components/platform-app/maps/types.ts` (props compartidas)
- `package.json` (deps SDK; lazy import)

## Issues relacionadas

- `search-zone-interactive-map-port.md` (T2)
- `search-zone-map-establishment-markers.md` (T4)
- `search-zone-editor-interactive-integration.md` (T5)

## Referencias

- [Phase T domain spec](../domain/platform-user-search-zone-interactive-map.md)
