## Objetivo

Implementar **«Entrar como comercio»**: el superadmin abre el panel owner del tenant sin compartir contraseña, con trazabilidad y límites de seguridad.

## Contexto

- Marcado como **crítico** en [`docs/superadmin.md`](../superadmin.md) § Impersonación.
- Patrón existente inverso: `EnterPlatformUserFromTenantSession` (owner → app personal).
- Auth: JWT `kind: tenant` vs `kind: platform`; middleware en [`src/middleware.ts`](../../src/middleware.ts).

## Alcance

| In | Fuera |
|----|-------|
| `POST /api/platform/tenants/[tenantId]/impersonate` emite sesión `kind: tenant` (rol owner) | Impersonar cliente final (`kind: customer`) |
| Botón en detalle tenant y/o tabla tenants | Impersonar usuario app sin tenant |
| Banner persistente «Estás impersonando {slug}» + salir a sesión platform | Editar password del owner mientras impersonas |
| Audit log mínimo: `platform_impersonation_events` (superadminId, tenantId, timestamp) | SSO externo |
| Redirect a `{slug}.{APP_DOMAIN}/panel` (dev: slug.localhost) | |

## Criterios de aceptación

- [ ] Solo `platform_role=superadmin` puede impersonar.
- [ ] Sesión platform anterior invalidada o stack documentado (cookie única → platform se pierde; «Volver a plataforma» re-login o token de retorno).
- [ ] Owner real no recibe email ni cambio de credenciales.
- [ ] Evento audit persistido en cada impersonación.
- [ ] `verify:platform-admin-impersonate-use-case` + E2E con tenant demo.

## Capas / archivos principales

- Use case: `ImpersonateTenantOwnerFromPlatformSession`
- Migración Prisma: tabla audit (si no existe)
- API + UI banner component compartido en tenant shell
- Middleware: permitir salida explícita `/api/platform/impersonation/end`

## Issues relacionadas

- `platform-admin-tenant-detail.md` (P2)
- `platform-admin-owners-list.md` (P4)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
- [`docs/backend/session-cookies-localhost-dev.md`](../backend/session-cookies-localhost-dev.md)
