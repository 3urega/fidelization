## Objetivo

Definir el **puerto de dominio** y la API de configuración para mapas interactivos (Mapbox GL JS / Google Maps JS), desacoplados del proveedor concreto, reutilizables en el editor de zona y futuras pantallas.

## Contexto

Hoy `buildTenantGeocodingStaticMapUrl` genera URLs de mapa **estático** server-side. Los mapas interactivos requieren **tokens públicos** y metadatos (provider, style/mapId) entregados de forma segura al cliente autenticado.

Patrón DDD: puerto en dominio, resolución Mapbox/Google en infra, use case fino, ruta API delgada.

Depende de: T1 opcional en paralelo. Bloquea T3 y T5.

## Alcance

| In | Fuera |
|----|-------|
| Puerto `InteractiveMapClientConfigProvider` → `{ provider, publicToken, mapId?, language? }` | Componente React mapa |
| Implementaciones Mapbox + Google (lectura env) | Cargar SDK en SSR |
| Use case `GetInteractiveMapClientConfig` | Markers / suggest |
| `GET /api/user/search-zone/map-client-config` (user session) | Mapa estático tenant (Phase R) |
| Env documentados: token **público** Mapbox (`pk.`) vs secreto geocode; Google Maps JavaScript API key | Owner panel |
| 503 si credenciales no configuradas | |

## Criterios de aceptación

- [ ] Respuesta JSON indica `provider: "mapbox" | "google"` y token usable por SDK cliente
- [ ] No expone secretos server-only (Mapbox sk, geocoding-only keys)
- [ ] Misma selección de provider que `env.geocodingProvider` salvo override documentado
- [ ] Sin sesión → 401
- [ ] `npm run verify:interactive-map-client-config-use-case`
- [ ] Actualizar [`external-services-env.md`](../backend/external-services-env.md)

## Capas / archivos principales

- `src/contexts/shared/maps/domain/InteractiveMapClientConfigProvider.ts`
- `…/domain/InteractiveMapClientConfig.ts` (VO)
- `…/infrastructure/InteractiveMapClientConfigMapbox.ts`, `…Google.ts`
- `src/contexts/identity/users/application/profile/GetInteractiveMapClientConfig.ts`
- `src/app/api/user/search-zone/map-client-config/route.ts`
- `src/lib/env.ts` (claves públicas si faltan)

## Issues relacionadas

- `search-zone-live-place-suggest.md` (T1)
- `search-zone-interactive-map-ui.md` (T3)
- `search-zone-editor-interactive-integration.md` (T5)

## Referencias

- [Phase T domain spec](../domain/platform-user-search-zone-interactive-map.md)
- [`buildTenantGeocodingStaticMapUrl.ts`](../../src/lib/tenant/buildTenantGeocodingStaticMapUrl.ts)
