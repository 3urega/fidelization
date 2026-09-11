## Objetivo

Añadir escaneo con cámara en el paso 1 (identificar cliente) de `/scan`, manteniendo pegado manual como fallback.

## Contexto

Phase Y — slice **Y4** (opcional). Requiere Y2 identify step estable. Ver [`staff-scan-qr-first-plan.md`](../domain/staff-scan-qr-first-plan.md) § Y4.

## Alcance

| In | Fuera |
|----|-------|
| Integración cámara web y/o Capacitor en `StaffScanIdentifyStep` | Cambios session API |
| Permisos y UX error (denegado, no soportado) | QR en deep link URL |
| Decodificar valor QR → mismo flujo que paste → session GET | Paneles loyalty/ruleta |
| Documentar limitaciones dev desktop | |

## Criterios de aceptación

- [ ] En entorno soportado, escanear QR rellena valor y permite continuar al hub.
- [ ] Pegado manual sigue funcionando.
- [ ] Sin regresión en verifies staff scan existentes (smoke manual o script mínimo si aplica).

## Capas / archivos principales

- `src/app/_components/loyalty/StaffScanIdentifyStep.tsx`
- Posible hook `useQrScanner` bajo `src/app/_components/` o `src/lib/`
- Nota en `docs/domain/staff-scan-flow.md`

## Issues relacionadas

- `staff-scan-identify-hub-ui.md`

## Referencias

- [staff-scan-qr-first-plan.md](../domain/staff-scan-qr-first-plan.md)
- Capacitor / Next.js client components

## Verify

```bash
npm run verify:staff-scan-session
npm run verify:staff-scan-roulette-ux
```
