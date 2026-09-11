## Objetivo

Pantalla de gestión loyalty en el flujo staff scan: tarjetas de sellos con progreso real y promociones con usos, acciones vía `POST /api/loyalty/scan` y refetch del session context.

## Contexto

Phase Y — slice **Y3a**. Requiere Y1 + Y2 (hub + session). Mantiene invariante **un POST = un target**. Ver [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) § Paso 3 loyalty.

Legacy ruleta `unlockEnabled`: registrar visita en tarjeta/promo sigue pudiendo emitir `roulette_spin_granted`; mostrar outcome ruleta como hoy en `StaffScanForm` (banner + `StaffScanOutcomesList`).

## Alcance

| In | Fuera |
|----|-------|
| Ruta `/scan/session/loyalty` (sellos; promos en misma ruta o sub-sección) | Panel ruleta authorize — issue ruleta/redeem |
| `StaffScanLoyaltyPanel`: `LoyaltyProgress` con `current` del session | Canje físico |
| CTA «Añadir sello» por campaña → `POST /api/loyalty/scan` `stamp_campaign` | Cambiar contrato POST |
| CTA «Aplicar promoción» → `targetType: promotion` | Re-QR en cada acción (QR guardado en contexto sesión) |
| Tras éxito: outcomes + refetch `GET session?customerId=` | Cámara |
| Deshabilitar CTA si `completed` / `promotion_exhausted` según session | |
| Shell `StaffScanSessionLayout` completo (breadcrumb, sticky cliente) | |

## Criterios de aceptación

- [ ] Campaña 3/10 muestra progreso 3/10; tras añadir sello, UI muestra 4/10 tras refetch.
- [ ] Tarjeta completada: no CTA sello; scan devuelve `card_already_completed` si se fuerza.
- [ ] Promo con usos agotados: CTA deshabilitado o mensaje claro; POST devuelve `promotion_exhausted` coherente.
- [ ] Con `unlockEnabled`, registrar visita muestra banner `roulette_spin_granted` cuando aplique.
- [ ] Paridad con mensajes `StaffScanOutcome` existentes.
- [ ] `npm run verify:staff-scan-record-by-target*` sigue pasando.

## Capas / archivos principales

- `src/app/(app)/scan/session/loyalty/page.tsx`
- `src/app/_components/loyalty/StaffScanLoyaltyPanel.tsx`
- `src/app/_components/loyalty/StaffScanSessionLayout.tsx`
- Reuso `StaffScanOutcomesList`, `formatStaffScanOutcomeMessage`
- Contexto sesión: QR en memoria para POST sin reintroducir en UI

## Issues relacionadas

- `staff-scan-identify-hub-ui.md`
- `staff-scan-session-ruleta-redeem-panels.md`
- `staff-scan-qr-first-cleanup-docs.md`

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)
- [staff-scan-qr-first-plan.md](../domain/staff-scan-qr-first-plan.md)

## Verify

```bash
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
npm run verify:staff-scan-session
```
