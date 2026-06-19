## Objetivo

Quitar el mapa y el editor interactivo del perfil; dejar **resumen** de zona guardada + enlace al mapa. Actualizar CTAs del grid y copy para apuntar a `/home/map`. Integrar grid con orden «todos los locales» (U1).

## Contexto

Phase T integró [`UserSearchZoneEditor`](../../src/app/_components/platform-app/UserSearchZoneEditor.tsx) en [`PlatformUserProfilePersonalTab`](../../src/app/(mobile)/home/profile/PlatformUserProfilePersonalTab.tsx). U2 mueve la edición al mapa; U1 cambia semántica de proximidad en discover.

## Alcance

| In | Fuera |
|----|-------|
| Perfil personal: label zona + «Cambiar en el mapa» / «Establecer zona en el mapa» | Implementar `/home/map` (U2) |
| Eliminar `#search-zone` hash y editor embebido del perfil | Backend sort (U1) |
| CTAs grid: `homeProfileSearchZone()` → `homeMap()` | Header (U3) |
| [`EstablishmentDiscoverGrid`](../../src/app/_components/platform-app/EstablishmentDiscoverGrid.tsx): copy sin «radio»; vacío sin implicar filtro estricto | |
| [`resolveDiscoverActiveNear`](../../src/lib/platform/buildDiscoverEstablishmentsQuery.ts): siempre enviar lat/lng cuando hay referencia pero esperar **todos** los items (post U1) | |
| Actualizar chip «Cerca de {label}» + subtítulos | |

## Criterios de aceptación

- [ ] `/home/profile` tab personal **no** renderiza mapa ni suggest
- [ ] Zona guardada muestra label; link abre `/home/map`
- [ ] «Establecer zona de búsqueda» en grid → `/home/map`
- [ ] «Editar zona» en vacíos → `/home/map`
- [ ] Con zona o GPS activo, grid lista **todos** los locales ordenados por distancia (U1)
- [ ] Sin referencia, orden alfabético
- [ ] Regresión: `verify:platform-user-profile-shell` pasa

## Capas / archivos principales

- [`PlatformUserProfilePersonalTab.tsx`](../../src/app/(mobile)/home/profile/PlatformUserProfilePersonalTab.tsx)
- [`UserSearchZoneEditor.tsx`](../../src/app/_components/platform-app/UserSearchZoneEditor.tsx) — mover a map screen o deprecar en perfil
- [`EstablishmentDiscoverGrid.tsx`](../../src/app/_components/platform-app/EstablishmentDiscoverGrid.tsx)
- [`DiscoverSearchZoneChip.tsx`](../../src/app/_components/platform-app/DiscoverSearchZoneChip.tsx)
- [`routes.ts`](../../src/lib/platform/routes.ts)

## Issues relacionadas

- `discover-sort-all-establishments.md` (U1)
- `profile-map-screen-route.md` (U2)
- `platform-app-header-map-link.md` (U3)

## Referencias

- [Phase U domain spec](../domain/platform-user-map-screen.md)
- [`platform-user-profile-search-zone.md`](../domain/platform-user-profile-search-zone.md)
