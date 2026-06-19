## Objetivo

Nueva pantalla **`/home/map`**: mapa interactivo a pantalla completa (o predominante), editor de zona de búsqueda (suggest, pin, confirmar) y markers de locales geocodificados. Sustituye el mapa embebido en el perfil.

## Contexto

Phase T (#100–#102) dejó la UX de mapa en [`UserSearchZoneEditor`](../../src/app/_components/platform-app/UserSearchZoneEditor.tsx) dentro del perfil. El producto mueve todo el flujo mapa a una ruta dedicada.

Depende de: componentes T (`InteractiveSearchZoneMap`, hooks suggest/markers). Convive con U3 (header link).

## Alcance

| In | Fuera |
|----|-------|
| Ruta `(mobile)/home/map/page.tsx` | Header icons (U3) |
| Extraer/reutilizar lógica de `UserSearchZoneEditor` (suggest, draft, PATCH zona) | Cambios discover sort (U1) |
| Centro inicial: GPS opt-in → zona guardada → default Terrassa | Perfil slim (U4) |
| Markers vía `fetchNearbyEstablishmentMarkers` / API T4 | Lista grid en la misma pantalla |
| `platformRoutes.homeMap` + middleware path protegido | |

## Criterios de aceptación

- [ ] `GET /home/map` (auth user) muestra mapa interactivo
- [ ] Al abrir: intenta GPS; si no, usa `users.search_zone_*`; si no, centro default
- [ ] Usuario puede buscar lugar (suggest), mover pin y **Confirmar zona** (PATCH igual que hoy)
- [ ] Markers de locales geocodificados visibles cerca del pin
- [ ] Fallback 503 map config: mensaje + geocode legacy (patrón T5)
- [ ] Página usable en móvil (mobile-first, tokens theme)

## Capas / archivos principales

- `src/app/(mobile)/home/map/page.tsx`
- `src/app/_components/platform-app/SearchZoneMapScreen.tsx` (nuevo, refactor desde editor)
- [`src/lib/platform/routes.ts`](../../src/lib/platform/routes.ts)
- [`src/middleware.ts`](../../src/middleware.ts) — `isPlatformAppProtectedPath`

## Issues relacionadas

- `platform-app-header-map-link.md` (U3)
- `profile-slim-search-zone-summary.md` (U4)

## Referencias

- [Phase U domain spec](../domain/platform-user-map-screen.md)
- [Phase T map spec](../domain/platform-user-search-zone-interactive-map.md)
