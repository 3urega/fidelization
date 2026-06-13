## Objetivo

Definir el modelo de dominio del escaneo staff «target-first»: **un scan = una tarjeta o una promoción concreta**, nunca varias tarjetas a la vez. El sistema devuelve outcomes tipados para mensajes como «¡Producto anotado! 5 de 10 completados».

## Contexto

**Bug de diseño actual:** `/scan` filtra por `stampTypeId` y aplica sellos a **todas** las campañas del tipo en [`RecordCustomerVisitByQr`](../../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts) (`addStampsForActiveCampaigns`). Eso debe eliminarse.

Plan: [`staff-scan-flow.md`](../domain/staff-scan-flow.md).

## Invariante de negocio

- Cada `POST /api/loyalty/scan` muta **como máximo una** campaña de sellos (`targetId`).
- Dos tarjetas con el mismo tipo (p. ej. dos campañas «Café») son targets independientes en el picker.
- Si el empleado no elige tarjeta → 400; no hay fallback a «aplicar a todas».

## Alcance

| In | Fuera |
|----|-------|
| Tipos `StaffScanTargetType`, `StaffScanOutcome`, contrato API | Implementación API/UI (M2–M5) |
| Regla: un solo target por scan | Puntos configurables por tenant |
| Copy principal: «¡Producto anotado! {current} de {required} completados» | Cámara QR |

## Criterios de aceptación

- [ ] Doc [`staff-scan-flow.md`](../domain/staff-scan-flow.md) alineado con tipos en código (M3)
- [ ] `StaffScanTargetType`: `stamp_campaign` \| `promotion`
- [ ] `StaffScanOutcome`: `point_recorded`, `stamp_added`, `card_completed`, `promotion_applied`, `promotion_exhausted`
- [ ] `stamp_added` incluye `current`, `required`, `campaignName` para mensaje UI
- [ ] **Eliminar** soporte `stampTypeId` en scan (sin compat legacy)
- [ ] Documentar eliminación de `addStampsForActiveCampaigns` (bucle multi-campaña)

## Capas / archivos principales

- `docs/domain/staff-scan-flow.md`
- `src/contexts/loyalty/customers/domain/StaffScanOutcome.ts` (nuevo)
- `src/contexts/loyalty/customers/domain/StaffScanTarget.ts` (nuevo)

## Issues relacionadas

- [#66](https://github.com/3urega/fidelization/issues/66) M2 targets API
- [#67](https://github.com/3urega/fidelization/issues/67) M3 record by target

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)
