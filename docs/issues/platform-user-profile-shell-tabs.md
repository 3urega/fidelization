## Objetivo

Crear la pantalla **Perfil** de la app personal (`/home/profile`) con navegación por **tabs**: Información personal y Mis tarjetas.

## Contexto

Hoy `/home` es solo dashboard (Explorar · Mis locales · Mis negocios). No hay sitio para preferencias ni resumen de fidelización. Este issue entrega el shell y el tab Información personal (datos básicos + placeholder/enlace a zona de búsqueda).

Depende de: S1 (API searchZone) para mostrar zona guardada; puede mergearse en paralelo con mock.

## Alcance

| In | Fuera |
|----|-------|
| Ruta `/home/profile` + `platformRoutes.homeProfile` | Editor completo de zona (S3) |
| Tabs: `?tab=personal` (default), `?tab=tarjetas` | Contenido tab tarjetas (S4) |
| Tab personal: nombre, email desde `GET /api/user/me` | PATCH nombre/email |
| Sección «Zona de búsqueda»: muestra label guardado o empty state + CTA | |
| Acceso desde `/home`: icono/enlace «Perfil» en header del dashboard | Logout puede quedarse en home o moverse aquí |
| Middleware: ruta protegida `kind: user` | Bottom nav global (opcional futuro) |

## Criterios de aceptación

- [ ] Usuario logueado abre `/home/profile` y ve tabs con URL estable (`?tab=`).
- [ ] Tab personal muestra nombre y email.
- [ ] Si hay `searchZone`, muestra etiqueta y botón «Cambiar zona» (navega a flujo S3 o ancla).
- [ ] Si no hay zona, copy amigable + botón «Establecer zona de búsqueda».
- [ ] Tab tarjetas muestra placeholder «Próximamente» o enlace a S4 si ya implementada.
- [ ] `verify:platform-user-profile-shell` (smoke E2E dev server).

## Capas / archivos principales

- `src/app/(mobile)/home/profile/page.tsx`
- `src/app/(mobile)/home/profile/PlatformUserProfileScreen.tsx`
- `src/lib/platform/routes.ts`
- `src/middleware.ts` — proteger `/home/profile`
- `src/app/(mobile)/home/PlatformUserDashboard.tsx` — enlace Perfil

## Issues relacionadas

- `platform-user-search-zone-domain-api.md` (S1)
- `platform-user-search-zone-editor.md` (S3)
- `platform-user-stamp-cards-tab.md` (S4)

## Referencias

- [platform-user-profile-search-zone.md](../domain/platform-user-profile-search-zone.md)
- [customer-platform-app.md](../domain/customer-platform-app.md)
