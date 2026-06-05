## Objetivo

Webapp móvil del cliente final en `/app`: alta sin password y tarjeta con QR en el subdominio del negocio.

Parte de **Phase B — slices B3 + B4** en [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md).

## Contexto

- Depende de **#18** (sesión customer + APIs loyalty).
- URL: `https://{slug}.{APP_DOMAIN}/app` (dev: `http://cafe-demo.localhost:3000/app`).
- Sin instalar app; Capacitor reutilizará las mismas rutas más adelante.

## Alcance

| In | Fuera |
|----|-------|
| Route group `(loyalty)/app/` | Capacitor build |
| `/app/welcome` — formulario nombre (email/tel opcional) | PWA install prompt |
| `/app/card` — nombre, puntos, QR renderizado desde `qrValue` | Escaneo por cámara (staff) |
| Middleware: `/app/*` exige tenant host; `/app/card` exige `kind: customer` | Cambios en `/login` staff |
| Redirigir cookies staff/platform fuera de `/app` customer | |

## Criterios de aceptación

- [ ] Visitar `/app` en subdominio válido muestra welcome o redirige a card si ya hay sesión customer.
- [ ] Tras registro, usuario llega a `/app/card` con QR visible (lib SVG o `qrcode`).
- [ ] UI mobile-first (una columna, legible en móvil).
- [ ] Apex `localhost` sin tenant → mensaje claro o redirect (no pantalla rota).
- [ ] Tenant `suspended` → no acceso (alineado con API #18).
- [ ] Branding del tenant aplicado en shell mínimo `/app` (colores host si existen).

## Capas / archivos principales

- `src/app/(loyalty)/app/welcome/page.tsx`
- `src/app/(loyalty)/app/card/page.tsx`
- `src/app/(loyalty)/app/layout.tsx` — shell ligero, sin `TenantAdminShell`
- `src/middleware.ts` — guards `/app`
- Componentes: `CustomerWelcomeForm`, `LoyaltyCard` (QR + balance)

## Verificación manual

1. `http://cafe-demo.localhost:3000/app` → welcome → card con QR.
2. Recargar → sesión persiste en mismo host.

## Issue relacionada

- **#20** — verify E2E + documentación

## Referencias

- [`customer-qr-session-web-first.md`](customer-qr-session-web-first.md)
- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Phase B
