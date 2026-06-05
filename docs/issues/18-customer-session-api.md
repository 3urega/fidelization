## Objetivo

Tercer tipo de sesión JWT (`kind: customer`) y APIs para registrar / autenticar clientes finales en el tenant resuelto por subdominio.

Parte de **Phase B — slices B1 + B2** en [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md).

## Contexto

- Clientes viven en tabla `customers` (no `users`).
- Repositorio: [`PrismaCustomerRepository`](../../src/contexts/loyalty/customers/infrastructure/PrismaCustomerRepository.ts).
- Flujo staff (`kind: tenant`) y plataforma (`kind: platform`) no deben mezclarse con cliente.
- Entrada futura UI: `{slug}.domain/app` (issue #19).

## Alcance

| In | Fuera |
|----|-------|
| `CustomerSessionClaims`: `kind: customer`, `customerId`, `tenantId` | UI `/app` |
| `createSessionToken` / `parseSessionPayload` / middleware edge parse | Employee scan → `LoyaltyTransaction` |
| `RegisterCustomer`: name + email/phone opcional → `qrValue` único (UUID o similar) | Sellos, recompensas, push |
| `POST /api/loyalty/customers/register` | Login con password |
| `POST /api/loyalty/auth/qr` — cliente existente por `qrValue` en tenant resuelto | |
| `GET /api/loyalty/me` + `requireCustomerSession` | |
| Tenant `suspended` → rechazar registro/sesión | |

## Criterios de aceptación

- [ ] Registro en host con tenant resuelto crea fila `customers` con `qrValue` globalmente único.
- [ ] Respuesta 201 + cookie `session` con `kind: customer`.
- [ ] `GET /api/loyalty/me` devuelve perfil (name, pointsBalance, qrValue) solo con sesión customer.
- [ ] Sesión staff/platform en APIs loyalty customer → **401/403**.
- [ ] Sin subdominio / tenant no resuelto → **400/404** según convención del repo.
- [ ] DI: casos de uso registrados en `diod.config.ts`.

## Capas / archivos principales

- `src/lib/auth/sessionClaims.ts`, `session.ts`
- `src/lib/auth/requireCustomerSession.ts`
- `src/contexts/loyalty/customers/application/register/RegisterCustomer.ts`
- `src/contexts/loyalty/customers/application/authenticate/AuthenticateCustomerByQr.ts` (o nombre equivalente)
- `src/app/api/loyalty/customers/register/route.ts`
- `src/app/api/loyalty/auth/qr/route.ts`
- `src/app/api/loyalty/me/route.ts`

## Verificación manual

1. `POST` register en `http://cafe-demo.localhost:3000/api/loyalty/customers/register`.
2. Cookie customer → `GET /api/loyalty/me` OK.

## Issue relacionada

- **#19** — rutas `/app` + middleware
- **#20** — `verify:customer-qr-session` + docs

## Referencias

- [`customer-qr-session-web-first.md`](customer-qr-session-web-first.md)
- [`session-cookies-localhost-dev.md`](../backend/session-cookies-localhost-dev.md)
- [`teenant-resolution.md`](../teenant-resolution.md)
