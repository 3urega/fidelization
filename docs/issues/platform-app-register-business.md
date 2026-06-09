## Objetivo

Flujo **Registrar negocio** en la app: paso 1 autenticación (registro o login si no hay sesión) y paso 2 creación del tenant + membership owner, reutilizando la lógica de onboarding web (#13).

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Flujo B.
- Web equivalente: [`business-onboarding.md`](../domain/business-onboarding.md) Steps 1–2 (#11–#13).
- Depende de: **platform-app-unified-auth**, **platform-app-public-home**.
- Sesión `kind: user` sustituye cookie `kind: onboarding` en este flujo app.

## Alcance

| In | Fuera |
|----|-------|
| `/register/business` — paso auth si no logueado; si logueado → paso tenant | Plan selection / Stripe (reutilizar rutas web existentes post-tenant) |
| Paso 2: formulario negocio (nombre, slug preview) | Multi-tenant owner UI «Añadir negocio» desde dashboard (issue dashboard, CTA stub OK) |
| `POST` crear tenant con sesión `kind: user` (adaptar `CompleteBusinessOnboarding` o caso de uso nuevo) | Google OAuth |
| Tras crear: redirect dashboard con sección «Mis negocios» poblada | Empleados / branding wizard en app |
| Owner puede ser usuario que ya era solo cliente (misma cuenta) | Eliminar `/register/business` web |

## Criterios de aceptación

- [ ] Usuario no autenticado en «Registrar negocio» → register/login → continúa a paso tenant.
- [ ] Usuario autenticado salta paso auth.
- [ ] Crear negocio genera `tenants` + `tenant_memberships` role `owner`.
- [ ] Slug único; preview host como #15 (`formatTenantHost`).
- [ ] Tras éxito, `/home` muestra el negocio en «Mis negocios».
- [ ] `npm run verify:business-onboarding` sigue pasando (web); nuevo `verify:platform-app-register-business` (E2E dev + DATABASE_URL) pasa.
- [ ] No se crea fila `customers` al registrar negocio.

## Capas / archivos principales

- `src/contexts/tenants/` — adaptar onboarding para sesión `kind: user`
- `src/app/(mobile)/register/business/` — wizard 2 pasos
- `src/app/api/tenants/route.ts` o extender onboarding API
- `scripts/verify-platform-app-register-business.ts`

## Issues relacionadas

- Depende de: `platform-app-unified-auth.md`, `platform-app-public-home.md`
- Relacionada: `platform-app-unified-dashboard.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [Business onboarding](../domain/business-onboarding.md)
- `verify:business-onboarding`, `verify:business-register`
