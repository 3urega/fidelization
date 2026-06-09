## Objetivo

Vincular **usuario app → perfil cliente por tenant**: join por slug/QR, crear `customers` con `user_id`, y poblar «Mis locales» con establecimientos donde hay **interacción**.

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Relación cliente, join, definición de interacción.
- Depende de: **platform-app-unified-auth**, **platform-app-unified-dashboard**.
- Reutiliza dominio loyalty: `RegisterCustomer` extendido o `JoinTenantAsCustomer`.

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/user/establishments/join` `{ slug }` — crea `customers` + `user_id` | Detalle UI completo (issue siguiente) |
| `JoinTenantAsCustomer` — idempotente si ya existe link | Buscador de locales |
| QR join payload / deep link stub `join/{slug}` (web apex) | Capacitor camera (issue oauth-capacitor) |
| «Mis locales» lista solo perfiles con interacción (`visits_count > 0`, sellos, puntos, canje o join explícito con flag) | Merge clientes huérfanos MVP |
| Actualizar `GET /api/user/me/relationships` con resumen puntos/sellos | Staff scan auto-create (issue global-qr) |

## Criterios de aceptación

- [ ] Usuario autenticado join por slug crea un `customers` row con su `user_id`.
- [ ] Segundo join mismo slug es idempotente (mismo customer).
- [ ] Tras join, local aparece en «Mis locales» (aunque puntos=0 si join explícito cuenta como interacción — documentar decisión en código).
- [ ] Join en tenant suspended → error dominio.
- [ ] `UNIQUE(user_id, tenant_id)` enforced.
- [ ] `npm run verify:platform-app-customer-join-use-case` pasa.
- [ ] Legacy `{slug}.domain/app` register sin `user_id` sin regresión.

## Capas / archivos principales

- `src/contexts/loyalty/customers/application/join/JoinTenantAsCustomer.ts`
- `src/app/api/user/establishments/join/route.ts`
- `src/app/(mobile)/home/join/page.tsx` o handler QR
- Actualizar `ListUserRelationships`
- `scripts/verify-platform-app-customer-join-use-case.ts`

## Issues relacionadas

- Depende de: `platform-app-unified-dashboard.md`
- Siguiente: `platform-app-establishment-detail.md`, `platform-app-global-qr-scan.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`RegisterCustomer`](../../src/contexts/loyalty/customers/application/register/RegisterCustomer.ts)
