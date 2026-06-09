## Objetivo

**Vista detalle de un local** (`/home/establishments/[slug]`): modo **con interacción** (tarjeta, sellos, rewards, promos del local + otras promos activas) y modo **descubrimiento** (solo promos del negocio + CTA unirse).

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Vista detalle de un local.
- Depende de: **platform-app-customer-join**, loyalty APIs existentes (#18–#25).
- Promos: requiere **Phase F** (owner CRUD promociones) para datos reales; hasta entonces lista vacía o seed demo OK.

## Alcance

| In | Fuera |
|----|-------|
| `GET /api/user/establishments/[slug]` — metadata + mode `interaction` \| `discovery` | Historial visitas detallado |
| Modo interacción: QR usuario, puntos, `stampProgress[]`, rewards, promos tenant | Canje in-app si no existe (reutilizar redeem API) |
| Modo descubrimiento: branding + promos activas tenant + CTA join | Promos si tenant Basic sin feature (mostrar vacío / upsell) |
| Sección **Otras promos activas** — promos de otros tenants donde user tiene `customers` | Promos de tenants sin relación |
| Branding tenant en detalle (`ThemeProvider` / tenant colors) | Push notifications |
| Pantalla `/home/qr` — QR pantalla completa | Apple Wallet |

## Criterios de aceptación

- [ ] Usuario con customer en slug → modo interacción con tarjeta completa.
- [ ] Usuario sin customer en slug → modo descubrimiento solo promos + CTA.
- [ ] CTA unirse llama join API y refresca a modo interacción.
- [ ] «Otras promos activas» lista promos de otros locales vinculados (máx. N items; sin leak de tenants ajenos).
- [ ] Plan Pro+ del negocio gatea promos (reutilizar `AssertTenantPlanFeature`).
- [ ] `npm run verify:platform-app-establishment-detail` E2E (dev + DATABASE_URL) pasa.
- [ ] Reutiliza componentes de [`/app/card`](../../src/app/(loyalty)/app/card/) donde aplique.

## Capas / archivos principales

- `src/contexts/loyalty/` — `GetEstablishmentDetailForUser`
- `src/app/api/user/establishments/[slug]/route.ts`
- `src/app/api/user/me/active-promotions/route.ts` — cross-establishment
- `src/app/(mobile)/home/establishments/[slug]/page.tsx`
- `src/app/(mobile)/home/qr/page.tsx`
- `scripts/verify-platform-app-establishment-detail.ts`

## Issues relacionadas

- Depende de: `platform-app-customer-join.md`
- Bloqueada parcialmente por: Phase F promociones owner (datos promos)
- Relacionada: `platform-app-global-qr-scan.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`/app/card`](../../src/app/(loyalty)/app/card/)
