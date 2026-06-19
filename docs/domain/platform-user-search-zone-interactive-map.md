# Editor interactivo de zona de búsqueda (Phase T)

## Problema

Phase S (#93–#97) entregó persistencia de zona, editor con geocode bajo demanda y **mapa estático** (proxy Phase R #91). El flujo actual exige pulsar «Buscar en mapa» y no permite:

- Ver el mapa **moverse en vivo** mientras el usuario escribe («Terrassa» → cámara hacia el lugar).
- **Explorar** el mapa (zoom, pan) antes de confirmar.
- Ver **locales geocodificados** en el mapa como contexto («¿hay cafés cerca de donde apunto?»).

## Visión de producto

En `/home/profile?tab=personal#search-zone`:

1. El usuario escribe en el campo de búsqueda; tras debounce aparecen **sugerencias** y/o el mapa **vuela** al primer resultado válido.
2. Mapa **interactivo** (pin arrastrable en el centro o marker dedicado) con zoom y desplazamiento.
3. **Marcadores** de establecimientos con coords verificadas en el viewport o radio alrededor del pin.
4. **Confirmar zona** persiste label + coords (igual que hoy); el grid «Explorar» sigue usando `users.search_zone_*`.

## Arquitectura (DDD / hexagonal)

Reutilizar `GeocodingGateway` (#85) y el patrón dual **Mapbox | Google** ya usado en geocode y mapa estático tenant.

| Capa | Responsabilidad |
|------|-----------------|
| **Dominio** | Puertos `PlaceSuggestionGateway` (autocomplete/suggest) e `InteractiveMapClientConfigProvider` (tokens públicos seguros para SDK cliente). VO `MapViewport`, `EstablishmentMapMarker`. |
| **Aplicación** | `SuggestSearchZonePlaces`, `GetInteractiveMapClientConfig`, `ListEstablishmentMapMarkersNearPoint`. |
| **Infra** | `PlaceSuggestionGatewayMapbox`, `PlaceSuggestionGatewayGoogle`; adapters cliente Mapbox GL JS / Google Maps JS (UI, no en dominio). |
| **API** | `GET …/suggest`, `GET …/map-client-config`, `GET …/nearby-establishments` (sesión `kind: user`). |
| **UI** | `InteractiveSearchZoneMap` + refactor `UserSearchZoneEditor`. |

El mapa interactivo corre en **cliente**; geocoding y listado de markers en **servidor**. No duplicar lógica de coords: mismos campos `tenants.latitude/longitude` que discover near.

## Fuera de alcance Phase T

- Radio configurable en UI (sigue default backend 25 km).
- Reverse geocode al arrastrar pin (fase posterior).
- Mapa interactivo en perfil **owner** tenant (`/settings/profile`).
- Clustering avanzado / miles de markers.
- Sustituir mapa estático tenant owner (Phase R sigue válido).

## Dependencias

- Phase S (#95): `UserSearchZoneEditor`, `POST /api/user/search-zone/geocode`, `GET …/map-preview`.
- Phase Q (#87–#88): filtro near + `ListDiscoverableEstablishments`.
- `GeocodingGateway` + env Mapbox/Google ([`external-services-env.md`](../backend/external-services-env.md)).

## Issues GitHub (Phase T)

Manifest: [`docs/issues/manifest.phase-t-interactive-search-zone-map.json`](../issues/manifest.phase-t-interactive-search-zone-map.json)

| # | Issue | Valor |
|---|-------|-------|
| [#98](https://github.com/3urega/fidelization/issues/98) | T1: Live place suggest + API | Autocomplete mientras escribes — **Implemented** 2026-06-19 |
| [#99](https://github.com/3urega/fidelization/issues/99) | T2: Interactive map port + client config | Base DDD Mapbox/Google |
| [#100](https://github.com/3urega/fidelization/issues/100) | T3: Mapa interactivo UI | Pan, zoom, pin arrastrable |
| [#101](https://github.com/3urega/fidelization/issues/101) | T4: Markers de locales | Negocios geocodificados en mapa |
| [#102](https://github.com/3urega/fidelization/issues/102) | T5: Integración editor + verify | UX completa en perfil |

*(Publicado 2026-06-19.)*

**Relacionado:** [`platform-user-profile-search-zone.md`](platform-user-profile-search-zone.md), [`customer-platform-app.md`](customer-platform-app.md).
