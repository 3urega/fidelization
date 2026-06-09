## Objetivo

El cliente ve recompensas activas en `/app/card` y puede **canjear** una si tiene puntos suficientes; se descuenta balance y se registra `loyalty_transactions` (`reward_redeemed`).

Slice **D2** — cierra el loop recompensas de punta a punta (tras **rewards-crud-api**).

## Contexto

- Depende de **rewards-crud-api** (catálogo owner).
- `GET /api/loyalty/me` hoy devuelve `customer` + `stampProgress[]` (#23).
- Dominio: [`Customer`](../../src/contexts/loyalty/customers/domain/Customer.ts), [`LoyaltyTransaction.recordPointsRedeemed`](../../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction.ts) o nuevo `recordRewardRedeemed`.

## Alcance

| In | Fuera |
|----|-------|
| Ampliar `GET /api/loyalty/me` con `rewards[]` (activas, `costPoints`, `name`, …) | CRUD owner (#24 draft) |
| `POST /api/loyalty/rewards/redeem` (customer session) | Notificaciones push |
| Caso de uso `RedeemCustomerReward` | `stockLimit` / inventario |
| UI en `CustomerCardContent` / `LoyaltyCard` — listar + botón canjear | Canje de premio por sello completado |
| `verify:customer-reward-redeem-use-case` + E2E | Staff confirma canje en mostrador |

## Criterios de aceptación

- [ ] Cliente con sesión ve recompensas activas del tenant en `/app/card`.
- [ ] Canje exitoso: `pointsBalance` baja `costPoints`, fila `reward_redeemed` en Prisma.
- [ ] Canje con puntos insuficientes → error 400/422 claro.
- [ ] Recompensa inactiva no aparece ni se puede canjear.
- [ ] Tras canje, recargar `/app/card` muestra balance actualizado.
- [ ] `verify:customer-reward-redeem-use-case` pasa.
- [ ] `verify:customer-reward-redeem` pasa (register → owner crea reward → acumular puntos vía scan → redeem → assert).

## Capas / archivos principales

- `src/contexts/loyalty/customers/application/redeem/RedeemCustomerReward.ts` (o similar)
- `src/app/api/loyalty/rewards/redeem/route.ts`
- `src/app/api/loyalty/me/route.ts` — incluir rewards activas
- `src/app/_components/loyalty/LoyaltyCard.tsx`, `CustomerCardContent.tsx`
- `scripts/verify-customer-reward-redeem-use-case.ts`, `scripts/verify-customer-reward-redeem.ts`
- `AGENTS.md`, `post-onboarding-mvp-roadmap.md`

## Issues relacionadas

- **rewards-crud-api** — prerrequisito
- **tenant-employees-ui** — empleado puede escanear puntos antes del canje (E2E)

## Referencias

- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Phase D
- Issue #23 pattern — `stampProgress[]` en GET me + UI card
