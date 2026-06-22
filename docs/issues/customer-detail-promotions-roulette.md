## Objetivo

Enriquecer la ficha de cliente del owner (`/customers/[id]`) con promociones activas (estado de uso) e historial de giros de ruleta (premio, fecha, estado de canje), además de lo ya mostrado (sellos/tarjetas, actividad, recompensas).

## Contexto

Phase W — complementa el dashboard de actividad ruleta. La zona clientes (Phase L) expone `GetTenantCustomerDetail` con `stampProgress[]`, `recentActivity[]`, `rewardsRedeemed[]` pero **sin promos ni ruleta**. Existe `ListCustomerPromotionSummaries` para el cliente en `/app/card`; hay que reutilizar la misma lógica owner-side. Tabla `roulette_spins` ya audita cada giro por `customerId`.

## Alcance

| In | Fuera |
|----|-------|
| Extender `CustomerDetailView` con `promotions[]` y `rouletteSpins[]` | Employee acceso a `/customers` (sigue owner-only) |
| Ampliar `GetTenantCustomerDetail` (inyectar `ListCustomerPromotionSummaries` + list spins por customer) | CRUD promos / canje manual desde ficha |
| Actualizar `GET /api/loyalty/customers/[id]` + tipos en `customerZone.ts` | Promos históricas inactivas (solo activas + uso) |
| UI: secciones «Promociones» y «Ruleta» en `CustomerDetailPanel` | Acciones rápidas (siguen «Próximamente») |
| Promos: título, tipo, `usedCount` / `maxUsesPerUser`, activa/inactiva | Cross-tenant promos |
| Ruleta: label segmento, `prizeType`, `status`, `createdAt`, `redeemedAt` | Re-girar / anular giros |
| Plan gate promos: Pro+ (`promotions` feature); ruleta: Premium + `gamification` | |

**Shape sugerido:**

```ts
promotions: { id, title, type, isActive, usedCount, maxUsesPerUser | null }[]
rouletteSpins: { id, segmentLabel, prizeType, status, createdAt, redeemedAt | null }[]
```

Orden ruleta: `createdAt` desc, límite razonable (p. ej. 50).

## Criterios de aceptación

- [ ] Owner abre `/customers/[id]` y ve promociones activas con uso (p. ej. «2/3 usos» o «Sin límite · 1 uso»).
- [ ] Tenant Basic → sección promos vacía o mensaje plan (coherente con `ListCustomerPromotionSummaries`).
- [ ] Historial ruleta lista giros del cliente con premio legible y badge estado (`applied`, `pending_redeem`, `expired`).
- [ ] Tenant sin gamification → sección ruleta vacía sin error.
- [ ] Employee → 403 (sin cambio de política actual).
- [ ] `npm run verify:customer-detail-promotions-roulette-use-case`
- [ ] `npm run verify:customer-detail-promotions-roulette` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `src/contexts/loyalty/customers/domain/analytics/CustomerDetail.ts`
- `src/contexts/loyalty/customers/application/analytics/GetTenantCustomerDetail.ts`
- `src/contexts/loyalty/games/domain/RouletteSpinRepository.ts` — `listByCustomer(tenantId, customerId, limit)`
- `src/app/api/loyalty/customers/[id]/route.ts`
- `src/lib/loyalty/customerZone.ts`
- `src/app/_components/loyalty/customer-zone/CustomerDetailPanel.tsx`
- `scripts/verify-customer-detail-promotions-roulette*.ts`

## Issues relacionadas

- `roulette-activity-dashboard.md` — vista agregada día + drill-down (enlace inverso desde premio → cliente)
- `phase-w-roulette-analytics-verify-docs.md`

## Referencias

- [`CustomerDetailPanel.tsx`](../../src/app/_components/loyalty/customer-zone/CustomerDetailPanel.tsx)
- [`GetTenantCustomerDetail.ts`](../../src/contexts/loyalty/customers/application/analytics/GetTenantCustomerDetail.ts)
- [`ListCustomerPromotionSummaries.ts`](../../src/contexts/loyalty/promotions/application/list/ListCustomerPromotionSummaries.ts)
