## Objetivo

Implementar el caso de uso de dominio que agrega escaneos de sello (`stamp_added`) por campaña activa y ventana temporal, base del dashboard owner.

## Contexto

Phase K — [`stamp-campaign-owner-dashboard.md`](../domain/stamp-campaign-owner-dashboard.md). Depende de campañas (#21) y metadata `campaignId` en escaneos (Phase H / #22). Primer slice del batch; bloquea K2–K4.

## Alcance

| In | Fuera |
|----|-------|
| `StampCampaignScanCounts`, `StampCampaignDashboardRow` | API HTTP |
| `StampScanTimeWindows` (hoy, ayer, 7 días, desde creación) | UI `/panel` |
| Puerto `StampCampaignScanStatsRepository` + Prisma | Gráficos, CSV |
| `ListStampCampaignDashboard` (solo campañas activas, tenant aislado) | Métricas de puntos/visitas |
| Índice `(tenant_id, type, created_at)` en `loyalty_transactions` | Timezone por tenant en BD |
| `verify:stamp-campaign-dashboard-use-case` (domain stub) | |

## Criterios de aceptación

- [ ] `ListStampCampaignDashboard.run({ tenantId })` devuelve solo campañas `isActive = true` con contadores `{ today, yesterday, last7Days, sinceStart }`
- [ ] Conteo = filas `loyalty_transactions` con `type = stamp_added` y `metadata.campaignId` coincidente en el rango temporal
- [ ] Ventanas calendario usan `APP_TIMEZONE` (default `Europe/Madrid`) vía [`src/lib/env.ts`](../../src/lib/env.ts)
- [ ] `sinceStart` usa `stamp_campaigns.created_at` como límite inferior
- [ ] Consulta agregada eficiente (sin N+1 por campaña)
- [ ] Registro en DI (`shared` container)
- [ ] `npm run verify:stamp-campaign-dashboard-use-case` pasa

## Capas / archivos principales

- `src/contexts/loyalty/stamp_campaigns/domain/StampCampaignDashboardRow.ts`
- `src/contexts/loyalty/stamp_campaigns/domain/StampCampaignScanStatsRepository.ts`
- `src/contexts/loyalty/stamp_campaigns/domain/StampScanTimeWindows.ts`
- `src/contexts/loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard.ts`
- `src/contexts/loyalty/stamp_campaigns/infrastructure/PrismaStampCampaignScanStatsRepository.ts`
- `prisma/migrations/*_loyalty_transactions_scan_stats_index/` (opcional)
- `scripts/verify-stamp-campaign-dashboard-use-case.ts`

## Issues relacionadas

- K2: API + verify E2E (`stamp-campaign-dashboard-api.md`)
- K3: tabs panel (`owner-panel-tabs-dashboard.md`)
- K4: UI métricas (`stamp-campaign-dashboard-ui.md`)

## Referencias

- [stamp-campaign-owner-dashboard.md](../domain/stamp-campaign-owner-dashboard.md)
- [`RecordCustomerVisitByQr`](../../src/contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr.ts)
