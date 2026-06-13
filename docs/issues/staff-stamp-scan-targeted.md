> **Superseded by Phase M** ([#65](https://github.com/3urega/fidelization/issues/65)–[#70](https://github.com/3urega/fidelization/issues/70)). El scan ya no filtra por `stampTypeId`; el empleado elige una tarjeta concreta. Ver [`staff-scan-flow.md`](../domain/staff-scan-flow.md).

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
