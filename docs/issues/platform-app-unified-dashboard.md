## Objetivo

**Dashboard unificado** post-login (`/home`): secciones «Mis negocios» y «Mis locales» según relaciones del `userId`, con empty states y CTAs.

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Dashboard post-login.
- Depende de: **platform-app-unified-auth**, **platform-app-public-home**.
- Owner data: `tenant_memberships`. Cliente data: `customers` con `user_id` (lista con interacción en issue join).

## Alcance

| In | Fuera |
|----|-------|
| `GET /api/user/me/relationships` — `{ businesses[], establishments[] }` | Detalle de local (issue establishment-detail) |
| UI `/home` — sección Mis negocios (logo, nombre, plan, link admin) | Panel admin completo en app (link a web `{slug}.domain/home` OK en MVP) |
| UI — sección Mis locales (vacía hasta issue join; empty state + «Descubrir») | Mapa / buscador de locales |
| Usuario owner+cliente ve **ambas** secciones | Historial transacciones |
| Empty state: sin relaciones → CTAs escanear / registrar negocio | Employee role en app (solo owner en Mis negocios MVP) |
| CTA «Añadir negocio» → `/register/business` paso tenant | Promos agregadas en dashboard |

## Criterios de aceptación

- [ ] Owner con 1+ tenants ve lista en «Mis negocios».
- [ ] Tap negocio → `/home/business/[slug]` (shell mínimo o redirect web tenant admin).
- [ ] Cliente sin locales ve empty state con CTA descubrir.
- [ ] Usuario recién registrado (sin relaciones) ve empty state dual.
- [ ] API no filtra datos cross-tenant incorrectamente; solo memberships/customers del `userId` sesión.
- [ ] `npm run verify:platform-app-dashboard-use-case` pasa (domain stub).
- [ ] Tras **register-business**, el negocio aparece sin recargar manual (refresh o redirect con estado).

## Capas / archivos principales

- `src/contexts/identity/` o `tenants/` — `ListUserRelationships`
- `src/app/api/user/me/relationships/route.ts`
- `src/app/(mobile)/home/page.tsx`
- `src/app/(mobile)/home/business/[slug]/page.tsx` — placeholder admin entry
- `scripts/verify-platform-app-dashboard-use-case.ts`

## Issues relacionadas

- Depende de: `platform-app-unified-auth.md`, `platform-app-public-home.md`
- Siguiente: `platform-app-customer-join.md`, `platform-app-establishment-detail.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`HomeDashboard.tsx`](../../src/app/(app)/home/HomeDashboard.tsx) — referencia owner web
