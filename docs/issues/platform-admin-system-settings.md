## Objetivo

Pantalla de **configuración global de plataforma**: branding Fideli, integraciones (Stripe, SMTP) y variables operativas (read-only + docs).

## Contexto

- Visión: [`docs/superadmin.md`](../superadmin.md) § Sistema.
- Env centralizado: [`src/lib/env.ts`](../../src/lib/env.ts), [`external-services-env.md`](../backend/external-services-env.md).

## Alcance

| In | Fuera |
|----|-------|
| `/platform/settings` | Editar secrets en runtime |
| Mostrar estado configuración: AUTH_SECRET set, Stripe keys, Google OAuth, APP_DOMAIN | Multi-region |
| Editar metadata plataforma persistida: nombre display, logo URL (tabla `platform_settings` key-value) | DNS management |
| Aplicar logo/nombre en shell platform (no tenant) | |

## Criterios de aceptación

- [ ] Secrets nunca se devuelven completos en API (solo «configurado / falta»).
- [ ] Cambios branding platform visibles en `PlatformAdminShell`.
- [ ] Verify use case + E2E smoke.

## Capas / archivos principales

- `platform_settings` migración + `GetPlatformSettings` / `UpdatePlatformSettings`
- UI form theme-driven

## Issues relacionadas

- `platform-admin-communications-center.md` (P12)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
