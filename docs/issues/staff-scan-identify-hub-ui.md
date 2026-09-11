## Objetivo

Rediseñar `/scan` con flujo QR-first: paso 1 identificar cliente, paso 2 hub de actividades con badges de estado, sin el picker target-first monolítico.

## Contexto

Phase Y — slice **Y2**. Requiere **Y1** (`GET /api/loyalty/scan/session`). Ver [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) § Pasos 1–2.

Defaults UX (preguntas abiertas del plan):

- Hub: **dos** tarjetas de actividad «Tarjetas de sellos» y «Promociones» cuando aplique plan (no fusionar en una sola en esta slice; paneles en Y3).
- Sesión: `customerId` en query `/scan/session?c=…`; QR no en URL.
- «Escanear otro cliente» limpia sesión y vuelve a paso 1.

## Alcance

| In | Fuera |
|----|-------|
| `StaffScanIdentifyStep` en `/scan` | Paneles de gestión (acciones POST) — Y3 |
| Ruta/página hub `/scan/session` + `StaffScanActivityHub` | Cámara QR — Y4 |
| `useStaffScanSession` (fetch, error states, refetch stub) | Eliminar componentes legacy — Y5 |
| Badges: progreso sellos, promo usos, ruleta status, count premios pending | Deep link `/scan?qr=` |
| `StaffScanSessionLayout` mínimo en hub (header cliente: nombre, puntos, visitas) | |
| Deshabilitar tarjeta actividad cuando `blockReason` / capacidad tenant | |
| Actualizar `verify:staff-scan-roulette-ux` (copy/rutas esperadas) | |

## Criterios de aceptación

- [ ] Tras pegar QR válido y continuar, usuario llega al hub con datos de session API (progreso real visible en badges).
- [ ] Actividades no disponibles (sin campañas, sin gamification, etc.) no aparecen o aparecen deshabilitadas con motivo.
- [ ] Navegar a sub-rutas Y3 muestra shell con «atrás al hub» (rutas pueden ser placeholder hasta Y3).
- [ ] «Escanear otro cliente» resetea flujo.
- [ ] Owner y employee pueden usar la pantalla en dev demo.
- [ ] Ya no se usa `StaffScanForm` + `StaffScanTargetPicker` como flujo principal en `/scan`.
- [ ] `npm run verify:staff-scan-roulette-ux` pasa con asserts actualizados.

## Capas / archivos principales

- `src/app/(app)/scan/StaffScanPageClient.tsx` (refactor o split)
- `src/app/(app)/scan/session/page.tsx` (nuevo)
- `src/app/_components/loyalty/StaffScanIdentifyStep.tsx`
- `src/app/_components/loyalty/StaffScanActivityHub.tsx`
- `src/app/_components/loyalty/useStaffScanSession.ts`
- `scripts/verify-staff-scan-roulette-ux.ts`

## Issues relacionadas

- `staff-scan-session-domain-api.md` (bloqueante)
- `staff-scan-session-loyalty-panels.md`, `staff-scan-session-ruleta-redeem-panels.md`

## Referencias

- [staff-scan-qr-first-plan.md](../domain/staff-scan-qr-first-plan.md)
- [style-guidelines.md](../frontend/style-guidelines.md)

## Verify

```bash
npm run verify:staff-scan-session
npm run verify:staff-scan-roulette-ux
```
