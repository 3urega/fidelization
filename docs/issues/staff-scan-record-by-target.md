## Objetivo

Refactorizar el escaneo para que **cada visita afecte exactamente a una tarjeta o una promoción** (`targetId`), con mensaje «¡Producto anotado! {current} de {required} completados».

## Contexto

Phase M — requiere M1 + M2. **Elimina** el bucle `addStampsForActiveCampaigns` que hoy aplica sellos a todas las campañas del mismo `stampTypeId` en [`RecordCustomerVisitByQr`](../../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts).

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/loyalty/scan` `{ qrValue, targetType, targetId }` | `stampTypeId` (eliminar del contrato) |
| `stamp_campaign`: +1 punto + **un** sello en `targetId` | Sello en varias campañas |
| `promotion`: +1 punto + `RecordPromotionUse` | Cupones / push |
| Outcomes tipados + copy ES | Canje recompensas en scan |
| Eliminar `addStampsForActiveCampaigns` | Mantener compat multi-campaña |

## Criterios de aceptación

- [ ] Sin `targetType`/`targetId` → 400
- [ ] **Regresión clave:** tenant con 2 campañas activas mismo `stampTypeId` → scan tarjeta A solo incrementa A; B sin cambios
- [ ] Response `stamp_added` con `current`/`required` para «¡Producto anotado! 5 de 10 completados»
- [ ] Tarjeta ya completada: sin sello duplicado; outcome coherente
- [ ] Completar tarjeta: `stamp_added` + `card_completed`
- [ ] Promo agotada: `promotion_exhausted` + «¡La promoción ya ha sido agotada!»
- [ ] Auto-join platform user QR en primer scan (regresión)
- [ ] `verify:customer-stamp-scan-targeted*` migrados al contrato target (una tarjeta)
- [ ] `npm run verify:staff-scan-record-by-target-use-case`
- [ ] `npm run verify:staff-scan-record-by-target` (E2E)

## Capas / archivos principales

- `RecordStaffScanByTarget.ts` (o refactor `RecordCustomerVisitByQr`)
- Eliminar filtro `campaigns.filter(stampTypeId === …)` y bucle multi-campaña
- `src/app/api/loyalty/scan/route.ts`
- `src/lib/auth/http.ts` — `staffScanOutcomeToJson`

## Issues relacionadas

- [#66](https://github.com/3urega/fidelization/issues/66) M2
- [#68](https://github.com/3urega/fidelization/issues/68) M4
- [#69](https://github.com/3urega/fidelization/issues/69) M5

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
npm run verify:customer-scan
npm run verify:customer-stamp-scan-targeted
```
