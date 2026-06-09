## Objetivo

Introducir **registro y login unificado** para personas (owner y cliente comparten la misma cuenta `users`), sesión JWT `kind: user` en apex, y migración de datos (`users.qr_value`, `customers.user_id`) como base de la app móvil.

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — registro unificado, § Modelo de datos, § Auth.
- Hoy: owner usa `POST /api/auth/register/business`; cliente web no tiene cuenta global (`kind: customer` por tenant).
- Depende de: identity context existente (`RegisterBusinessOwnerUser`, login tenant).
- Bloquea: resto de issues Phase G (home UI, dashboard, join, QR global).

## Alcance

| In | Fuera |
|----|-------|
| `RegisterPlatformUser` / `LoginPlatformUser` (email + password) | Google OAuth (issue `platform-app-oauth-capacitor`) |
| JWT `kind: user` + `userId` (+ `qrValue` opcional en claims) | UI de home pública (issue siguiente) |
| `requireUserSession` para `/api/user/*` | Eliminar flujos web legacy |
| Migración Prisma: `users.qr_value` UNIQUE nullable, `users.oauth_provider`/`oauth_subject` nullable, `customers.user_id` FK nullable + `UNIQUE(user_id, tenant_id)` | Claim de clientes huérfanos MVP |
| Generar `qr_value` al registrar usuario app | Capacitor / deep links |
| `POST /api/auth/register` (unificado persona) + cookie apex | Cambiar superadmin auth |
| Script `verify:platform-app-auth-use-case` (domain stub + DI) | E2E con dev server (issue final) |

## Criterios de aceptación

- [ ] Usuario se registra con `name`, `email`, `password` → fila `users` sin membership ni customer.
- [ ] Login devuelve sesión `kind: user` con cookie válida en apex.
- [ ] Email duplicado → error de dominio coherente con owner register.
- [ ] Nuevo usuario recibe `qr_value` único generado server-side.
- [ ] Migración aplicada; clientes existentes siguen con `user_id` null.
- [ ] `npm run verify:platform-app-auth-use-case` pasa.
- [ ] Flujos web actuales (`/register/business`, tenant login) **sin regresión**.

## Capas / archivos principales

- `prisma/schema.prisma` + migración
- `src/contexts/identity/` — register/login platform user
- `src/lib/auth/sessionClaims.ts`, `session.ts`, `requireUserSession.ts`
- `src/app/api/auth/register/route.ts` (o ruta nueva `/api/auth/register/user`)
- `scripts/verify-platform-app-auth-use-case.ts`
- `package.json` — script verify

## Issues relacionadas

- Siguiente: `platform-app-public-home.md`
- Batch: `platform-app-register-business.md`, `platform-app-unified-dashboard.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`RegisterBusinessOwnerUser`](../../src/contexts/tenants/owners/application/register/RegisterBusinessOwnerUser.ts)
- [`sessionClaims.ts`](../../src/lib/auth/sessionClaims.ts)
