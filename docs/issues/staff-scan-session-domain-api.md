## Objetivo

Exponer un read model staff que, tras identificar al cliente (QR o `customerId`), devuelve progreso real de sellos, promociones, ruleta y premios físicos pendientes para alimentar el hub `/scan` QR-first.

## Contexto

Phase Y — slice **Y1**. Depende del scan target-first existente (Phase M). No cambia `POST /api/loyalty/scan`. Ver [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) § Backend read model.

Decisiones producto (defaults hasta revisión):

- Auto-join en la primera resolución por QR (igual que `ResolveCustomerByQrForStaffScan` hoy).
- Session staff accesible para **owner** y **employee** (no reutilizar `GetTenantCustomerDetail` owner-only).

## Alcance

| In | Fuera |
|----|-------|
| Tipo dominio `StaffScanSessionView` (+ helpers `canAddStamp`, `blockReason`, etc.) | Cambios en `POST /api/loyalty/scan` |
| Use case `GetStaffScanSessionContext` componiendo repos/use cases existentes | UI `/scan` |
| `GET /api/loyalty/scan/session` con `qrValue` **o** `customerId` (exactamente uno) | Email/teléfono/historial analytics en la respuesta |
| Guard `StaffScanForbidden` (owner + employee) | `POST /identify` separado (opcional futuro) |
| Mapper JSON en `lib/auth/http` o equivalente | Deprecar `GET /scan/targets` en esta issue |
| `verify:staff-scan-session-use-case` | |
| `verify:staff-scan-session` (E2E owner + employee, QR platform + auto-join) | |
| Registro en `diod.config.ts` | |

## Criterios de aceptación

- [ ] `GET /api/loyalty/scan/session?qrValue=` resuelve cliente y devuelve `stampCards[]` con `current`/`required` reales (no 0 fijo).
- [ ] Con gamification + ruleta activa, `roulette.participation` refleja `GetRouletteParticipationState` (p. ej. `spinsRemainingToday === 0` cuando cuota agotada).
- [ ] `promotions[]` incluye `usedCount` / `maxUsesPerUser` y flags `canApply` / `blockReason`.
- [ ] `roulette.pendingPhysicalCount` coherente con premios `pending_redeem` del cliente.
- [ ] `tenantCapabilities` alinea `authorizeEnabled` / `unlockEnabled` con scan-context / config ruleta.
- [ ] Empleado con sesión tenant puede llamar la API; rol no staff → 403.
- [ ] `GET ?customerId=` refetch sin QR tras identificación inicial.
- [ ] `npm run verify:staff-scan-session-use-case` y `npm run verify:staff-scan-session` pasan.

## Capas / archivos principales

- `src/contexts/loyalty/customers/domain/StaffScanSession.ts` (view types)
- `src/contexts/loyalty/customers/application/scan/GetStaffScanSessionContext.ts`
- `src/app/api/loyalty/scan/session/route.ts`
- `scripts/verify-staff-scan-session-use-case.ts`, `scripts/verify-staff-scan-session.ts`
- `package.json` scripts `verify:staff-scan-session*`
- `src/contexts/shared/infrastructure/dependency-injection/diod.config.ts`

## Issues relacionadas

- `staff-scan-identify-hub-ui.md` (consume esta API)
- `staff-scan-session-loyalty-panels.md`, `staff-scan-session-ruleta-redeem-panels.md`

## Referencias

- [staff-scan-qr-first-plan.md](../domain/staff-scan-qr-first-plan.md)
- [staff-scan-flow.md](../domain/staff-scan-flow.md)
- [thin-api-routes.md](../backend/thin-api-routes.md)

## Verify

```bash
npm run verify:staff-scan-session-use-case
npm run verify:staff-scan-session
npm run verify:staff-scan-record-by-target-use-case
```
