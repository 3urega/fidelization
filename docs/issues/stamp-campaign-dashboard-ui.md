## Objetivo

Mostrar en `/panel` (tab **Dashboard**, owner) las campañas de sellos activas con escaneos hoy, ayer, última semana y desde el inicio.

## Contexto

Phase K — [`stamp-campaign-owner-dashboard.md`](../domain/stamp-campaign-owner-dashboard.md). Depende de **K2** (API) y **K3** (tabs shell). Cierra el batch K.

## Alcance

| In | Fuera |
|----|-------|
| `StampCampaignDashboardPanel`: fetch `GET /api/loyalty/stamp-campaigns/dashboard` | Editar campañas desde dashboard |
| Tarjeta por campaña: nombre, tipo, sellos requeridos, 4 métricas | Gráficos / tendencias |
| Empty state sin campañas activas + CTA `/settings/stamps` | Campañas inactivas |
| Estados loading / error con tokens theme | Export CSV |
| Placeholder «Clientes — Próximamente» sustituido o movido bajo dashboard | |

## Criterios de aceptación

- [ ] Owner en tab Dashboard ve lista de campañas activas con columnas/filas: Hoy · Ayer · 7 días · Desde inicio
- [ ] Tras escaneo staff, recargar dashboard refleja incremento (verify K2 cubre backend; smoke manual UI)
- [ ] Sin campañas activas: mensaje claro + enlace «Configurar sellos»
- [ ] UI mobile-first; tabla legible en pantalla estrecha (stack o scroll horizontal)
- [ ] Sin colores hardcodeados; [`style-guidelines.md`](../frontend/style-guidelines.md)
- [ ] Integrado en `OwnerHomeTabs` (K3)

## Capas / archivos principales

- `src/app/_components/loyalty/StampCampaignDashboardPanel.tsx`
- `src/app/(app)/panel/OwnerHomeTabs.tsx` (render tabpanel)
- Tipos compartidos con respuesta API

## Issues relacionadas

- K1: dominio (`stamp-campaign-dashboard-domain.md`)
- K2: API (`stamp-campaign-dashboard-api.md`)
- K3: tabs (`owner-panel-tabs-dashboard.md`)

## Referencias

- [stamp-campaign-owner-dashboard.md](../domain/stamp-campaign-owner-dashboard.md)
