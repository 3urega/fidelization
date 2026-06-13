## Objetivo

Dar visibilidad de **facturación e ingresos** al operador: suscripciones activas, MRR estimado y problemas de cobro.

## Contexto

- Stripe tenant billing: #32–#33 (`subscriptions`, webhooks, tenant `suspended` por impago).
- Visión: [`docs/superadmin.md`](../superadmin.md) § Facturación.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/billing` con cards: MRR estimado, suscripciones activas, tenants `past_due`/suspendidos por billing | Contabilidad / export CSV |
| Tabla suscripciones: tenant, plan, status Stripe, periodo | Emitir facturas manuales |
| `GET /api/platform/billing/overview` | Reconciliación contable ARR |
| Enlace externo opcional a Stripe Dashboard por `stripeCustomerId` | Google Play user billing |

## Criterios de aceptación

- [ ] MRR calculado desde planes activos (documentar fórmula: sum precios mensuales Pro/Premium).
- [ ] Lista pagos fallidos derivada de `subscriptions.status` + tenant status.
- [ ] Solo sesión platform; aislamiento verify.
- [ ] Verify use case + E2E.

## Capas / archivos principales

- `GetPlatformBillingOverview` aggregating `subscriptions` + `subscription_plans` + `tenants`
- Nav entry «Facturación» en platform shell

## Issues relacionadas

- `platform-admin-kpi-dashboard.md` (P1)
- `platform-admin-plans-catalog-ui.md` (P5)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
- [`docs/backend/external-services-env.md`](../backend/external-services-env.md)
