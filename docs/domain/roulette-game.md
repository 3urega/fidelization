# Ruleta de fidelización (gamification)

**Status:** **Implemented (MVP ruleta)** — V1 ([#108](https://github.com/3urega/fidelization/issues/108), 2026-06-20) through V7 ([#114](https://github.com/3urega/fidelization/issues/114), 2026-06-20).

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

### Pantalla staff `/scan` (Flujo A vs B)

| Caso en caja | Qué hace el empleado | UI |
|--------------|---------------------|-----|
| «Quiero girar la ruleta» | Formulario **principal**: tarjeta → QR → Registrar visita | Banner 3 pasos + outcome «Ruleta desbloqueada…» |
| «Gané un café en la ruleta» | Sección **colapsada** Canjear premio físico | Auto-búsqueda tras scan o QR manual |

Copy operativo: no confundir «buscar premios pendientes» con desbloquear un giro nuevo. Ver [`staff-scan-flow.md`](staff-scan-flow.md) § Staff scan + ruleta.

## Modelo de datos (target)

| Tabla | Propósito |
|-------|-----------|
| `tenant_game_activations` | `{ tenantId, gameSlug: "ruleta", isEnabled, config JSON }` |
| `roulette_spins` | Giro ejecutado, segmento, premio, status, idempotency |

Config JSON versionada: segmentos con `weight`, `prizeType`, stock opcional, reglas de frecuencia.

## Implementation status (V7)

| Artefacto | Ruta |
|-----------|------|
| Redeem use case | `RedeemRouletteSpin` — `pending_redeem` → `applied` + `redeemedAt` |
| List pending | `ListPendingRouletteSpinsForStaff` + `GET /api/loyalty/games/ruleta/spins/pending?qrValue=` |
| Staff API | `POST /api/loyalty/games/ruleta/spins/[spinId]/redeem` |
| Staff UI | `/scan` — `StaffScanPageClient`, `StaffScanRouletteHint`, `StaffRoulettePendingRedeem` (colapsado) |
| Scan context API | `GET /api/loyalty/games/ruleta/scan-context` |
| UX verify | `npm run verify:staff-scan-roulette-ux` (dev server) |
| Domain verify | `npm run verify:roulette-staff-redeem-use-case` |
| E2E verify | `npm run verify:roulette-staff-redeem` (dev + `DATABASE_URL`) |

Solo premios `physical` en `pending_redeem`; owner/employee; segundo redeem → `RouletteSpinAlreadyRedeemed` (409).

## Implementation status (V6)

| Artefacto | Ruta |
|-----------|------|
| Eligibility table | `roulette_spin_eligibilities` (Prisma migration) |
| Domain | `RouletteSpinEligibility`, `RouletteSpinNotEligible` |
| Issue use case | `IssueRouletteSpinEligibility` — emisión tras staff scan |
| Scan integration | `RecordStaffScanByTarget` → outcome `roulette_spin_granted` |
| Spin gate | `GetRoulettePublicState` / `ExecuteRouletteSpin` requieren elegibilidad activa |
| Consumo atómico | `PrismaRouletteSpinUnitOfWork` — spin + `consumedAt` en `$transaction` |
| Staff outcome | `StaffScanOutcome` kind `roulette_spin_granted` + `expiresAt` |
| Domain verify | `npm run verify:roulette-scan-eligibility-use-case` |
| E2E verify | `npm run verify:roulette-scan-eligibility` (dev + `DATABASE_URL`) |

Reglas: una elegibilidad no consumida por customer/tenant; nuevo scan **renueva** `expiresAt`; `canSpin` = gates Premium + ruleta activa + rate limits + elegibilidad activa; giro consume elegibilidad (`triggerSource: staff_scan`, `triggerRef: eligibilityId`).

## Implementation status (V5)

| Artefacto | Ruta |
|-----------|------|
| Visual assets | `public/assets/ruleta/*` |
| Asset registry | `src/app/_components/loyalty/games/rouletteAssets.ts` |
| Wheel UI | `RouletteWheel`, `RouletteResultScreen` |
| Client page | `/home/establishments/[slug]/ruleta` |
| Detail CTA | `PlatformEstablishmentDetail` |
| UI verify | `npm run verify:roulette-spin-e2e` (dev + `DATABASE_URL`) |

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
| [#112](https://github.com/3urega/fidelization/issues/112) | Phase V5: Roulette visual assets + Wheel UI + establishment detail | **Implemented** 2026-06-20 |
| [#113](https://github.com/3urega/fidelization/issues/113) | Phase V6: Spin eligibility after staff scan | **Implemented** 2026-06-20 |
| [#114](https://github.com/3urega/fidelization/issues/114) | Phase V7: Staff redeem pending roulette prizes (v2) | **Implemented** 2026-06-20 |

Manifest: [`docs/issues/manifest.phase-v-roulette-game.json`](../issues/manifest.phase-v-roulette-game.json).

## Phase W — Analytics owner + ficha cliente (draft)

Objetivo: responder operativamente «¿cuánto se ha girado hoy y qué premios salieron?» y «¿qué tiene este cliente?» (tarjetas, promos, ruleta).

| Flujo | Owner ve | Detalle |
|-------|----------|---------|
| Dashboard ruleta | «Hoy: 3 giros · 1 premio: llavero» | Clic premio → clientes ganadores + enlace a ficha |
| Ficha `/customers/[id]` | Sellos (ya), promos activas + uso, historial giros | Complementa actividad reciente y recompensas |

Patrones a reutilizar: `StampScanTimeWindows` + `env.appTimezone`, `ListStampCampaignDashboard`, `ListCustomerPromotionSummaries`, `roulette_spins.configSnapshot` para labels históricos.

### GitHub issues (published)

| # | Título | Body |
|---|--------|------|
| [#115](https://github.com/3urega/fidelization/issues/115) | Phase W1: Owner roulette activity dashboard (daily summary + prize drill-down) | [`roulette-activity-dashboard.md`](../issues/roulette-activity-dashboard.md) |
| [#116](https://github.com/3urega/fidelization/issues/116) | Phase W2: Customer detail: active promotions and roulette spin history | [`customer-detail-promotions-roulette.md`](../issues/customer-detail-promotions-roulette.md) |
| [#117](https://github.com/3urega/fidelization/issues/117) | Phase W3: Phase W verify scripts, AGENTS.md and roulette analytics docs | [`phase-w-roulette-analytics-verify-docs.md`](../issues/phase-w-roulette-analytics-verify-docs.md) |

Manifest: [`docs/issues/manifest.phase-w-roulette-analytics.json`](../issues/manifest.phase-w-roulette-analytics.json).

## Phase X — Participación cliente + autorización caja (draft)

**Problema:** el MVP (Phase V6) concede elegibilidad de ruleta **automáticamente** al registrar cualquier visita de sello/promo, sin opt-in del cliente, sin cuota por periodo de participación, sin importe mínimo, y sin acción explícita «Autorizar giro» en caja.

**Flujo target:**

```text
Owner configura (premios, %, cuota periodo, min €)
  → Cliente activa ruleta en app del local
  → Ve giros restantes, condiciones, premios posibles, historial
  → Paga en caja → staff: QR + «Autorizar giro ruleta» + importe
  → OK: app lista para girar | KO: mensaje claro (no activada, sin cuota, importe bajo…)
  → Cliente gira → premio servidor
```

| Gap MVP | Target X |
|---------|----------|
| Sin opt-in | `roulette_participations` + enroll API |
| TTL 24h tras scan sello | Cuota `maxSpinsInPeriod` en `participationPeriodDays` |
| Scan sello = desbloqueo ruleta | Target staff `roulette_authorize` separado |
| Sin importe mínimo | `minPurchaseEuros` + campo importe en scan |
| App: «Pide en caja…» genérico | Estados: not_enrolled → active → authorized_ready → spin |

Phase W (#115–#117) analytics: implementar **después** de X o adaptar read models.

### GitHub issues (published)

| # | Título | Body |
|---|--------|------|
| [#118](https://github.com/3urega/fidelization/issues/118) | Phase X1: Roulette config v2 + customer participation domain | **Implemented** 2026-06-22 — [`verify:roulette-participation-use-case`](../../package.json) |
| [#119](https://github.com/3urega/fidelization/issues/119) | Phase X2: Owner roulette config v2 UI | **Implemented** 2026-06-22 — `verify:roulette-owner-config` |
| [#120](https://github.com/3urega/fidelization/issues/120) | Phase X3: Client enrollment + rich state + app UI | **Implemented** 2026-06-22 — `verify:roulette-client-participation*` |
| [#121](https://github.com/3urega/fidelization/issues/121) | Phase X4: Staff authorize roulette spin | **Implemented** 2026-06-22 — `verify:roulette-staff-authorize*` |
| [#122](https://github.com/3urega/fidelization/issues/122) | Phase X5: Phase X docs, verifies and migration | [`phase-x-roulette-flow-verify-docs.md`](../issues/phase-x-roulette-flow-verify-docs.md) |

Manifest: [`docs/issues/manifest.phase-x-roulette-participation-flow.json`](../issues/manifest.phase-x-roulette-participation-flow.json).

## Implementation status (X1)

| Artefacto | Ruta |
|-----------|------|
| Config v2 + migrate v1 | [`RouletteConfig.ts`](../../src/contexts/loyalty/games/domain/RouletteConfig.ts) |
| Participations table | `roulette_participations` (Prisma migration `20260622120000`) |
| Domain | `RouletteParticipation`, quota helpers, typed errors (`RouletteNotEnrolled`, `RouletteQuotaExhausted`, …) |
| Use cases | `EnrollCustomerInRoulette`, `GetRouletteParticipationState`, `AuthorizeRouletteSpin` |
| Eligibility extension | `authorizedPurchaseEuros` on `roulette_spin_eligibilities` |
| Domain verify | `npm run verify:roulette-participation-use-case` |

## Implementation status (X2)

| Artefacto | Ruta |
|-----------|------|
| Editor v2 | [`RouletteConfigEditor.tsx`](../../src/app/_components/loyalty/RouletteConfigEditor.tsx) — participación, cuota, min €, texto condiciones |
| Utils | [`rouletteEditorUtils.ts`](../../src/lib/roulette/rouletteEditorUtils.ts) — `normalizeEditorConfig`, validación UI, default v2 |
| Defaults | `createDefaultRouletteConfigV2()` en activación; `DEMO_ROULETTE_CONFIG` v2 |
| Owner verify | `npm run verify:roulette-owner-config` (dev + `DATABASE_URL`) |

## Implementation status (X3)

| Artefacto | Ruta |
|-----------|------|
| Public state v2 | [`GetRoulettePublicState.ts`](../../src/contexts/loyalty/games/application/spin/GetRoulettePublicState.ts) — bifurca legacy vs `staff_explicit`; cuotas, condiciones, historial |
| Recent spins | [`ListRecentRouletteSpinsForCustomer.ts`](../../src/contexts/loyalty/games/application/spin/ListRecentRouletteSpinsForCustomer.ts) |
| Enroll API | `POST /api/user/establishments/[slug]/games/ruleta/enroll` |
| UI cliente | [`RouletteParticipationCard.tsx`](../../src/app/_components/loyalty/games/RouletteParticipationCard.tsx), [`PlatformEstablishmentDetail.tsx`](../../src/app/(mobile)/home/establishments/[slug]/PlatformEstablishmentDetail.tsx), [`RouletteSpinClient.tsx`](../../src/app/(mobile)/home/establishments/[slug]/ruleta/RouletteSpinClient.tsx) |
| Client helpers | [`rouletteClientState.ts`](../../src/lib/roulette/rouletteClientState.ts), [`roulettePublicStateClient.ts`](../../src/lib/roulette/roulettePublicStateClient.ts) |
| Verifies | `npm run verify:roulette-client-participation-use-case`, `npm run verify:roulette-client-participation` (dev + `DATABASE_URL`) |

## Implementation status (X4)

| Artefacto | Ruta |
|-----------|------|
| Target staff | [`StaffScanTarget.ts`](../../src/contexts/loyalty/customers/domain/StaffScanTarget.ts) — `roulette_authorize` |
| Outcomes | [`StaffScanOutcome.ts`](../../src/contexts/loyalty/customers/domain/StaffScanOutcome.ts) — `roulette_auth_granted` / `roulette_auth_denied` |
| Use case | [`RecordStaffRouletteAuthorizeByQr.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffRouletteAuthorizeByQr.ts) |
| Legacy gate | [`RecordStaffScanByTarget.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts) — `IssueRouletteSpinEligibility` solo si `usesLegacyStaffScanAuthorization` |
| Scan context | [`GetStaffRouletteScanContext.ts`](../../src/contexts/loyalty/games/application/config/GetStaffRouletteScanContext.ts) — `authorizeEnabled` |
| Targets API | [`ListStaffScanTargets.ts`](../../src/contexts/loyalty/customers/application/scan/ListStaffScanTargets.ts) — `rouletteAuthorize` |
| UI `/scan` | [`StaffScanTargetPicker.tsx`](../../src/app/_components/loyalty/StaffScanTargetPicker.tsx), [`StaffScanForm.tsx`](../../src/app/_components/loyalty/StaffScanForm.tsx) |
| Verifies | `npm run verify:roulette-staff-authorize-use-case`, `npm run verify:roulette-staff-authorize` (dev + `DATABASE_URL`) |

## Fuera de alcance global

- Rasca y caja misteriosa (otros slugs en catálogo).
- Geofencing, push notifications, ranking.
- Ruleta cross-tenant.
