## Objetivo

En la app del cliente, implementar el flujo completo de participación: activar la ruleta en el detalle del local, ver cuota y condiciones, historial de giros y premios, y estados bloqueado/listo con mensajes accionables.

## Contexto

Phase X — depende de X1 (dominio participación). Hoy `PlatformEstablishmentDetail` y `RouletteSpinClient` muestran `canSpin` booleano y «Pide en caja que escaneen tu QR» sin opt-in ni detalle.

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/user/establishments/[slug]/games/ruleta/enroll` | Push «te queda un giro» |
| `GetRoulettePublicState` v2 (o DTO dedicado) con estado rico | Editar participación desde app |
| UI detalle local: card ruleta con CTA según estado | Ruleta antes de join al local |
| UI `/ruleta`: activar → bloqueado (sin auth) → listo → girando → resultado | Cross-tenant ruleta |
| Mostrar: giros restantes (periodo + hoy), condiciones (min €), segmentos/premios, historial reciente | Gráficos analytics cliente |

**Estados UI cliente:**

| Estado | Copy / CTA |
|--------|------------|
| `not_enrolled` | «Este local tiene ruleta» → **Activar ruleta** |
| `active` sin auth | «Te quedan N giros · Mín. 10€ en caja» → **Solicita autorización** (informativo) |
| `authorized_ready` | **Girar ruleta** |
| `quota_exhausted` | «Has usado todos tus giros de este periodo» |
| `period_expired` | «Tu periodo terminó · Reactivar ruleta» |
| `disabled` | Ruleta no disponible |

**Payload público (ejemplo):**

```ts
{
  participationStatus, spinsRemainingInPeriod, spinsUsedInPeriod,
  spinsRemainingToday, minPurchaseEuros, conditionsLabel,
  segments[], recentSpins[], canSpin, blockReason
}
```

## Criterios de aceptación

- [ ] Cliente con relación al local puede enroll; segundo enroll en periodo activo → idempotente o error claro.
- [ ] Tras enroll, ve premios posibles y reglas sin poder girar hasta auth staff.
- [ ] Tras auth staff (X3), `canSpin` true y CTA girar habilitado.
- [ ] Historial muestra últimos giros: fecha, segmento, premio, estado canje físico.
- [ ] `npm run verify:roulette-client-participation-use-case`
- [ ] `npm run verify:roulette-client-participation` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `src/contexts/loyalty/games/application/participation/EnrollCustomerInRoulette.ts`
- `src/contexts/loyalty/games/application/spin/GetRoulettePublicState.ts` — ampliar
- `src/app/api/user/establishments/[slug]/games/ruleta/enroll/route.ts`
- `src/app/(mobile)/home/establishments/[slug]/PlatformEstablishmentDetail.tsx`
- `src/app/(mobile)/home/establishments/[slug]/ruleta/RouletteSpinClient.tsx`
- Componente opcional `RouletteParticipationCard.tsx`

## Issues relacionadas

- `roulette-config-v2-participation-domain.md`
- `roulette-staff-authorize-scan.md`
- `phase-x-roulette-flow-verify-docs.md`

## Referencias

- [`RouletteSpinClient.tsx`](../../src/app/(mobile)/home/establishments/[slug]/ruleta/RouletteSpinClient.tsx)
- [`PlatformEstablishmentDetail.tsx`](../../src/app/(mobile)/home/establishments/[slug]/PlatformEstablishmentDetail.tsx)
