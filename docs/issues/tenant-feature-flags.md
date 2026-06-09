## Objetivo

**Enforcement** de límites por plan tenant: leer `subscription_plans.features` / `limits` y bloquear funcionalidades fuera del plan (alineado con [`business-rules.md`](../business-rules.md) y [`business-model.md`](../domain/business-model.md)).

Slice **E5** — cierra Deferred «Feature flags» del roadmap.

## Contexto

- Plan asignado y (opcionalmente) pagado vía #28–#30.
- Hoy todas las features loyalty están disponibles sin gating (#21–#27).
- Patrón guards existente: `*Forbidden` por rol owner (`StampCampaignForbidden`, `RewardForbidden`).

## Alcance

| In | Fuera |
|----|-------|
| `TenantFeatureGuard` / `PlanFeatureNotAvailable` — evaluar plan del tenant | Add-ons modulares (CRM, white-label) |
| MVP gates: p. ej. Basic = sellos+puntos; Pro = +promos; Premium = +referidos (definir matriz mínima en issue) | Usage metering (escaneos/mes) |
| 403 coherente en APIs owner/customer afectadas | UI upsell modal elaborada |
| `verify:tenant-feature-flags-use-case` | Cambiar catálogo de planes (#28) |

## Criterios de aceptación

- [ ] Tenant Basic no puede invocar endpoint Pro-only (403 `PlanFeatureNotAvailable`).
- [ ] Tenant Premium pasa regresión en features incluidas.
- [ ] `GET /api/me` opcionalmente expone `planFeatures[]` para UI.
- [ ] Documentar matriz plan→feature en `business-model.md` (Implementation status).
- [ ] `verify:tenant-feature-flags-use-case` pasa.
- [ ] Regresión: `verify:stamp-campaigns`, `verify:rewards` OK en tenant demo (plan basic).

## Capas / archivos principales

- `src/contexts/billing/subscriptions/domain/PlanFeatures.ts`
- `src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature.ts`
- Integrar en casos de uso loyalty/promos según matriz
- `src/lib/auth/http.ts` — handler 403
- `scripts/verify-tenant-feature-flags-use-case.ts`

## Issues relacionadas

- **subscription-plans-catalog-api** — JSON `features` en planes
- **stripe-webhooks-lifecycle** — tenant suspendido = deny all

## Referencias

- [`business-rules.md`](../business-rules.md) — planes controlan features
- [`saas-architecture.md`](../domain/saas-architecture.md) — feature flags over hardcoded logic
