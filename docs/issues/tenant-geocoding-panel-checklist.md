## Objetivo

Corregir el **checklist del panel owner** para que «ubicación del negocio» refleje coords reales, no solo texto en `address`, y enlazar al flujo de verificación (R2–R3).

## Contexto

- Hoy `hasTenantAddress()` solo comprueba `address.trim()` → el owner ve ✓ aunque el geocode haya fallado y no aparezca en «Cerca de mí».
- Panel: [`OwnerConfigurationPanel.tsx`](../../src/app/(app)/panel/OwnerConfigurationPanel.tsx).

## Alcance

| In | Fuera |
|----|-------|
| `hasTenantGeolocation(tenant)` → coords not null | Nuevo ítem de checklist separado (opcional: un solo ítem «Dirección y ubicación») |
| Checklist: completado solo si address **y** latitude/longitude | Superadmin dashboard |
| Copy: pendiente → «Confirma tu ubicación en el mapa» / enlace `/settings/profile` | |
| Regresión checklist branding, plan, empleados | |

## Criterios de aceptación

- [ ] Tenant con address sin coords → ítem **pendiente** (no ✓).
- [ ] Tenant con address + coords → ítem completado.
- [ ] Tenant sin address → pendiente (comportamiento actual de dirección).
- [ ] `verify:tenant-profile` + smoke en verify de panel si existe.

## Capas / archivos principales

- `src/lib/tenant/hasTenantGeolocation.ts` (nuevo)
- `src/lib/tenant/hasTenantAddress.ts` (mantener para otros usos o consolidar)
- `src/app/(app)/panel/OwnerConfigurationPanel.tsx`
- Tests/verify según patrón repo

## Issues relacionadas

- `tenant-geocoding-status-api.md` (R1)
- `tenant-geocoding-profile-feedback-ui.md` (R2)

## Referencias

- [`docs/localization.md`](../localization.md)
- [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md)
