## Objetivo

Scripts `verify:staff-scan-*` que cubran listado de targets, escaneo por tarjeta/promo, mensajes de outcome y regresiones del flujo legacy.

## Contexto

Phase M — cierra el batch; requiere M2, M3 y M4 implementados.

## Alcance

| In | Fuera |
|----|-------|
| `verify:staff-scan-targets-use-case` + `verify:staff-scan-targets` | Tests Jest legacy |
| `verify:staff-scan-record-by-target-use-case` + E2E | Cypress/Playwright |
| Regresión `verify:customer-scan` adaptada al nuevo contrato | |
| Actualizar `AGENTS.md` con nuevos verify | |

## Criterios de aceptación

- [ ] E2E: owner crea campaña + promo → GET targets devuelve ambos
- [ ] E2E: scan con `targetType=stamp_campaign` solo avanza esa campaña
- [ ] E2E: scan completa tarjeta → response incluye `card_completed`
- [ ] E2E: scan promo hasta agotar `maxUsesPerUser` → `promotion_exhausted`
- [ ] E2E: siguiente scan agotado muestra outcome sin 500
- [ ] Use-case stubs sin Prisma donde aplique
- [ ] Documentar en issue body los comandos verify

## Capas / archivos principales

- `scripts/verify-staff-scan-targets-use-case.ts`
- `scripts/verify-staff-scan-targets.ts`
- `scripts/verify-staff-scan-record-by-target-use-case.ts`
- `scripts/verify-staff-scan-record-by-target.ts`
- `package.json` scripts
- `AGENTS.md`

## Issues relacionadas

- M2, M3, M4

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:staff-scan-targets-use-case
npm run verify:staff-scan-targets
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
npm run verify:customer-scan
```
