## Objetivo

Sustituir el modelo MVP (elegibilidad TTL automática tras cualquier scan de sello) por un modelo de **participación del cliente**: cuota de giros en un periodo configurable, condiciones de activación en caja, y autorización explícita del staff. Esta issue entrega dominio, config v2 y persistencia; las UIs vienen en X2–X4.

## Contexto

**Flujo target (producto):**

```text
Owner configura ruleta (premios, %, cuota, periodo, importe mínimo)
→ Cliente ve ruleta en el local → pulsa «Activar ruleta» (opt-in)
→ Ve: giros restantes, condiciones (ej. consumir ≥10€), premios posibles, historial
→ Paga en caja → camarero escanea QR → elige «Autorizar giro de ruleta» + importe
→ OK: cliente ve ruleta lista en app | KO: mensaje claro (sin cuota, no activada, importe bajo, ruleta off…)
→ Cliente gira en app (servidor decide premio)
```

**Implementado hoy (Phase V6–V7) — gaps:**

| Esperado | Actual |
|----------|--------|
| Cliente activa la ruleta | No hay opt-in; solo ve bloqueada o lista |
| Cuota X giros en Y días desde activación | `maxSpinsPerDay/Week` globales sin periodo de participación |
| Condición importe mínimo (10€) | No existe; scan no captura importe |
| Staff elige «Autorizar giro» | Elegibilidad se emite **en silencio** en todo `RecordStaffScanByTarget` (sello/promo) |
| Errores explícitos en caja | Solo outcome positivo `roulette_spin_granted` o ausencia |
| Estado rico en app (usados, premios, condiciones) | `GetRoulettePublicState`: `canSpin` + mensaje genérico «Pide en caja…» |

Deprecar `rules.trigger: after_staff_scan` como camino principal; mantener parse v1 → v2 con defaults para migración.

## Alcance

| In | Fuera |
|----|-------|
| `RouletteConfig` **v2** (`version: 2`) con reglas de participación | POS / ticket fiscal automático |
| Tabla `roulette_participations` (`tenantId`, `customerId`, `enrolledAt`, `periodEndsAt`, `status`) | Múltiples participaciones simultáneas por tenant |
| Reutilizar/adaptar `roulette_spin_eligibilities` como **autorización de un giro** (1 auth → 1 spin) | Cambiar RNG ni premios |
| Domain: `EnrollCustomerInRoulette`, `GetRouletteParticipationState`, `AuthorizeRouletteSpin` (validación pura + persistencia) | UI cliente/staff/owner (X2–X4) |
| Quota: `maxSpinsInPeriod`, `participationPeriodDays`, `maxSpinsPerDay` (timezone app) | Geofencing |
| Condición: `minPurchaseEuros` (nullable; 0 = sin mínimo) | Importe desde integración bancaria |
| Errores de dominio tipados para staff y cliente | Analytics Phase W (#115–#117) — adaptar después |

**Config v2 (propuesta):**

```ts
rules: {
  participationPeriodDays: number;   // ej. 7
  maxSpinsInPeriod: number;        // ej. 3 (total en el periodo)
  maxSpinsPerDay: number;            // ej. 1
  minPurchaseEuros: number | null; // ej. 10
  requiresEnrollment: true;
  authorizationMode: "staff_explicit";
}
```

**Estados participación:** `not_enrolled` | `active` | `quota_exhausted` | `period_expired`.

**AuthorizeRouletteSpin** valida: ruleta activa + plan gamification + enrolled + cuota periodo/día + importe ≥ mínimo + no duplicar auth pendiente (opcional: 1 auth activa max).

## Criterios de aceptación

- [ ] Parse v2 + migración v1→v2 en `parseRouletteConfig` (tests dominio).
- [ ] `EnrollCustomerInRoulette` crea participación con `periodEndsAt = enrolledAt + periodDays`.
- [ ] `GetRouletteParticipationState` devuelve spins usados/restantes en periodo y hoy.
- [ ] `AuthorizeRouletteSpin` persiste elegibilidad consumible o lanza error tipado (`RouletteNotEnrolled`, `RouletteQuotaExhausted`, `RouletteMinPurchaseNotMet`, `RouletteGameDisabled`, …).
- [ ] Índices Prisma: `(tenantId, customerId)` en participations; revisar `(tenantId, createdAt)` en spins si aplica.
- [ ] `npm run verify:roulette-participation-use-case`

## Capas / archivos principales

- `src/contexts/loyalty/games/domain/RouletteConfig.ts` — v2 + compat v1
- `prisma/schema.prisma` — `roulette_participations`
- `src/contexts/loyalty/games/domain/RouletteParticipation.ts`
- `src/contexts/loyalty/games/application/participation/*`
- `src/contexts/loyalty/games/infrastructure/PrismaRouletteParticipationRepository.ts`
- Ampliar `RouletteSpinEligibility` / repo si hace falta `authorizedPurchaseEuros`

## Issues relacionadas

- `roulette-client-enrollment-ui.md` (X2)
- `roulette-staff-authorize-scan.md` (X3)
- `roulette-owner-config-v2-ui.md` (X4)
- `phase-x-roulette-flow-verify-docs.md` (X5)

## Referencias

- [`roulette-game.md`](../domain/roulette-game.md) § Phase X
- [`IssueRouletteSpinEligibility.ts`](../../src/contexts/loyalty/games/application/eligibility/IssueRouletteSpinEligibility.ts)
- [`RecordStaffScanByTarget.ts`](../../src/contexts/loyalty/customers/application/scan/RecordStaffScanByTarget.ts)
