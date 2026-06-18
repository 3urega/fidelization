## Objetivo

Integrar la **zona de búsqueda guardada** en el grid «Explorar», mejorar el copy de proximidad y eliminar mensajes técnicos tipo «en este radio».

## Contexto

Phase Q4 (#88) añadió toggle «Cerca de mí» (GPS). Con S1–S3 el usuario puede tener zona persistida. El grid debe:

1. Usar zona guardada como filtro near **por defecto** cuando exista.
2. Mantener GPS como «Ahora cerca de mí» (opt-in, renombrar toggle).
3. Mostrar chip contextual: «Cerca de Terrassa» (editable → perfil).
4. Botón **Establecer zona de búsqueda** cuando no hay zona.
5. Vacíos humanos, sin mencionar radio km.

Depende de: S1 (API), S3 (editor) recomendado antes de E2E completo; puede desarrollarse con fixtures.

## Alcance

| In | Fuera |
|----|-------|
| Cargar `searchZone` desde `GET /api/user/me` en grid | Cambiar default `radiusKm` en backend |
| Modo **En mi zona**: `lat`/`lng` de searchZone | Selector de radio en UI |
| Renombrar toggle GPS → «Ahora cerca de mí» (o similar) | Eliminar modo GPS |
| Chip/banner zona activa + enlace editar | |
| CTA «Establecer zona de búsqueda» → `/home/profile?tab=personal` | |
| Empty: *«No hay locales cerca de {label}. Prueba otra zona o explora todos los locales.»* | |
| `distanceKm` en cards cuando filtro near activo (zona o GPS) | |
| Actualizar `verify:discover-grid-cerca-de-mi` + nuevo verify zona guardada | |

## Criterios de aceptación

- [ ] Usuario con zona guardada ve grid filtrado al abrir Explorar (sin pedir GPS).
- [ ] Usuario sin zona ve listado completo + CTA establecer zona (no mensaje de radio).
- [ ] Toggle GPS sigue funcionando y tiene prioridad sobre zona cuando está activo (documentar precedencia).
- [ ] Empty state nunca dice «radio» ni «25 km».
- [ ] Botón del grid lleva al editor de zona en perfil.
- [ ] Scripts verify pasan.

## Capas / archivos principales

- `src/app/_components/platform-app/EstablishmentDiscoverGrid.tsx`
- `src/app/_components/platform-app/DiscoverNearMeToggle.tsx` — rename/copy
- Nuevo `DiscoverSearchZoneChip.tsx` o similar
- `src/lib/platform/buildDiscoverEstablishmentsQuery.ts`
- `scripts/verify-discover-grid-search-zone.ts`

## Issues relacionadas

- `platform-user-search-zone-domain-api.md` (S1)
- `platform-user-search-zone-editor.md` (S3)

## Referencias

- [platform-user-profile-search-zone.md](../domain/platform-user-profile-search-zone.md)
- Phase Q #88 — grid Cerca de mí
