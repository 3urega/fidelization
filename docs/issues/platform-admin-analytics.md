## Objetivo

Módulo de **analítica de plataforma**: top negocios, actividad de fidelización y promociones.

## Contexto

- Nav: `/platform/analytics` marcado `comingSoon`.
- Datos: `loyalty_transactions`, `customers`, `promotions`, `stamp_campaigns`.
- Visión: [`docs/superadmin.md`](../superadmin.md) § Analytics.

## Alcance

| In | Fuera |
|----|-------|
| Activar `/platform/analytics` | BI externo (Metabase) |
| Rankings: top tenants por escaneos, sellos, premios canjeados (periodo 7/30 días) | Mapas geográficos |
| Totales plataforma alineados con dashboard P1 | Export PDF |
| `GET /api/platform/analytics/summary` | Predicción ML |

## Criterios de aceptación

- [ ] Agregaciones scoped cross-tenant solo en API platform (nunca tenant session).
- [ ] Performance aceptable en seed demo (<2s en dev).
- [ ] Verify use case + E2E smoke.

## Capas / archivos principales

- `GetPlatformAnalyticsSummary` + repos read-only loyalty
- Charts simples (tablas + barras CSS/theme)

## Issues relacionadas

- `platform-admin-kpi-dashboard.md` (P1)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
