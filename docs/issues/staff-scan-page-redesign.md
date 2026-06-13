## Objetivo

Rediseñar `/scan`: el empleado elige **una tarjeta concreta** (no un tipo de consumición), escanea, y ve **«¡Producto anotado! 5 de 10 completados»** u otros outcomes claros.

## Contexto

Phase M — requiere M2 + M3. Sustituye [`StaffScanForm`](../../src/app/_components/loyalty/StaffScanForm.tsx) que hoy usa botones por `stampTypeId` y puede afectar varias campañas.

## Alcance

| In | Fuera |
|----|-------|
| Grid: **una tarjeta = un botón/target** (`LoyaltyProgress` + fondo) | Selector por tipo consumición |
| Promociones activas Pro+ como targets separados | Editar campañas desde scan |
| Selección obligatoria antes del QR | Scan sin target |
| Mensaje principal post-scan tarjeta | Cámara QR |

## Mensajes UI (post-scan)

| Outcome | Copy |
|---------|------|
| `stamp_added` | **«¡Producto anotado! {current} de {required} completados»** |
| `point_recorded` | «Punto anotado» |
| `card_completed` | «¡Has completado la tarjeta!» |
| `card_already_completed` | «La tarjeta ya está completada» |
| `promotion_applied` | «Promoción aplicada» |
| `promotion_exhausted` | «¡La promoción ya ha sido agotada!» |

## Criterios de aceptación

- [ ] **Eliminar** «¿Qué ha consumido?» y botones `stampTypeId`
- [ ] Si hay 2 tarjetas «Café», se muestran **2** cards seleccionables con nombre distinto
- [ ] Tarjeta seleccionada: borde/estado primary claro
- [ ] Sin target → no enviar scan
- [ ] Outcomes en bloques legibles (no string `join(" · ")`)
- [ ] Mobile-first; theme tokens

## Capas / archivos principales

- `src/app/(app)/scan/page.tsx`
- `StaffScanForm.tsx` o `StaffScanPanel.tsx`
- `LoyaltyCardBackground`, `LoyaltyProgress`

## Issues relacionadas

- [#66](https://github.com/3urega/fidelization/issues/66) M2
- [#67](https://github.com/3urega/fidelization/issues/67) M3
- [#69](https://github.com/3urega/fidelization/issues/69) M5

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)
