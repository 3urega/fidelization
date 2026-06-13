## Objetivo

Exponer `GET /api/loyalty/stamp-campaigns/dashboard` para que el owner obtenga métricas de escaneos por campaña activa, con verify E2E.

## Contexto

Phase K — [`stamp-campaign-owner-dashboard.md`](../domain/stamp-campaign-owner-dashboard.md). Depende de **K1** (`ListStampCampaignDashboard`). Bloquea K4 (UI consume este endpoint).

## Alcance

| In | Fuera |
|----|-------|
| Ruta thin `GET /api/loyalty/stamp-campaigns/dashboard` | PATCH/POST |
| Guard sesión tenant + rol **owner** | Acceso empleado |
| DTO JSON estable (`campaigns[]`, `scans`, `timezone`, `generatedAt`) | Paginación |
| Handler HTTP + registro DI | Tabs UI |
| `verify:stamp-campaign-dashboard` (E2E: campaña + escaneos + asserts contadores) | |

## Criterios de aceptación

- [ ] Owner autenticado recibe 200 con campañas activas y contadores
- [ ] Empleado u owner sin sesión recibe 403/401 según convención tenant API
- [ ] Respuesta incluye `stampTypeLabel` cuando la campaña tiene tipo
- [ ] Verify crea campaña, ejecuta N escaneos vía `POST /api/loyalty/scan`, valida contadores en dashboard
- [ ] `npm run verify:stamp-campaign-dashboard-use-case` (si no existe aún, depende K1) + `npm run verify:stamp-campaign-dashboard` pasan
- [ ] Entrada en `package.json` y `AGENTS.md`

## Capas / archivos principales

- `src/app/api/loyalty/stamp-campaigns/dashboard/route.ts`
- `src/lib/http/stampCampaignDashboard.ts` (serialización JSON)
- `scripts/verify-stamp-campaign-dashboard.ts`
- Extensión de `scripts/verify-stamp-campaign-dashboard-use-case.ts` si hace falta integración API

## Issues relacionadas

- K1: dominio (`stamp-campaign-dashboard-domain.md`)
- K3: tabs (`owner-panel-tabs-dashboard.md`)
- K4: UI (`stamp-campaign-dashboard-ui.md`)

## Verify

```bash
npm run verify:stamp-campaign-dashboard-use-case
npm run verify:stamp-campaign-dashboard
```

## Referencias

- [stamp-campaign-owner-dashboard.md](../domain/stamp-campaign-owner-dashboard.md)
