## Objetivo

Dar al owner una vista operativa de la ruleta por día: cuántos giros hubo, qué premios salieron (p. ej. «Hoy: 3 giros · 1 premio: llavero») y, al pulsar un premio, la lista de clientes que lo ganaron con hora y estado de canje.

## Contexto

Phase W — analytics ruleta + ficha cliente 360. Depende de Phase V (ruleta MVP, tabla `roulette_spins` con `configSnapshot`, `prizeType`, `status`, `createdAt`). Patrón de ventanas temporales: `StampScanTimeWindows` + `env.appTimezone` (como `ListStampCampaignDashboard`). Zona clientes existente en `/customers` pero sin métricas ruleta.

## Alcance

| In | Fuera |
|----|-------|
| Read repo / métodos en `RouletteSpinRepository` para agregar por tenant + día | Analytics cross-tenant en `/platform` |
| Use cases `GetRouletteActivitySummary`, `ListRouletteActivitySpins` | Gráficos, export CSV, filtros multi-día avanzados |
| `GET /api/loyalty/games/ruleta/activity/summary?date=` (default hoy) | Employee en dashboard (owner-only, como config ruleta) |
| `GET /api/loyalty/games/ruleta/activity/spins?date=&segmentId=` | Edición de config desde esta pantalla |
| UI owner: pestaña «Actividad» en `/settings/games/ruleta` | Notificaciones push |
| Label premio desde `configSnapshot.segments[segmentIndex].label` | Re-etiquetar giros históricos si cambia config |
| Plan gate Premium + `gamification` | Basic/Pro sin ruleta |

**Definiciones:**

- **Giro:** fila en `roulette_spins` con `createdAt` en la ventana del día (timezone app).
- **Premio contabilizado:** `prizeType !== "none"` (segmentos «sin premio» no aparecen en el desglose).
- **Resumen por segmento:** `{ segmentId, label, spinCount, distinctCustomers }`.
- **Detalle:** `{ spinId, customerId, customerName, createdAt, prizeType, status, redeemedAt? }` ordenado por hora desc.

## Criterios de aceptación

- [ ] Owner Premium con ruleta activa ve KPI del día: total giros + lista de premios con conteos.
- [ ] Clic en un premio (p. ej. llavero) muestra tabla de ganadores con enlace a `/customers/[id]`.
- [ ] Sin giros → copy vacío amigable; tenant sin gamification → 403 coherente con otras APIs ruleta.
- [ ] Employee → 403 en APIs de actividad.
- [ ] Índice Prisma `(tenantId, createdAt)` si las queries lo requieren (migración opcional documentada).
- [ ] `npm run verify:roulette-activity-use-case`
- [ ] `npm run verify:roulette-activity-dashboard` (dev + `DATABASE_URL`)

## Capas / archivos principales

- `src/contexts/loyalty/games/domain/RouletteSpinRepository.ts` — métodos read agregados
- `src/contexts/loyalty/games/infrastructure/PrismaRouletteSpinRepository.ts`
- `src/contexts/loyalty/games/application/activity/GetRouletteActivitySummary.ts`
- `src/contexts/loyalty/games/application/activity/ListRouletteActivitySpins.ts`
- `src/app/api/loyalty/games/ruleta/activity/summary/route.ts`
- `src/app/api/loyalty/games/ruleta/activity/spins/route.ts`
- `src/app/_components/loyalty/games/RouletteActivityDashboard.tsx` — integrar en settings ruleta
- `src/lib/loyalty/requireOwnerRouletteConfigAccess.ts` (reutilizar guard owner)
- `scripts/verify-roulette-activity-*.ts`

## Issues relacionadas

- `customer-detail-promotions-roulette.md` — historial ruleta en ficha cliente (reutiliza read repo)
- `phase-w-roulette-analytics-verify-docs.md`

## Referencias

- [`roulette-game.md`](../domain/roulette-game.md)
- [`ListStampCampaignDashboard.ts`](../../src/contexts/loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard.ts)
- [`StampCampaignDashboardPanel.tsx`](../../src/app/_components/loyalty/StampCampaignDashboardPanel.tsx)
