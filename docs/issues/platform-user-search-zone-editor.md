## Objetivo

Permitir al usuario **definir su zona de búsqueda** desde el tab Información personal: buscar un lugar por texto, ver el pin en mapa y **confirmar** para guardar.

## Contexto

Flujo deseado: «locales en Terrassa (Barcelona)» → geocodificar → preview mapa con pin → confirmar → `PATCH /api/user/me/search-zone`.

Reutilizar infra existente: `GeocodingGateway` (#85), patrón mapa estático (#91) para preview server-side (sin exponer tokens).

Depende de: S1 (API persistencia), S2 (shell perfil).

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/user/search-zone/geocode` body `{ query }` → `{ label, latitude, longitude }` (server-side) | Autocomplete Mapbox en cliente |
| UI: input lugar + botón «Buscar en mapa» | Arrastrar pin en mapa interactivo (futuro) |
| Preview mapa con pin (static map proxy o componente reutilizado de tenant) | Reverse geocode al mover pin |
| Botones «Confirmar zona» / «Cancelar» | |
| Integración en `/home/profile?tab=personal` y deep link desde grid | |
| Manejo errores geocode (sin resultados, proveedor caído) | |

## Criterios de aceptación

- [ ] Usuario escribe «Terrassa, Barcelona», geocode devuelve coords y label legible.
- [ ] Preview muestra mapa con pin en coords propuestas.
- [ ] Confirmar llama PATCH search-zone y actualiza UI del perfil.
- [ ] Cancelar no persiste cambios.
- [ ] Geocode sin resultados → mensaje claro, no crash.
- [ ] `verify:platform-user-search-zone-editor` (API + UI smoke con dev server).

## Capas / archivos principales

- `src/contexts/identity/users/application/profile/GeocodeUserSearchZoneQuery.ts` (o reutilizar GeocodeAddressString)
- `src/app/api/user/search-zone/geocode/route.ts`
- `src/app/_components/platform-app/UserSearchZoneEditor.tsx`
- Reutilizar/adaptar `buildStaticMapUrl` / proxy de tenant geocoding map preview

## Issues relacionadas

- `platform-user-search-zone-domain-api.md` (S1)
- `platform-user-profile-shell-tabs.md` (S2)
- `platform-discover-search-zone-grid-ux.md` (S5)

## Referencias

- [platform-user-profile-search-zone.md](../domain/platform-user-profile-search-zone.md)
- Phase R #91 — static map preview
