## Objetivo

Cerrar Phase Y: eliminar UI legacy del scan target-first, alinear documentación y `AGENTS.md` con el flujo QR-first, y confirmar regresión verifies.

## Contexto

Phase Y — slice **Y5**. Requiere Y2 + Y3 completos. Ver [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) § Y5.

## Alcance

| In | Fuera |
|----|-------|
| Eliminar o archivar componentes no usados: `StaffScanForm`, `StaffScanTargetPicker` (si sin referencias), hints sueltos redundantes, `StaffRoulettePendingRedeem` root | Borrar `GET /api/loyalty/scan/targets` (puede quedar para compat) |
| Actualizar [`staff-scan-flow.md`](../domain/staff-scan-flow.md): UX QR-first como target, rutas `/scan/session/*` | Nuevas features producto |
| Actualizar [`roulette-game.md`](../domain/roulette-game.md) § Pantalla staff | |
| `AGENTS.md`: rutas scan, verifies Phase Y | |
| Marcar plan [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) status implementado / Phase Y complete | |
| Checklist verifies listados en plan | |

## Criterios de aceptación

- [ ] `/scan` no renderiza formulario target-first legacy.
- [ ] Docs dominio describen flujo QR → hub → panel (no picker-first).
- [ ] Todos los verifies Phase Y del plan pasan en CI/local según `package.json`.
- [ ] Sin imports muertos a componentes eliminados (`npm run lint` OK).

## Capas / archivos principales

- `src/app/(app)/scan/*`
- `src/app/_components/loyalty/StaffScan*.tsx`
- `docs/domain/staff-scan-flow.md`, `docs/domain/staff-scan-qr-first-plan.md`, `AGENTS.md`

## Issues relacionadas

- Todas las issues Phase Y en este manifest

## Referencias

- [staff-scan-qr-first-plan.md](../domain/staff-scan-qr-first-plan.md)
- [docs/issues/README.md](README.md)

## Verify

```bash
npm run verify:staff-scan-session-use-case
npm run verify:staff-scan-session
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
npm run verify:staff-scan-roulette-ux
npm run verify:roulette-staff-authorize
npm run verify:roulette-staff-redeem
```
