## Objetivo

Header compartido de la app personal: enlace **Perfil** como **icono de usuario** y enlace **Ver en el mapa** junto a él, apuntando a `/home/map`.

## Contexto

Hoy [`PlatformUserDashboard`](../../src/app/(mobile)/home/PlatformUserDashboard.tsx) muestra texto «Perfil» en el header. Tras U2 existirá `/home/map`; el acceso debe ser visible desde el home (y reutilizable en la pantalla mapa).

## Alcance

| In | Fuera |
|----|-------|
| Componente `PlatformAppHeader` (o similar) con slot título opcional | Lógica mapa (U2) |
| Icono usuario → `/home/profile` (`aria-label="Perfil"`) | Iconografía custom SVG pesada; usar SVG inline theme-safe |
| Link/texto «Ver en el mapa» → `platformRoutes.homeMap` | Bottom tab bar |
| Integrar en `PlatformUserDashboard` | Perfil screen back link (opcional mismo header) |

## Criterios de aceptación

- [ ] En `/home`, header muestra icono perfil (no texto «Perfil»)
- [ ] «Ver en el mapa» visible y navega a `/home/map`
- [ ] Accesibilidad: labels/aria en iconos y enlaces
- [ ] Estilos con tokens theme (sin colores hardcodeados)
- [ ] QR button y saludo existentes no rotos

## Capas / archivos principales

- `src/app/_components/platform-app/PlatformAppHeader.tsx`
- [`PlatformUserDashboard.tsx`](../../src/app/(mobile)/home/PlatformUserDashboard.tsx)
- [`routes.ts`](../../src/lib/platform/routes.ts) — `homeMap: "/home/map"`

## Issues relacionadas

- `profile-map-screen-route.md` (U2)
- `profile-slim-search-zone-summary.md` (U4)

## Referencias

- [Phase U domain spec](../domain/platform-user-map-screen.md)
- [`style-guidelines.md`](../frontend/style-guidelines.md)
