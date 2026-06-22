## Objetivo

Permitir al owner configurar las reglas de participación v2 desde `/settings/games/ruleta`: periodo de cuota, giros totales, giros/día, importe mínimo de consumo y copy de condiciones visibles para el cliente.

## Contexto

Phase X — depende de dominio config v2 (#X1). Hoy el editor solo expone `maxSpinsPerDay`, `maxSpinsPerWeek`, `eligibilityTtlHours` y trigger `after_staff_scan`, alineado con el flujo MVP obsoleto.

## Alcance

| In | Fuera |
|----|-------|
| Campos v2 en `RouletteConfigEditor` | Preview animado de periodos |
| Validación UI coherente con dominio (`maxSpinsInPeriod >= maxSpinsPerDay`, etc.) | A/B testing de copy |
| Sustituir/ocultar campos legacy (`eligibilityTtlHours`, `maxSpinsPerWeek`, trigger) cuando config es v2 | Migración masiva de tenants en caliente (solo upsert al guardar) |
| Texto ayuda owner explicando flujo: activación cliente → autorización caja → giro app | |

**Campos owner:**

- Días de participación (ej. 7)
- Giros totales en el periodo (ej. 3)
- Máximo giros por día (ej. 1)
- Importe mínimo para autorizar en caja (€, opcional)
- Texto condiciones (opcional, mostrado al cliente)

## Criterios de aceptación

- [ ] Owner Premium guarda config v2 vía `PUT /api/loyalty/games/ruleta/config`.
- [ ] Al activar ruleta sin config previa, default v2 razonable (3 giros / 7 días / 1 día / 10€ mínimo configurable).
- [ ] Preview wheel sigue funcionando con segmentos existentes.
- [ ] `npm run verify:roulette-owner-config` actualizado para v2 (dev + `DATABASE_URL`).

## Capas / archivos principales

- `src/app/_components/loyalty/RouletteConfigEditor.tsx`
- `src/lib/roulette/rouletteEditorUtils.ts` — `DEFAULT_ROULETTE_CONFIG` v2
- `src/app/(app)/settings/games/ruleta/page.tsx` — copy descripción flujo

## Issues relacionadas

- `roulette-config-v2-participation-domain.md`
- `roulette-client-enrollment-ui.md`
- `roulette-staff-authorize-scan.md`

## Referencias

- [`RouletteConfigEditor.tsx`](../../src/app/_components/loyalty/RouletteConfigEditor.tsx)
