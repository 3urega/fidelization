## Objetivo

Cerrar **Phase B** con verify E2E, documentación y criterios de regresión para el flujo customer QR.

Slice **B5** en [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md).

## Contexto

- Depende de **#18** (API) y **#19** (UI `/app`).
- Tras esta issue el owner puede compartir `{slug}.domain/app` con clientes reales (MVP loyalty entry).

## Alcance

| In | Fuera |
|----|-------|
| `npm run verify:customer-qr-session` | Employee scan issue (follow-up) |
| Actualizar `AGENTS.md`, `saas-architecture.md`, roadmap | Stripe / planes |
| Seed o datos demo documentados (`cafe-demo`) | |

## Criterios de aceptación

- [ ] Script verify: tenant host → register customer → cookie customer → `GET /api/loyalty/me` → `GET /app/card` 200.
- [ ] Assert Prisma: fila `customers` con `qrValue` único y `tenant_id` correcto.
- [ ] Tenant suspended (opcional en script o caso separado) bloquea registro.
- [ ] `saas-architecture.md`: fila «End customer» / customer flows → **Yes** (parcial MVP).
- [ ] `post-onboarding-mvp-roadmap.md`: Phase B marcada implemented con números de issue.
- [ ] Cleanup de datos de prueba al final del script.

## Capas / archivos principales

- `scripts/verify-customer-qr-session.ts`
- `package.json` — script npm
- `docs/domain/saas-architecture.md` — implementation status
- `AGENTS.md` — comando verify + ruta `/app`
- `docs/domain/post-onboarding-mvp-roadmap.md` — estado

## Verificación

```bash
npm run dev   # :3000, APP_DOMAIN=localhost
npm run verify:customer-qr-session
```

## Follow-up sugerido (no esta issue)

- Employee QR scan → puntos (`business-rules.md`)
- Checklist en `/home`: «Comparte tu enlace de fidelización» (`formatTenantHost` + `/app`)

## Referencias

- [`customer-qr-session-web-first.md`](customer-qr-session-web-first.md)
- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md)
