## Objetivo

Modelar en dominio los read models y reglas de segmentación de la **Zona Clientes** owner: insights agregados, listado por segmento (destacados, en riesgo, cerca de premio, todos) y estado de engagement por cliente.

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Fuente: `customers`, `loyalty_transactions`, `customer_stamp_progress`, `reward_redeemed` (si existe). Sin nueva tabla en v1; agregaciones en repo de lectura. Patrón Phase K: read model + puerto Prisma.

## Alcance

| In | Fuera |
|----|-------|
| VOs/read models: `CustomerEngagementStatus`, `CustomerListRow`, `CustomerInsightsSummary`, `CustomerNearRewardProgress` | Tabla nueva de eventos |
| Puerto `TenantCustomerAnalyticsRepository` | Acciones «Regalar sello/recompensa» |
| Servicio puro `CustomerEngagementClassifier` (umbrales documentados) | Total gastado / POS |
| Casos de uso: `GetTenantCustomerInsights`, `ListTenantCustomersBySegment`, `GetTenantCustomerDetail` | UI, rutas HTTP |
| `PrismaTenantCustomerAnalyticsRepository` | Paginación avanzada (limit fijo 50 en listado `all` OK) |
| `verify:customer-zone-use-case` | Notas de cliente en BD |

### Reglas v1 (documentar en dominio)

- **Última visita:** `MAX(loyalty_transactions.created_at)` por cliente (tipos visita/sello/puntos).
- **Destacados:** top 10 por visitas en ventana calendario mes actual (`APP_TIMEZONE`).
- **En riesgo:** sin visita ≥ 21 días naturales.
- **Cerca de premio:** alguna campaña activa con `current >= required - 1` y `current < required`.
- **Estado badge:** `vip` (destacado), `active` (visita &lt; 14 días), `at_risk` (14–44 días), `inactive` (≥ 45 días).
- Solo tenant de sesión; rol **owner** en casos de uso (guard en aplicación).

## Criterios de aceptación

- [ ] Dominio + puerto + repo Prisma con consultas agregadas (evitar N+1 en insights)
- [ ] Casos de uso registrados en DI
- [ ] `npm run verify:customer-zone-use-case` con datos seed/demo

## Capas / archivos principales

- `src/contexts/loyalty/customers/domain/analytics/*`
- `src/contexts/loyalty/customers/application/analytics/*`
- `src/contexts/loyalty/customers/infrastructure/PrismaTenantCustomerAnalyticsRepository.ts`
- `scripts/verify-customer-zone-use-case.ts`

## Issues relacionadas

- L2: API (`customer-zone-api.md`)
- L3–L6: presentación

## Referencias

- [zona-clientes.md](../zona-clientes.md)
- [stamp-campaign-owner-dashboard.md](../domain/stamp-campaign-owner-dashboard.md) — patrón read model Phase K
