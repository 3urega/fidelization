## Objetivo

Completar ciclo de vida de suscripción tenant vía **webhooks Stripe**: renovaciones, `past_due` → suspender tenant, reactivación al pagar.

Slice **E4** — depende de **stripe-checkout-subscription**.

## Contexto

- Checkout crea subscription inicial (#29 draft).
- `TenantStatus`: `active`, `suspended`, `trial` ([`schema.prisma`](../../prisma/schema.prisma)).
- Tenant suspendido ya bloquea login staff y registro cliente (patrones existentes en scan/customer APIs).

## Alcance

| In | Fuera |
|----|-------|
| Handlers: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` | Dunning emails |
| `past_due` / unpaid → `tenant.status = suspended` | Reembolsos manuales UI |
| Pago recuperado → `active` + `subscriptions.status` coherente | Stripe Customer Portal |
| Idempotencia webhook (event id) | Multi-tenant Stripe Connect |
| `verify:stripe-webhooks-use-case` + E2E ligero con eventos fixture | |

## Criterios de aceptación

- [ ] Webhook firmado rechaza payloads inválidos (400).
- [ ] Simular `payment_failed` suspende tenant; owner login → 403 `TenantAccessSuspended`.
- [ ] Simular `invoice.paid` reactiva tenant suspendido por pago.
- [ ] Customer `/app` register bloqueado en tenant suspendido (regresión #20).
- [ ] `verify:stripe-webhooks-use-case` pasa.
- [ ] `AGENTS.md` documenta webhooks dev (Stripe CLI).

## Capas / archivos principales

- `src/contexts/billing/subscriptions/application/sync/` — `SyncTenantSubscriptionFromStripe`
- `src/contexts/tenants/tenants/application/update/` — reutilizar suspend/activate
- `src/app/api/webhooks/stripe/route.ts` — ampliar
- Tabla opcional `stripe_webhook_events` o idempotency store
- `scripts/verify-stripe-webhooks-use-case.ts`

## Issues relacionadas

- **stripe-checkout-subscription** — prerrequisito
- **tenant-feature-flags** — límites por plan una vez billing estable

## Referencias

- [`business-onboarding.md`](../domain/business-onboarding.md) — trial expiration → suspend
- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Step 4
