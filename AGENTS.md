# Dev commands

```bash
npm prep                    # build (sin lint; usar npm run lint manualmente)
docker compose up -d        # Postgres + schema starter
npm run dev                 # local dev server (not Docker)
npm run lint:fix
npm run db:users            # list users, platform_role y memberships
npm run db:backfill-tenant-geocoding
npm run build:capacitor     # export out/ + cap sync android (parar dev server en Windows)
```

**Tests:** la suite Jest apunta a contextos legacy y puede colgar o fallar. No forma parte del flujo activo hasta reescribir tests para `identity`/`billing`.

# Verifies

Scripts en [`package.json`](package.json) (`verify:*`). Descubrir: `npm run` o grep en package.json.

Convención: `*-use-case` = dominio sin servidor; sin sufijo = E2E (dev en `:3000` + `DATABASE_URL`).

Tras cambios en un bounded context, ejecutar los verifies del mismo prefijo (p. ej. `verify:roulette-*`).

# Product

SaaS multi-tenant de fidelización para hostelería (puntos, sellos, QR, recompensas, promociones, planes Basic/Pro/Premium). **Tipos de usuario:** superadmin plataforma, owner, empleado, cliente (app móvil). **Stack:** Next.js 14 + Capacitor, mobile-first.

Detalle: [`docs/domain/saas-architecture.md`](docs/domain/saas-architecture.md), [`docs/domain/business-model.md`](docs/domain/business-model.md), [`docs/business-rules.md`](docs/business-rules.md).

# Business Rules

- **Puntos:** 1 € gastado puede generar puntos; cálculo configurable por tenant.
- **Sellos:** varias campañas activas a la vez; desactivar sin borrar datos.
- **QR:** QR único global por cliente; cada escaneo es auditable.
- **Planes:** feature flags; un tenant no accede a features fuera de su plan.

Detalle: [`docs/business-rules.md`](docs/business-rules.md).

# Dev auth & sessions

| kind | Login | Home | Notas |
|------|-------|------|-------|
| `user` | apex `/login` | `/home` | app personal |
| `tenant` | `{slug}.localhost/login` | `/panel` | cookie host-only |
| `platform` | apex `/platform/login` | `/platform` | no mezclar con tenant |
| `customer` | `{slug}.localhost/app` | `/app/card` | host tenant legacy |

**Demo:** `demo@starter.local` (botón demo) o `cafe-demo.localhost`. **Env mínimo:** `AUTH_SECRET`; `APP_DOMAIN=localhost` + `NEXT_PUBLIC_APP_DOMAIN=localhost` para subdominios en dev. **Producción:** cookie `Domain=.${APP_DOMAIN}`. Detalle cookies: [`docs/backend/session-cookies-localhost-dev.md`](docs/backend/session-cookies-localhost-dev.md).

**Rutas y features por área:**
- Owner / loyalty / staff scan: [`docs/domain/post-onboarding-mvp-roadmap.md`](docs/domain/post-onboarding-mvp-roadmap.md), [`docs/domain/staff-scan-flow.md`](docs/domain/staff-scan-flow.md)
- Platform app (#38–45): [`docs/domain/customer-platform-app.md`](docs/domain/customer-platform-app.md)
- Superadmin (#71–84): [`docs/superadmin.md`](docs/superadmin.md)
- Ruleta v2: [`docs/domain/roulette-game.md`](docs/domain/roulette-game.md)

# Architecture

- Next.js 14, Onion Architecture, DDD.
- **Active contexts**: `identity`, `tenants`, `loyalty`, `billing`, `shared` (infra, DI).
- **Tenant context (Fase 0):** JWT `tenantId` + `role` — spec: [`docs/teenant-resolution.md`](docs/teenant-resolution.md).
- **Legacy reference**: `src/contexts/legacy/` — not wired in DI.
- Frontend: `src/app/`. API: `src/app/api/`.
- **App Router groups:** `(public)/`, `(auth)/`, `(app)/` owner shell (`/home` ≠ URL `/app`), `(loyalty)/` customer `/app`, `(platform)/` superadmin.
- **Env:** [`src/lib/env.ts`](src/lib/env.ts), [`.env.example`](.env.example), [`docs/backend/external-services-env.md`](docs/backend/external-services-env.md).

# Documentation

**Do NOT read all docs upfront.** Usar esta tabla y leer solo lo relevante a la tarea:

| Tarea | Leer primero |
|-------|----------------|
| Producto, roles, visión | sección **Product** (este archivo), `docs/domain/saas-architecture.md`, `docs/business-rules.md` |
| Planes, pricing, ingresos | `docs/domain/business-model.md` (*Implementation status*) |
| Alta negocio self-service | `docs/domain/business-onboarding.md`, `/register/business`, `/register/business/tenant` |
| Post-onboarding MVP | `docs/domain/post-onboarding-mvp-roadmap.md` |
| App consumidor multi-local | `docs/domain/customer-platform-app.md`, `docs/rediseño-home.md` |
| Staff scan, sellos, ruleta | `docs/domain/staff-scan-flow.md`, `docs/domain/roulette-game.md`, `/scan`, `/settings/stamps` |
| Promociones | `/settings/promotions`, `/app/card`, `docs/business-rules.md` |
| Stripe / OAuth / geocoding | `docs/backend/external-services-env.md` |
| Superadmin | `docs/superadmin.md`, `docs/domain/saas-architecture.md` |
| Tenant / cookies / middleware | `docs/teenant-resolution.md`, `docs/backend/session-cookies-localhost-dev.md`, `src/middleware.ts` |
| API, DI, hexagonal | `docs/backend/*` |
| Datos, Prisma, migraciones | `docs/database/data-model.md`, `prisma/schema.prisma`, skill `.agents/skills/prisma/` |
| UI, theming | `docs/frontend/style-guidelines.md`, `src/app/theme/tokens.css` |

**Agent skills:** `.agents/skills/` — `prisma`, `plan-to-issues`, `publish-github-issues`, `kanban-board`.

**Flujo issues:** `docs/issues/README.md` — plan-to-issues → publish-github-issues → kanban-board (al cerrar, eliminar body/manifest en docs).
