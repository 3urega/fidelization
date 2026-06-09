## Objetivo

Mostrar **promociones activas** al cliente en `/app/card` y en `GET /api/loyalty/me`, filtradas por tenant, fechas y `isActive`, solo cuando el negocio tiene plan Pro+.

## Contexto

- Depende de: **promotions-owner-crud-api** (datos reales).
- Patrón: recompensas en card (#25) — `rewards[]` en GET me + sección UI.
- Sesión: `kind: customer` en subdominio tenant (legacy web MVP).
- Alimenta Phase G (`platform-app-establishment-detail`) con misma lógica de listado activo.

## Alcance

| In | Fuera |
|----|-------|
| `ListActivePromotionsForCustomer` — tenant + filtros fecha/`isActive` | Canjear promo / cupón |
| Extender `GET /api/loyalty/me` con `promotions[]` | Promos cross-tenant en este endpoint (Phase G agregador aparte) |
| Sección «Promociones» en [`/app/card`](../../src/app/(loyalty)/app/card/page.tsx) | Push al publicar promo |
| Tenant Basic o sin feature → `promotions: []` sin error | Owner preview en `/app` |
| `verify:customer-promotions-use-case` + `verify:customer-promotions` E2E | App móvil consumer |

## Criterios de aceptación

- [ ] Owner Pro+ crea promo activa → cliente registrado la ve en GET me y `/app/card`.
- [ ] Promo inactiva o fuera de `startDate`/`endDate` no aparece.
- [ ] Tenant Basic → cliente ve lista vacía (sin 403 en GET me).
- [ ] Promo desactivada desaparece del card tras refresh.
- [ ] `npm run verify:customer-promotions-use-case` y `npm run verify:customer-promotions` pasan.
- [ ] Regresión: `verify:customer-reward-redeem` y `verify:customer-qr-session` OK.

## Capas / archivos principales

- `src/contexts/loyalty/promotions/application/list/ListActivePromotionsForCustomer.ts`
- `src/app/api/loyalty/me/route.ts`
- `src/app/(loyalty)/app/card/page.tsx` — sección Promociones
- `src/lib/auth/http.ts` — `promotionToJson` si aplica
- `scripts/verify-customer-promotions-use-case.ts`, `verify-customer-promotions.ts`

## Issues relacionadas

- Depende de: `promotions-owner-crud-api.md`
- Desbloquea: `platform-app-establishment-detail.md` (Phase G)

## Referencias

- [`customer-platform-app.md`](../domain/customer-platform-app.md)
- [`verify-customer-reward-redeem.ts`](../../scripts/verify-customer-reward-redeem.ts)
