## Objetivo

Persistir activación y configuración de ruleta por tenant, más el registro de giros, con repositorios Prisma y casos de uso de lectura/escritura de config.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). Depende de **V1** (dominio config). Habilita al owner a guardar segmentos antes de UI/API pública de spin.

## Alcance

| In | Fuera |
|----|-------|
| Migración Prisma: `tenant_game_activations`, `roulette_spins` | `ExecuteRouletteSpin` (V4) |
| Repos: `TenantGameActivationRepository`, `RouletteSpinRepository` | UI owner |
| Use cases: `GetTenantRouletteConfig`, `UpsertTenantRouletteConfig`, `EnableTenantGame` | Elegibilidad post-scan (V6) |
| Guard `AssertTenantPlanFeature` → `gamification` | Canje staff (V7) |
| Seed demo: ruleta activa en `cafe-demo` con config de ejemplo | |

## Criterios de aceptación

- [ ] `@@unique([tenantId, gameSlug])` en activaciones; `gameSlug = "ruleta"`
- [ ] `roulette_spins` indexado por `tenantId`, `customerId`, `createdAt`
- [ ] Upsert valida config vía dominio V1 antes de guardar
- [ ] Owner sin Premium → error de feature al upsert/enable
- [ ] `npm run verify:roulette-config-use-case`
- [ ] `npm run verify:roulette-config` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `prisma/schema.prisma` + migración
- `src/contexts/loyalty/games/infrastructure/PrismaTenantGameActivationRepository.ts`
- `src/contexts/loyalty/games/infrastructure/PrismaRouletteSpinRepository.ts`
- `src/contexts/loyalty/games/application/config/*`
- `prisma/seed.ts` (demo config)
- `docs/database/data-model.md` (tablas nuevas)

## Issues relacionadas

- `roulette-domain-engine.md` (previa)
- `roulette-owner-config-ui.md` (siguiente)

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)

## Verify

```bash
npm run verify:roulette-config-use-case
npm run verify:roulette-config
```
