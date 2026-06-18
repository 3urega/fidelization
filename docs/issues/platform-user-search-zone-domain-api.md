## Objetivo

Persistir la **zona de búsqueda** del usuario de la app personal en `users` y exponerla vía API para que el grid «Explorar» pueda filtrar por distancia sin depender solo del GPS.

## Contexto

Phase Q (#87) ya filtra locales con `lat`/`lng`/`radiusKm`, pero las coordenadas las envía el cliente en cada petición (GPS efímero). Phase S introduce una preferencia guardada con etiqueta legible (`Terrassa, Barcelona`).

Depende de: modelo `User` en `identity`, `GET /api/user/me`.

## Alcance

| In | Fuera |
|----|-------|
| Migración Prisma: `search_zone_label`, `search_zone_latitude`, `search_zone_longitude`, `search_zone_updated_at` (nullable) | UI de perfil |
| Value object / primitivas `UserSearchZone` en dominio | Geocode de texto (issue S3) |
| Use case `UpdateUserSearchZone` + `ClearUserSearchZone` | Cambio de radio por usuario |
| `GET /api/user/me` incluye `searchZone: { label, latitude, longitude, updatedAt } \| null` | |
| `PATCH /api/user/me/search-zone` body `{ label, latitude, longitude }` | |
| `DELETE /api/user/me/search-zone` o PATCH con `null` para borrar | |
| Repo Prisma + DI | |
| `verify:platform-user-search-zone-use-case` | |

## Criterios de aceptación

- [ ] Usuario autenticado (`kind: user`) puede guardar y leer su zona.
- [ ] Coordenadas inválidas → 400 dominio.
- [ ] Borrar zona deja `searchZone: null` en GET me.
- [ ] Campos no filtrados en listados superadmin sin cambio de contrato público existente.
- [ ] Script verify use case pasa en CI local.

## Capas / archivos principales

- `prisma/schema.prisma` + migración
- `src/contexts/identity/users/domain/` — primitivas User
- `src/contexts/identity/users/application/profile/UpdateUserSearchZone.ts`
- `src/app/api/user/me/search-zone/route.ts`
- `src/lib/auth/http.ts` — serialización `searchZone`
- `scripts/verify-platform-user-search-zone-use-case.ts`

## Issues relacionadas

- `platform-user-profile-shell-tabs.md` (S2)
- `platform-user-search-zone-editor.md` (S3)
- `platform-discover-search-zone-grid-ux.md` (S5)

## Referencias

- [platform-user-profile-search-zone.md](../domain/platform-user-profile-search-zone.md)
- Phase Q #87 — near filter API
