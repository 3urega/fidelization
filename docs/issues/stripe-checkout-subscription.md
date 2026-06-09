## Objetivo

**Step 4**: owner completa pago con **Stripe Checkout**; se crea fila en `subscriptions` y el tenant queda con suscripción activa (o `trial` según config).

Slice **E3** — [`business-onboarding.md`](../domain/business-onboarding.md) Step 4.

## Contexto

- Plan elegido vía API/UI (#28–#29 draft).
- Tabla `subscriptions` con `stripeSubscriptionId`, `status`, `planId` ([`schema.prisma`](../../prisma/schema.prisma)).
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs (documentar en `.env.example`).
- Google Play billing en `billing` context es **user-level** legacy; no reutilizar para tenant SaaS.

## Alcance

| In | Fuera |
|----|-------|
| `CreateStripeCheckoutSession` — owner + `planId` → URL Checkout | Portal de facturación Stripe |
| `POST /api/billing/checkout` (owner-only) | Upgrade/downgrade con prorrateo |
| Webhook `checkout.session.completed` → crear/activar `subscriptions` | Múltiples suscripciones por tenant |
| Success/cancel URLs → `/home` o `/onboarding/plan` | Facturas PDF en app |
| `verify:stripe-checkout-use-case` (mock Stripe) | Producción live keys en CI |

## Criterios de aceptación

- [ ] Owner inicia checkout; redirect a Stripe test mode.
- [ ] Webhook de test crea `subscriptions` row + vincula `tenant.subscriptionPlanId`.
- [ ] Tras pago simulado, owner accede a `/home` con plan activo.
- [ ] Checkout rechazado/cancelado no deja subscription activa huérfana.
- [ ] `verify:stripe-checkout-use-case` pasa.
- [ ] Documentación env + roadmap actualizados.

## Capas / archivos principales

- `src/contexts/billing/subscriptions/application/checkout/`
- `src/contexts/billing/stripe/` — adapter Stripe (infra)
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts` (handler mínimo checkout.completed; ampliar en #30)
- `src/lib/env.ts` — Stripe vars
- `scripts/verify-stripe-checkout-use-case.ts`

## Issues relacionadas

- **subscription-plans-catalog-api** — catálogo planId
- **stripe-webhooks-lifecycle** — `past_due`, renewals, suspend tenant
- **onboarding-plan-selection-ui** — flujo previo al pago

## Referencias

- [`saas-architecture.md`](../domain/saas-architecture.md) — billing per tenant
- [`business-model.md`](../domain/business-model.md) — pricing target
