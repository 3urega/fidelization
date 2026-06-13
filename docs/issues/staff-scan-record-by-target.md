## Objetivo

Refactorizar el escaneo para que **cada visita afecte exactamente a una tarjeta o una promoción** (`targetId`), con outcomes tipados y mensaje «¡Producto anotado! {current} de {required} completados».

## Contexto

Phase M — requiere M1 + M2. **Elimina** el bucle `addStampsForActiveCampaigns` que hoy aplica sellos a todas las campañas del mismo `stampTypeId` en [`RecordCustomerVisitByQr`](../../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts).

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/loyalty/scan` `{ qrValue, targetType, targetId }` | `stampTypeId` (eliminar del contrato) |
| `stamp_campaign`: +1 punto + **un** sello en `targetId` | Sello en varias campañas |
| `promotion`: +1 punto + uso promoción (lógica `RecordPromotionUse`) | Cupones / push |
| Outcomes tipados (ver abajo) | Canje recompensas en scan |
| Resolver cliente unificado (legacy QR + platform user + **auto-join**) | |
| `POST /api/loyalty/promotions/[id]/use` delega internamente al mismo use case o se depreca con 410 | UI separada de promo use |

## Outcomes (`outcomes[]`)

| `kind` | Cuándo | Mensaje UI |
|--------|--------|------------|
| `point_recorded` | Siempre que el scan persiste visita/punto | «Punto anotado» |
| `stamp_added` | Sello añadido en tarjeta activa no completada | «¡Producto anotado! {current} de {required} completados» |
| `card_completed` | Tras sello que completa la tarjeta | «¡Has completado la tarjeta!» |
| `card_already_completed` | Scan en tarjeta ya completada | «La tarjeta ya está completada» (sin sello duplicado; **sí** punto) |
| `promotion_applied` | Uso promo dentro de límite | «Promoción aplicada» |
| `promotion_exhausted` | `usedCount >= maxUsesPerUser` | «¡La promoción ya ha sido agotada!» (**sí** punto; sin incrementar uso) |

## Reglas de dominio (edge cases)

- **Auto-join:** misma resolución de cliente que hoy en scan de tarjeta (`users.qr_value` → crear `customers` si no existe) también para `targetType=promotion`. No reutilizar `RecordPromotionUse` sin unificar join.
- **Promo agotada:** no lanzar 500; devolver 200 con `promotion_exhausted` + `point_recorded` (el cliente igualmente visitó el local).
- **Tarjeta completada:** no `stamp_added`; sí `card_already_completed` + `point_recorded`.
- **Sin campañas activas:** el picker (M2) devuelve lista vacía; scan bloqueado en UI (M4). API: 400 si `targetId` no es campaña activa.
- **Respuesta:** sustituir `stampsAdded[]` por `outcomes[]`; eliminar `selectedStampTypeLabel`.

## Criterios de aceptación

- [ ] Sin `targetType`/`targetId` → 400; `stampTypeId` en body → 400
- [ ] **Regresión clave:** 2 campañas mismo `stampTypeId` → scan tarjeta A solo muta A
- [ ] `stamp_added` incluye `current`, `required`, `campaignName`
- [ ] Completar tarjeta: `stamp_added` + `card_completed` + `point_recorded`
- [ ] Re-scan tarjeta completada: `card_already_completed` + `point_recorded` (sin sello)
- [ ] Promo agotada: `promotion_exhausted` + `point_recorded`
- [ ] Primer scan con `users.qr_value` sin customer row → auto-join (tarjeta **y** promo)
- [ ] `npm run verify:staff-scan-record-by-target-use-case`
- [ ] `npm run verify:staff-scan-record-by-target` (E2E)

## Capas / archivos principales

- `RecordStaffScanByTarget.ts` (o refactor `RecordCustomerVisitByQr`)
- Extraer `resolveCustomerByQr` compartido (join incluido) para tarjeta y promo
- Eliminar `addStampsForActiveCampaigns` y `ResolveStampScanOptions` del path scan
- `src/app/api/loyalty/scan/route.ts`
- `src/app/api/loyalty/promotions/[promotionId]/use/route.ts` (delegar o deprecar)
- `src/lib/auth/http.ts` — `staffScanOutcomeToJson`

## Issues relacionadas

- [#66](https://github.com/3urega/fidelization/issues/66) M2
- [#68](https://github.com/3urega/fidelization/issues/68) M4
- [#69](https://github.com/3urega/fidelization/issues/69) M5
- [#70](https://github.com/3urega/fidelization/issues/70) M6 docs

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)

## Verify

```bash
npm run verify:staff-scan-record-by-target-use-case
npm run verify:staff-scan-record-by-target
```
