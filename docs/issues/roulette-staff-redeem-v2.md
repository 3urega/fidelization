## Objetivo

Permitir al staff validar en mostrador premios físicos (`prizeType: physical`) ganados en ruleta, pasando de `pending_redeem` a `applied`.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). **v2 / opcional** tras MVP. Depende de V4 (spins con status) y flujo scan staff.

## Alcance

| In | Fuera |
|----|-------|
| Use case `RedeemRouletteSpin` (staff-only) | Premios puntos/sello/promo (ya applied al girar) |
| `POST /api/loyalty/games/ruleta/spins/[spinId]/redeem` | QR dedicado por premio (nice-to-have) |
| UI mínima en `/scan` o panel: buscar premio pendiente por customer QR | Analítica dashboard owner |
| Listado owner de spins recientes (read-only API opcional) | Notificaciones push |

## Criterios de aceptación

- [ ] Solo owner/employee; customer 403
- [ ] Spin debe ser `pending_redeem` + mismo tenant
- [ ] Segundo redeem → error idempotente
- [ ] `npm run verify:roulette-staff-redeem-use-case`
- [ ] `npm run verify:roulette-staff-redeem` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `src/contexts/loyalty/games/application/redeem/RedeemRouletteSpin.ts`
- `src/app/api/loyalty/games/ruleta/spins/[spinId]/redeem/route.ts`
- Extensión UI staff (mínima)

## Issues relacionadas

- `roulette-spin-api.md`
- `roulette-scan-eligibility.md`

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)

## Verify

```bash
npm run verify:roulette-staff-redeem-use-case
npm run verify:roulette-staff-redeem
```
