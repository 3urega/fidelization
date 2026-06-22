## Objetivo

Documentar el flujo ruleta v2 (participación + autorización caja), actualizar verifies y `AGENTS.md`, y marcar el flujo Phase V6 (auto-elegibilidad en scan sello) como superseded.

## Contexto

Phase X — cerrar tras X1–X4. Phase W (#115–#117 analytics) debe implementarse **después** de X o adaptando read models a participations; no bloquea X.

## Alcance

| In | Fuera |
|----|-------|
| Reescribir § Flujo en `roulette-game.md` con diagrama v2 | Retirar código v1 antes de migración completa |
| Actualizar `staff-scan-flow.md` (Flujo A ruleta vs sello vs canje físico) | Platform superadmin changes |
| Scripts verify X1–X4 + entradas `AGENTS.md` | Reescribir Phase W issues |

## Criterios de aceptación

- [ ] `npm run verify:roulette-participation-use-case`
- [ ] `npm run verify:roulette-client-participation-use-case`
- [ ] `npm run verify:roulette-client-participation`
- [ ] `npm run verify:roulette-staff-authorize-use-case`
- [ ] `npm run verify:roulette-staff-authorize`
- [ ] `npm run verify:roulette-owner-config` cubre v2
- [ ] E2E feliz: enroll → staff authorize → client spin → premio
- [ ] E2E rechazos: not_enrolled, min_purchase, quota_exhausted
- [ ] `AGENTS.md` describe flujo operativo caja + app

## Capas / archivos principales

- `docs/domain/roulette-game.md`
- `docs/domain/staff-scan-flow.md`
- `AGENTS.md`
- `scripts/verify-roulette-*-participation*.ts`
- `scripts/verify-roulette-staff-authorize*.ts`

## Issues relacionadas

- Todas Phase X1–X4 en manifest phase-x

## Referencias

- Issues Phase V #108–#114 (implemented, superseded flow)
- Issues Phase W #115–#117 (analytics, post-X)
