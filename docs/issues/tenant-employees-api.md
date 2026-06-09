## Objetivo

El owner **añade empleados** al negocio: crea usuario + `tenant_membership` con rol `employee` para que puedan iniciar sesión en `/login` y usar `/scan` (sin acceso a settings owner-only).

Slice **D3** — Step 6 *Invite employees* ([`business-onboarding.md`](../domain/business-onboarding.md)).

## Contexto

- Rol `employee` en schema y login staff ya soportados ([`TenantStaffLogin`](../../src/contexts/tenants/memberships/application/authenticate/TenantStaffLogin.ts)); **no hay flujo de alta**.
- Hoy solo existe owner al registrar negocio; el owner escanea QR él mismo.
- Permisos owner-only ya aplicados en branding (#16) y sellos (#21); reutilizar patrón `*Forbidden`.

## Alcance

| In | Fuera |
|----|-------|
| `InviteTenantEmployee` (o `RegisterTenantEmployee`): name, email, password → user + membership `employee` | Email de invitación / magic link |
| `ListTenantEmployees` — owner lista staff del tenant | Desactivar owner o borrar membership |
| `GET/POST /api/tenant/employees` owner-only | UI `/settings/team` (#27) |
| Employee login → `/home` + acceso `/scan`; 403 en `/settings/branding`, `/settings/stamps`, rewards CRUD | Rol `admin` separado |
| `verify:tenant-employees-use-case` | Reset password empleado |

## Criterios de aceptación

- [ ] Owner crea empleado con email único global; membership `employee` para su `tenantId`.
- [ ] Email ya registrado → error 409 coherente.
- [ ] Owner lista empleados (sin passwords).
- [ ] Empleado hace login en subdominio tenant → sesión `kind: tenant`, `role: employee`.
- [ ] Empleado puede `POST /api/loyalty/scan`; recibe 403 en PATCH branding / stamp-campaigns.
- [ ] `verify:tenant-employees-use-case` pasa (stub).

## Capas / archivos principales

- `src/contexts/tenants/memberships/application/invite/` — casos de uso
- `src/contexts/tenants/memberships/domain/TenantMembershipRepository.ts` — `listByTenant`, `save` si falta
- `src/app/api/tenant/employees/route.ts`
- `src/lib/auth/http.ts` — serialización empleado (sin hash)
- `diod.config.ts`
- `scripts/verify-tenant-employees-use-case.ts`

## Issues relacionadas

- **tenant-employees-ui** — UI + verify E2E + checklist `/home`
- **customer-reward-redeem** — empleado escanea puntos en flujos E2E

## Referencias

- [`data-model.md`](../database/data-model.md) — `employee`: in schema; no operational flows yet
- [`saas-architecture.md`](../domain/saas-architecture.md) — tenant staff roles
- [`teenant-resolution.md`](../teenant-resolution.md) — staff login
