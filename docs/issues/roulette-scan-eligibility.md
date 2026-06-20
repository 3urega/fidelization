## Objetivo

Conceder elegibilidad de giro de ruleta tras una visita registrada por staff scan, con TTL configurable, y mostrar al cliente el CTA cuando corresponda.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). Depende de **V4** (spin API valida elegibilidad) y flujo staff existente [`staff-scan-flow.md`](../domain/staff-scan-flow.md). Trigger MVP: `after_staff_scan` cuando el scan registra visita/punto.

## Alcance

| In | Fuera |
|----|-------|
| Emisión de elegibilidad tras scan exitoso (visita/punto) | Geofencing sin scan |
| Nuevo outcome opcional: `{ kind: "roulette_spin_granted", expiresAt }` en respuesta scan | Botón manual «girar sin visita» en producción |
| `GetRoulettePublicState` lee elegibilidad activa | Campañas programadas «viernes ruleta» |
| TTL desde `config.rules.eligibilityTtlHours` | Push notification |
| Verify extiende `verify:staff-scan-record-by-target` o script dedicado | |

## Criterios de aceptación

- [ ] Tras scan que incrementa visita/puntos, cliente ve `canSpin: true` en detalle local dentro del TTL
- [ ] Tras consumir spin, elegibilidad no reutilizable
- [ ] Ruleta desactivada o sin gamification → nunca emite elegibilidad
- [ ] Staff scan response documentada en `staff-scan-flow.md`
- [ ] `npm run verify:roulette-scan-eligibility-use-case`
- [ ] `npm run verify:roulette-scan-eligibility` (dev + `DATABASE_URL`)

## Capas / archivos principales

- Extensión en `RecordStaffScanByTarget` o use case auxiliar `IssueRouletteSpinEligibility`
- Persistencia elegibilidad: columna/tabla ligera o derivada de `roulette_spins` + scan ref (decisión implementador; preferir token en `roulette_spins` pending o tabla `roulette_spin_eligibilities`)
- `StaffScanOutcome.ts` — nuevo kind si se expone en UI staff (opcional v1)
- Actualizar `GetRoulettePublicState`, `ExecuteRouletteSpin`

## Issues relacionadas

- `roulette-spin-api.md` (previa)
- `roulette-visual-assets-ui.md` (CTA en cliente)

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)
- [`docs/domain/staff-scan-flow.md`](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:roulette-scan-eligibility-use-case
npm run verify:roulette-scan-eligibility
```
