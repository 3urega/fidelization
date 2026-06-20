# Ruleta de fidelización (gamification)

**Status:** **In progress** — V1 ([#108](https://github.com/3urega/fidelization/issues/108), 2026-06-20) + V2 ([#109](https://github.com/3urega/fidelization/issues/109), 2026-06-20) + V3 ([#110](https://github.com/3urega/fidelization/issues/110), 2026-06-20) + V4 ([#111](https://github.com/3urega/fidelization/issues/111), 2026-06-20) implemented; V5–V7 open ([#112](https://github.com/3urega/fidelization/issues/112)–[#114](https://github.com/3urega/fidelization/issues/114)).

## Overview

Primer juego implementado del motor de gamificación (`platform_games.slug = "ruleta"`). Owner Premium configura segmentos ponderados; el cliente gira tras una visita validada (staff scan); el **servidor** decide el premio; la animación solo refleja el resultado.

**Feature flag:** `gamification` (plan Premium). Catálogo global en `platform_games`; configuración por tenant en `tenant_game_activations`.

**Relacionado:** [`business-model.md`](business-model.md) (Gamification Pack), [`staff-scan-flow.md`](staff-scan-flow.md), [`visual-assets-system.md`](visual-assets-system.md), [`customer-platform-app.md`](customer-platform-app.md), `AGENTS.md` (owner `/settings/games`, `verify:platform-admin-games*`).

## Principios

1. RNG y aplicación de premio **solo en servidor**.
2. Premios = primitivas loyalty existentes (puntos, sello, promo, premio físico pendiente de canje).
3. Un giro = evento auditable (`roulette_spins` + opcional `LoyaltyTransaction`).
4. Mobile-first en `/home/establishments/[slug]`.

## Flujo MVP

```text
Staff scan (visita/punto) → elegibilidad de giro (TTL 24h)
Cliente abre detalle local → CTA «Girar ruleta»
POST spin → segmentIndex + premio → animación UI
Premio puntos/sello → reflejado en loyalty me / detalle
Premio físico → pending_redeem (canje staff v2)
```

## Modelo de datos (target)

| Tabla | Propósito |
|-------|-----------|
| `tenant_game_activations` | `{ tenantId, gameSlug: "ruleta", isEnabled, config JSON }` |
| `roulette_spins` | Giro ejecutado, segmento, premio, status, idempotency |

Config JSON versionada: segmentos con `weight`, `prizeType`, stock opcional, reglas de frecuencia.

## Implementation status (V4)

| Artefacto | Ruta |
|-----------|------|
| Spin use cases | `ExecuteRouletteSpin`, `GetRoulettePublicState`, `AssertRouletteSpinAccess` |
| Loyalty reuse | `ApplyCustomerLoyaltyOutcome`, `Customer.earnPoints()` |
| Client APIs | `GET/POST /api/user/establishments/[slug]/games/ruleta` (+ `/spin`) |
| Domain verify | `npm run verify:roulette-spin-use-case` |
| E2E verify | `npm run verify:roulette-spin` (dev + `DATABASE_URL`) |

## Implementation status (V3)

| Artefacto | Ruta |
|-----------|------|
| Owner config API | `GET/PUT /api/loyalty/games/ruleta/config`, `PATCH …/activation` |
| Settings UI | `/settings/games/ruleta` — `RouletteConfigEditor`, `RouletteWheelPreview` |
| Owner verify | `npm run verify:roulette-owner-config` (dev + `DATABASE_URL`) |

## Implementation status (V2)

| Artefacto | Ruta |
|-----------|------|
| Prisma tables | `tenant_game_activations`, `roulette_spins` |
| Activation repo | [`PrismaTenantGameActivationRepository.ts`](../../src/contexts/loyalty/games/infrastructure/PrismaTenantGameActivationRepository.ts) |
| Spin repo | [`PrismaRouletteSpinRepository.ts`](../../src/contexts/loyalty/games/infrastructure/PrismaRouletteSpinRepository.ts) |
| Use cases | `GetTenantRouletteConfig`, `UpsertTenantRouletteConfig`, `EnableTenantGame` |
| Domain verify | `npm run verify:roulette-config-use-case` |
| Prisma E2E | `npm run verify:roulette-config` (dev + `DATABASE_URL`) |

## Implementation status (V1)

| Artefacto | Ruta |
|-----------|------|
| Config parser + segment validation | [`RouletteConfig.ts`](../../src/contexts/loyalty/games/domain/RouletteConfig.ts) |
| Weighted wheel + stock filter | [`RouletteWheel.ts`](../../src/contexts/loyalty/games/domain/RouletteWheel.ts) |
| Domain verify | `npm run verify:roulette-wheel-use-case` |

## GitHub issues (published)

| # | Título | Body |
|---|--------|------|
| [#108](https://github.com/3urega/fidelization/issues/108) | Phase V1: Roulette domain engine (RNG + config validation) | **Implemented** 2026-06-20 |
| [#109](https://github.com/3urega/fidelization/issues/109) | Phase V2: Roulette persistence (Prisma + tenant activation) | **Implemented** 2026-06-20 |
| [#110](https://github.com/3urega/fidelization/issues/110) | Phase V3: Owner roulette config API + settings UI | **Implemented** 2026-06-20 |
| [#111](https://github.com/3urega/fidelization/issues/111) | Phase V4: Client spin API (ExecuteRouletteSpin + prize application) | **Implemented** 2026-06-20 |
| [#112](https://github.com/3urega/fidelization/issues/112) | Phase V5: Roulette visual assets + Wheel UI + establishment detail | `docs/issues/roulette-visual-assets-ui.md` |
| [#113](https://github.com/3urega/fidelization/issues/113) | Phase V6: Spin eligibility after staff scan | `docs/issues/roulette-scan-eligibility.md` |
| [#114](https://github.com/3urega/fidelization/issues/114) | Phase V7: Staff redeem pending roulette prizes (v2) | `docs/issues/roulette-staff-redeem-v2.md` |

Manifest: [`docs/issues/manifest.phase-v-roulette-game.json`](../issues/manifest.phase-v-roulette-game.json).

## Fuera de alcance global

- Rasca y caja misteriosa (otros slugs en catálogo).
- Geofencing, push notifications, ranking.
- Ruleta cross-tenant.
