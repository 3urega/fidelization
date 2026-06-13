## Objetivo

Exponer en API la lista de **tarjetas de sellos individuales** y promociones activas para el picker de `/scan` (una entrada por campaña, no por tipo de consumición).

## Contexto

Phase M — requiere M1. **Sustituye** `GET /api/loyalty/stamp-types` como fuente del picker de scan. Si el tenant tiene dos campañas activas del tipo «Café», el GET devuelve **dos** targets `stamp_campaign` distintos.

## Alcance

| In | Fuera |
|----|-------|
| Use case `ListStaffScanTargets` | UI `/scan` (M4) |
| `GET /api/loyalty/scan/targets` (owner + employee) | Agrupar por `stampTypeId` |
| Por tarjeta: `id`, `name`, `requiredStamps`, `visualTemplate`, `cardBackgroundVariant`, `stampTypeLabel`, `conditions` | Progreso del cliente (sin QR) |
| Promos Pro+: `id`, `title`, `description`, `maxUsesPerUser` | Basic: `promotions: []` |

## Criterios de aceptación

- [ ] Una fila por campaña activa (`isActive`), no una fila por tipo
- [ ] Dos campañas mismo `stampTypeId` → dos items en `stampCampaigns[]`
- [ ] Solo promociones activas y vigentes
- [ ] Employee y owner GET; customer 403
- [ ] `npm run verify:staff-scan-targets-use-case`
- [ ] `npm run verify:staff-scan-targets` (dev + DATABASE_URL)

## Capas / archivos principales

- `src/contexts/loyalty/customers/application/scan/ListStaffScanTargets.ts`
- `src/app/api/loyalty/scan/targets/route.ts`
- `src/lib/auth/http.ts`

## Issues relacionadas

- [#65](https://github.com/3urega/fidelization/issues/65) M1
- [#67](https://github.com/3urega/fidelization/issues/67) M3

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:staff-scan-targets-use-case
npm run verify:staff-scan-targets
```
