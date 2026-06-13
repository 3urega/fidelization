## Objetivo

Exponer la Zona Clientes vía API tenant owner: insights, listado por segmento y detalle de cliente para la UI.

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Depende de **L1** (dominio). Patrón thin route + `requireTenantSession` + JSON helpers en `lib/auth/http.ts`.

## Alcance

| In | Fuera |
|----|-------|
| `GET /api/loyalty/customers/insights` | PATCH / acciones staff |
| `GET /api/loyalty/customers?segment=featured\|at_risk\|near_reward\|all` | Export CSV |
| `GET /api/loyalty/customers/[id]` | Empleado (403 en v1) |
| Serializadores JSON estables | Paginación cursor |

### Contratos JSON (orientativo)

**Insights:**

```json
{
  "vipCount": 24,
  "atRiskCount": 11,
  "nearRewardCount": 18,
  "newThisMonthCount": 7,
  "generatedAt": "...",
  "timezone": "Europe/Madrid"
}
```

**Listado:** `customers[]` con `id`, `name`, `lastVisitAt`, `visitsThisMonth`, `visitsCount`, `totalStamps`, `rewardsRedeemedCount`, `status`, `nearReward` (opcional).

**Detalle:** resumen + `stampProgress[]`, `recentActivity[]`, `rewardsRedeemed[]`.

## Criterios de aceptación

- [ ] Owner 200; sin sesión 401; empleado 403
- [ ] Segmentos coherentes con reglas L1
- [ ] `npm run verify:customer-zone` (E2E dev + DATABASE_URL)

## Capas / archivos principales

- `src/app/api/loyalty/customers/insights/route.ts`
- `src/app/api/loyalty/customers/route.ts`
- `src/app/api/loyalty/customers/[id]/route.ts`
- `src/lib/auth/http.ts` — `customerZone*ToJson`
- `scripts/verify-customer-zone.ts`

## Issues relacionadas

- L1: dominio (`customer-zone-domain.md`)
- L3–L6: UI

## Referencias

- [zona-clientes.md](../zona-clientes.md)
- [thin-api-routes.md](../backend/thin-api-routes.md)
