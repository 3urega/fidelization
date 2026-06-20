## Objetivo

Ejecutar giros de ruleta en servidor: validar elegibilidad y límites, RNG, aplicar premio (puntos/sello/promo) en transacción atómica y exponer APIs para la app personal del cliente.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). Depende de **V1** (wheel) + **V2** (repos). La elegibilidad automática post-scan llega en **V6**; en este slice incluir elegibilidad **manual/dev** o token emitido por verify script para E2E.

## Alcance

| In | Fuera |
|----|-------|
| Use case `ExecuteRouletteSpin` (transacción: spin + stock + loyalty) | UI animación (V5) |
| Use case `GetRoulettePublicState` (sin pesos exactos; `canSpin`, preview labels) | Hook post-scan (V6) |
| `GET /api/user/establishments/[slug]/games/ruleta` | Canje staff premio físico (V7) |
| `POST /api/user/establishments/[slug]/games/ruleta/spin` | Idempotency producción completa (header opcional MVP) |
| Aplicar premios: `points_earned`, `stamp_added`, `promotion` usage | Nuevo `LoyaltyTransactionType.roulette_prize` (opcional nice-to-have) |
| Snapshot de config en cada spin para auditoría | Push / geofencing |
| Rate limits por reglas config (`maxSpinsPerDay/Week`) | |

## Criterios de aceptación

- [ ] Solo sesión `kind: user` con relación customer al tenant (join o existente)
- [ ] Tenant con ruleta desactivada o sin Premium → error claro
- [ ] `platform_games.slug=ruleta` status `draft` → no spin
- [ ] Respuesta spin: `{ spinId, segmentIndex, segmentLabel, prizeType, prize }` — cliente anima con `segmentIndex`
- [ ] Premio puntos/sello visible en `GET /api/user/establishments/[slug]` tras spin
- [ ] Stock de segmento decrementado; segmento agotado excluido en siguientes giros
- [ ] `npm run verify:roulette-spin-use-case`
- [ ] `npm run verify:roulette-spin` (dev + `DATABASE_URL`; elegibilidad simulada en script)

## Capas / archivos principales

- `src/contexts/loyalty/games/application/spin/ExecuteRouletteSpin.ts`
- `src/contexts/loyalty/games/application/spin/GetRoulettePublicState.ts`
- `src/app/api/user/establishments/[slug]/games/ruleta/route.ts`
- `src/app/api/user/establishments/[slug]/games/ruleta/spin/route.ts`
- Reutilizar lógica interna de puntos/sellos (no segundo staff scan)

## Issues relacionadas

- `roulette-persistence-config.md` (previa)
- `roulette-visual-assets-ui.md` (consume APIs)
- `roulette-scan-eligibility.md` (elegibilidad real)

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)
- [`docs/domain/staff-scan-flow.md`](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:roulette-spin-use-case
npm run verify:roulette-spin
```
