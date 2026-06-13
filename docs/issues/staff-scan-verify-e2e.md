## Objetivo

Scripts verify y actualización de docs para que **todo el repo** quede alineado con scan target-first (un scan = una tarjeta).

## Contexto

Phase M — requiere M2, M3, M4. Cierra regresiones de CI/local que M3 rompe al cambiar el contrato de `POST /api/loyalty/scan`.

## Alcance

| In | Fuera |
|----|-------|
| Nuevos `verify:staff-scan-*` | Jest legacy |
| Migrar **todos** los scripts que llaman `/api/loyalty/scan` | Cypress |
| `AGENTS.md` | |

## Scripts a migrar (checklist obligatoria)

Cada uno debe enviar `{ qrValue, targetType, targetId }` y validar `outcomes[]`:

- [ ] `scripts/verify-staff-scan-targets-use-case.ts` (nuevo)
- [ ] `scripts/verify-staff-scan-targets.ts` (nuevo)
- [ ] `scripts/verify-staff-scan-record-by-target-use-case.ts` (nuevo)
- [ ] `scripts/verify-staff-scan-record-by-target.ts` (nuevo)
- [ ] `scripts/verify-customer-scan.ts`
- [ ] `scripts/verify-customer-stamp-scan.ts`
- [ ] `scripts/verify-customer-stamp-scan-use-case.ts`
- [ ] `scripts/verify-customer-stamp-scan-targeted.ts`
- [ ] `scripts/verify-customer-stamp-scan-targeted-use-case.ts`
- [ ] `scripts/verify-customer-stamp-progress.ts`
- [ ] `scripts/verify-platform-app-global-qr-scan.ts` (auto-join + target)
- [ ] `scripts/verify-stamp-campaign-dashboard.ts`
- [ ] `scripts/verify-customer-zone.ts`
- [ ] `scripts/verify-customer-reward-redeem.ts`
- [ ] `scripts/verify-tenant-employees.ts`
- [ ] `scripts/verify-platform-app-e2e.ts`

## Criterios de aceptación

- [ ] E2E: 2 campañas mismo `stampTypeId` → scan A → solo A avanza
- [ ] E2E: 5º sello → outcome «5 de 10»
- [ ] E2E: `card_completed` y `card_already_completed`
- [ ] E2E: `promotion_exhausted` con punto registrado
- [ ] E2E: orphan `users.qr_value` primer scan con target promo → auto-join
- [ ] `stampTypeId` en body → 400
- [ ] `npm run verify:stamp-campaign-dashboard` pasa tras scans con `targetId`
- [ ] Entradas nuevas en `package.json` + `AGENTS.md`

## Capas / archivos principales

- `scripts/verify-staff-scan-*.ts`
- Scripts listados arriba
- `package.json`, `AGENTS.md`

## Issues relacionadas

- [#67](https://github.com/3urega/fidelization/issues/67) M3
- [#70](https://github.com/3urega/fidelization/issues/70) M6 docs

## Verify

```bash
npm run verify:staff-scan-targets-use-case
npm run verify:staff-scan-targets
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
npm run verify:customer-scan
npm run verify:customer-stamp-scan
npm run verify:customer-stamp-scan-targeted
npm run verify:customer-stamp-progress
npm run verify:platform-app-global-qr-scan
npm run verify:stamp-campaign-dashboard
npm run verify:tenant-employees
npm run verify:platform-app-e2e
```
