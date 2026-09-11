## Objetivo

Pantallas staff para ruleta (autorización v2 + hints legacy) y canje de premios físicos, integradas en el hub QR-first con estado de participación visible antes de actuar.

## Contexto

Phase Y — slice **Y3b**. Requiere Y1 + Y2. Writes sin cambios: `POST /api/loyalty/scan` (`roulette_authorize`) y redeem API existente. Ver [`roulette-game.md`](../domain/roulette-game.md) y [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md).

## Alcance

| In | Fuera |
|----|-------|
| Ruta `/scan/session/ruleta` + `StaffScanRuletaPanel` | Loyalty sellos/promos — Y3a |
| Mostrar participación (`not_enrolled`, tiradas restantes, `pendingAuthorization`, min purchase) | Cambiar reglas dominio ruleta |
| Importe € + autorizar → outcomes `roulette_auth_granted` / `roulette_auth_denied` | Nueva API authorize |
| Copy/hints legacy cuando `unlockEnabled` (enlace o CTA hacia loyalty) | |
| Ruta `/scan/session/redeem` + `StaffScanRedeemPanel` (migrar lógica de `StaffRoulettePendingRedeem`) | Auto-lookup QR duplicado en `<details>` |
| Lista pending + `POST …/redeem`; refetch session count | Cámara |
| Refetch session tras autorizar / canjear | |

## Criterios de aceptación

- [ ] Cliente sin inscripción: panel ruleta muestra estado antes de submit; deny coherente tras autorizar si aplica.
- [ ] Cuota diaria/período agotada: visible en panel (datos session) y outcome deny al intentar.
- [ ] Autorización v2 exitosa: banner + refetch; cliente puede girar en app (paridad `verify:roulette-staff-authorize*`).
- [ ] Canje premio físico desde hub/redeem route; segundo redeem → error conocido (409).
- [ ] No queda sección colapsada huérfina en `/scan` principal tras esta issue (redeem solo en flujo session).
- [ ] `npm run verify:roulette-staff-authorize`, `verify:roulette-staff-redeem`, `verify:staff-scan-roulette-ux` pasan.

## Capas / archivos principales

- `src/app/(app)/scan/session/ruleta/page.tsx`
- `src/app/(app)/scan/session/redeem/page.tsx`
- `src/app/_components/loyalty/StaffScanRuletaPanel.tsx`
- `src/app/_components/loyalty/StaffScanRedeemPanel.tsx`
- Deprecar uso principal de `StaffRoulettePendingRedeem` en page root (eliminar en Y5)

## Issues relacionadas

- `staff-scan-session-domain-api.md`
- `staff-scan-session-loyalty-panels.md`
- `staff-scan-qr-first-cleanup-docs.md`

## Referencias

- [roulette-game.md](../domain/roulette-game.md)
- [staff-scan-flow.md](../domain/staff-scan-flow.md) § Staff scan + ruleta

## Verify

```bash
npm run verify:roulette-staff-authorize-use-case
npm run verify:roulette-staff-authorize
npm run verify:roulette-staff-redeem-use-case
npm run verify:roulette-staff-redeem
npm run verify:staff-scan-roulette-ux
```
