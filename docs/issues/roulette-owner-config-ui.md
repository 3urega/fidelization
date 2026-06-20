## Objetivo

Permitir al owner Premium activar la ruleta, editar segmentos (peso, tipo de premio, stock) y ver preview, sustituyendo el placeholder «Próximamente» en `/settings/games`.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). Depende de **V2** (persistencia + use cases config). APIs owner en sesión `kind: tenant`, role owner.

## Alcance

| In | Fuera |
|----|-------|
| `GET/PUT /api/loyalty/games/ruleta/config` | Spin cliente (V4) |
| `PATCH /api/loyalty/games/ruleta/activation` `{ isEnabled }` | Assets finales ruleta (V5 genera imágenes) |
| Página `/settings/games/ruleta` — editor segmentos + toggle | Preview circular con imágenes custom (placeholder CSS/SVG mínimo OK) |
| Enlace desde card «Ruleta» en `GamificationGamesPanel` | Selector avanzado drag-and-drop |
| Selectores de campaña / promo / reward existentes (fetch APIs loyalty) | Geofencing, campañas programadas |

## Criterios de aceptación

- [ ] Owner Premium: CRUD config + activar/desactivar; employee 403
- [ ] Owner Basic/Pro sin `gamification`: upsell existente, sin editor
- [ ] Validación UI: mínimo 2 segmentos; muestra % derivado de pesos
- [ ] Desactivar ruleta impide nuevos giros (config `isEnabled: false`)
- [ ] `npm run verify:roulette-owner-config` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `src/app/api/loyalty/games/ruleta/config/route.ts`
- `src/app/api/loyalty/games/ruleta/activation/route.ts`
- `src/app/(app)/settings/games/ruleta/page.tsx`
- `src/app/_components/loyalty/RouletteConfigEditor.tsx` (o similar)
- Actualizar `GamificationGamesPanel.tsx` — link en lugar de «Próximamente» para slug `ruleta`
- `AGENTS.md` — verify + ruta owner

## Issues relacionadas

- `roulette-persistence-config.md` (previa)
- `roulette-visual-assets-ui.md` (assets en cliente; editor puede usar preview simple)

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)
- [`docs/frontend/style-guidelines.md`](../frontend/style-guidelines.md)

## Verify

```bash
npm run verify:roulette-owner-config
```
