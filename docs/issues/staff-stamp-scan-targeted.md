## Objetivo

El empleado elige el tipo al escanear; el sello solo avanza en la campaña correspondiente.

## Contexto

Phase H3 — núcleo del producto. Requiere H1 + H2.

## Alcance

| In | Fuera |
|----|-------|
| `stampTypeId` en `POST /api/loyalty/scan` | Cámara QR |
| Selector botones en `/scan` | Cliente elige tipo |
| Regla: genéricas solo con `stampTypeId: null` | |

## Criterios de aceptación

- [ ] Escaneo Café ×N no avanza campaña Menú
- [ ] Sin `stampTypeId` cuando hay tipos activos → 400
- [ ] `verify:customer-stamp-scan-targeted*`
- [ ] Regresión `verify:customer-stamp-scan` con `stampTypeId: null`

## Verify

```bash
npm run verify:customer-stamp-scan-targeted-use-case
npm run verify:customer-stamp-scan-targeted
npm run verify:customer-stamp-scan
```
