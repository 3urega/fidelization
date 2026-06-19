## Objetivo

Integrar suggest en vivo, mapa interactivo y markers de locales en `UserSearchZoneEditor`, sustituyendo el flujo «Buscar en mapa» + imagen estática por una experiencia fluida de confirmación de zona.

## Contexto

Cierra Phase T uniendo T1–T4 en `/home/profile?tab=personal#search-zone`. El grid «Explorar» (Phase S5 #97) no cambia contrato de persistencia: sigue `PATCH /api/user/me/search-zone`.

Depende de: T1, T2, T3, T4.

## Alcance

| In | Fuera |
|----|-------|
| Refactor `UserSearchZoneEditor`: debounce input → suggest → selección / auto-primera → fly map | Radio UI |
| Mapa interactivo en lugar de `<img>` estático (fallback estático si 503 config) | Reverse geocode al drag |
| Markers locales refrescados al mover centro (debounce) | Cambios grid discover |
| Pin arrastrable actualiza draft coords antes de confirmar | |
| Mantener PATCH confirmar / DELETE zona | |
| Copy UX: loading, sin resultados, sin locales en zona | |
| `npm run verify:search-zone-editor-interactive` E2E | |
| `AGENTS.md` + domain doc Phase T **Implemented** al cerrar | |

## Criterios de aceptación

- [ ] Escribir «Terrassa» (debounce ~400ms) muestra sugerencias y centra el mapa al elegir una
- [ ] Usuario puede **pan/zoom** sin perder el pin de zona
- [ ] Se ven **markers** de locales geocodificados cerca del pin
- [ ] Confirmar zona persiste igual que Phase S; grid usa coords guardadas
- [ ] Fallback legible si Mapbox/Google no configurado (mensaje + geocode botón legacy opcional)
- [ ] Deep link `#search-zone` sigue abriendo el editor
- [ ] `npm run verify:search-zone-editor-interactive` (dev + DATABASE_URL)
- [ ] Regresión: `verify:platform-user-search-zone-editor` pasa o se fusiona

## Capas / archivos principales

- `src/app/_components/platform-app/UserSearchZoneEditor.tsx`
- `src/app/(mobile)/home/profile/PlatformUserProfilePersonalTab.tsx` (si hace falta wiring)
- `scripts/verify-search-zone-editor-interactive.ts`
- `package.json`, `AGENTS.md`

## Issues relacionadas

- `search-zone-live-place-suggest.md` (T1)
- `search-zone-interactive-map-port.md` (T2)
- `search-zone-interactive-map-ui.md` (T3)
- `search-zone-map-establishment-markers.md` (T4)

## Referencias

- [Phase T domain spec](../domain/platform-user-search-zone-interactive-map.md)
- [`UserSearchZoneEditor.tsx`](../../src/app/_components/platform-app/UserSearchZoneEditor.tsx)
