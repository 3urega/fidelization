## Objetivo

Al guardar la **dirección del negocio** (`PATCH /api/tenant/profile`), geocodificar **una sola vez** y persistir coordenadas en `tenants`. Si el geocoding falla, la dirección se guarda igual (coordenadas opcionales).

## Contexto

- Depende de **Q1** (`geocoding-gateway-port.md`).
- Hoy: campo libre `tenants.address` + formulario en `/settings/profile` (`TenantProfileForm`).
- Checklist panel: `hasTenantAddress()` en `/panel`.
- Verify existente: `verify:tenant-profile`, `verify:tenant-profile-use-case`.

## Alcance

| In | Fuera |
|----|-------|
| Migración Prisma en `tenants`: `latitude`, `longitude`, `geocoding_provider`, `geocoded_at` (nullable) | Campos estructurados (`city`, `postal_code`…) — fase posterior |
| Extender agregado `Tenant` + `UpdateTenantProfile` | Geocodificar en onboarding step 2 automáticamente (opcional follow-up) |
| Geocodificar solo si `address` cambió (trim) y no está vacío | Borrar coordenadas si address se vacía (sí: poner lat/lng/provider/at a null) |
| Integrar `GeocodeAddressString` desde Q1 | Filtro discover (Q3) |
| Script opcional `npm run db:backfill-tenant-geocoding` para tenants con address sin coords | Mapa en detalle del local |
| Extender `GET /api/me` tenant payload con coords (solo owner/staff; no exponer en discover público sin necesidad) | |

### Flujo

```text
Owner PATCH { address }
  → parseTenantProfileUpdate
  → si address cambió y no vacío → GeocodeAddressString
  → guardar address + latitude/longitude/geocoding_provider/geocoded_at
  → si geocode falla: guardar address, coords null, log/warn (no 500 al owner salvo error DB)
```

## Criterios de aceptación

- [ ] Migración aplicada; Prisma client regenerado.
- [ ] PATCH con dirección válida persiste coords cuando `GEOCODING_PROVIDER` + token configurados.
- [ ] PATCH sin cambio de address no re-geocodifica.
- [ ] PATCH que vacía address limpia coords.
- [ ] Regresión: `verify:tenant-profile*` sigue pasando.
- [ ] `npm run verify:tenant-geocoding-use-case` (domain stub, sin HTTP).
- [ ] `npm run verify:tenant-geocoding` (E2E dev + DATABASE_URL + token Mapbox en `.env`).

## Verify

```bash
npm run verify:tenant-geocoding-use-case
npm run verify:tenant-geocoding
```

## Capas / archivos principales

- `prisma/schema.prisma` + migración
- `src/contexts/tenants/tenants/domain/Tenant.ts`, `TenantProfileUpdate.ts`
- `src/contexts/tenants/tenants/application/update/UpdateTenantProfile.ts`
- `src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository.ts`
- `src/app/api/tenant/profile/route.ts`
- `scripts/verify-tenant-geocoding*.ts`
- `AGENTS.md`

## Issues relacionadas

- `geocoding-gateway-port.md` (Q1) — prerequisito
- `discover-establishments-near-filter.md` (Q3)

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — tenant profile
