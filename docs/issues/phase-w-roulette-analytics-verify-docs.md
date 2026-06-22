## Objetivo

Cerrar Phase W con scripts verify, entradas en `AGENTS.md` y documentación de dominio para el dashboard de actividad ruleta y la ficha cliente ampliada.

## Contexto

Phase W — issues `roulette-activity-dashboard.md` y `customer-detail-promotions-roulette.md` deben quedar registradas en docs operativas y verificables en CI local (`npm run verify:*`).

## Alcance

| In | Fuera |
|----|-------|
| Scripts verify use-case + E2E para W1 y W2 | Nuevas features |
| Entradas `AGENTS.md` (comandos + rutas owner) | Platform superadmin analytics |
| Actualizar `roulette-game.md` § Phase W implementation status | Retrospectiva Phase V |

## Criterios de aceptación

- [ ] `npm run verify:roulette-activity-use-case` — dominio summary + list spins
- [ ] `npm run verify:roulette-activity-dashboard` — API + smoke UI settings (dev + `DATABASE_URL`)
- [ ] `npm run verify:customer-detail-promotions-roulette-use-case`
- [ ] `npm run verify:customer-detail-promotions-roulette` (dev + `DATABASE_URL`)
- [ ] `AGENTS.md`: rutas `/settings/games/ruleta` (tab Actividad), `/customers/[id]` (promos + ruleta)
- [ ] `docs/domain/roulette-game.md`: sección Phase W + tabla issues publicadas

## Capas / archivos principales

- `scripts/verify-roulette-activity-use-case.ts`
- `scripts/verify-roulette-activity-dashboard.ts`
- `scripts/verify-customer-detail-promotions-roulette-use-case.ts`
- `scripts/verify-customer-detail-promotions-roulette.ts`
- `package.json` — scripts npm
- `AGENTS.md`
- `docs/domain/roulette-game.md`

## Issues relacionadas

- `roulette-activity-dashboard.md`
- `customer-detail-promotions-roulette.md`

## Referencias

- [`roulette-game.md`](../domain/roulette-game.md)
- [`AGENTS.md`](../../AGENTS.md)
