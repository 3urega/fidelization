## Objetivo

En el tab **Mis tarjetas** del perfil, mostrar un resumen de las **campañas de sellos activas y completadas** del usuario en todos sus locales.

## Contexto

`GET /api/user/me/relationships` ya devuelve `stampProgress[]` por establecimiento en «Mis locales». Este issue agrega una vista agregada en perfil, agrupada por estado (en curso vs completadas).

Depende de: S2 (shell tabs). Puede usar datos existentes de relationships o un use case dedicado si hace falta paginación.

## Alcance

| In | Fuera |
|----|-------|
| Tab `?tab=tarjetas` con listado real | Canje de premios desde perfil |
| Secciones: «En curso» (`current > 0 && !completed`) y «Completadas» | Historial de visitas |
| Cada fila: nombre local, campaña, progreso `N/M`, enlace a `/home/establishments/[slug]` | Recompensas/puntos globales |
| Empty state si no hay tarjetas | |
| Use case `ListUserStampCardsSummary` (opcional si agregación compleja) | |
| `verify:platform-user-stamp-cards-tab` | |

## Criterios de aceptación

- [ ] Usuario con sellos en 2+ locales ve tarjetas agrupadas correctamente.
- [ ] Campañas completadas aparecen en sección Completadas.
- [ ] Campañas disponibles sin progreso (`0/N`) no se mezclan como «en curso» salvo criterio producto acordado (documentar en verify).
- [ ] Tap en tarjeta abre detalle del local.
- [ ] Usuario sin locales muestra empty state amigable.

## Capas / archivos principales

- `src/contexts/loyalty/customers/application/profile/ListUserStampCardsSummary.ts` (si hace falta)
- `src/app/api/user/me/stamp-cards/route.ts` (opcional; preferir reutilizar relationships)
- `src/app/(mobile)/home/profile/PlatformUserStampCardsTab.tsx`
- Componentes reutilizando `StampCampaignCards` / progreso visual Phase J

## Issues relacionadas

- `platform-user-profile-shell-tabs.md` (S2)

## Referencias

- [platform-user-profile-search-zone.md](../domain/platform-user-profile-search-zone.md)
- Phase G #41 — relationships API
