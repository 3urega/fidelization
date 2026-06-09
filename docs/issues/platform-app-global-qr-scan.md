## Objetivo

**QR de pago único por usuario** (`users.qr_value`) y actualización del **staff scan** para resolver cliente por QR global dentro del tenant del empleado.

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § QR de pago, scan staff.
- Depende de: **platform-app-unified-auth** (`qr_value` en users), **platform-app-customer-join** (perfil por tenant).
- Hoy: `RecordCustomerVisitByQr` busca `searchByQrValue(tenantId, qrValue)` en `customers.qr_value`.

## Alcance

| In | Fuera |
|----|-------|
| Mostrar QR del **usuario** en detalle local y `/home/qr` (no QR por customer row) | Cambiar UI scan empleado (sigue `/scan`) |
| `RecordCustomerVisitByQr`: resolver user por `users.qr_value` → `customers` en tenant staff | Auto-join silencioso en scan (MVP: 404/403 claro «no registrado en este local») |
| Opcional acordado: primer scan con user app crea customer si policy «scan creates profile» — **default: no**, exigir join | Migrar `customers.qr_value` legacy web |
| Actualizar verify customer-scan para ambos paths (legacy customer qr + user qr) | NFC |

## Criterios de aceptación

- [ ] App muestra QR estable derivado de `users.qr_value`.
- [ ] Staff scan con QR de usuario app acumula puntos/sellos en tenant correcto si existe `customers.user_id`.
- [ ] Scan sin perfil en ese tenant → error mensaje claro.
- [ ] Cliente web legacy (`customers.qr_value` sin user) sigue funcionando en scan.
- [ ] `npm run verify:customer-scan` sin regresión.
- [ ] `npm run verify:platform-app-global-qr-scan` E2E pasa (register user → join → scan → points).

## Capas / archivos principales

- `src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts`
- `src/contexts/loyalty/customers/infrastructure/PrismaCustomerRepository.ts` — lookup by user qr
- `src/app/api/loyalty/scan/route.ts`
- Tests verify scripts

## Issues relacionadas

- Depende de: `platform-app-unified-auth.md`, `platform-app-customer-join.md`
- Relacionada: `platform-app-establishment-detail.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`RecordCustomerVisitByQr`](../../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts)
- `verify:customer-scan`
