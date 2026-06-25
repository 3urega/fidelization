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

Next.js 14 · Onion Architecture · DDD · Capacitor (mobile-first).

```
Código
├── src/contexts/
│   ├── identity/          usuarios, auth (JWT kinds: user, tenant, platform, customer)
│   ├── tenants/           tenant, memberships, owner onboarding
│   ├── loyalty/           customers, sellos, puntos, rewards, promos, ruleta, scan
│   ├── billing/           subscriptions tenant, plan gates, Stripe
│   ├── shared/            infra, DI → diod.config.ts
│   └── legacy/            MOOC, Femturisme, RAG — no wired in DI
├── src/app/
│   ├── api/               thin routes → container.get(UseCase)
│   ├── (public)/          landing /
│   ├── (auth)/            /login, /register
│   ├── (app)/             owner shell → /home, /panel, /scan, /settings (≠ URL /app)
│   ├── (loyalty)/         customer → /app, /app/card
│   └── (platform)/        superadmin → /platform/*
├── src/lib/env.ts         env server-side centralizado
└── prisma/schema.prisma   esquema Postgres

Tenant (Fase 0): JWT tenantId + role. Spec → docs/teenant-resolution.md
Env / secrets → .env.example, docs/backend/external-services-env.md
```

**Convenciones backend** (leer en este orden al tocar API o casos de uso):

```
docs/backend/
├── thin-api-routes.md              routes delgadas, sin lógica de negocio
├── hexagonal-architecture.md       capas dominio / aplicación / infra / puertos
├── dependency-injection-diod.md    @Service(), diod.config.ts
├── api-routes-reflect-metadata.md  reflect-metadata en route handlers
├── session-cookies-localhost-dev.md cookies dev, apex vs subdominio
└── external-services-env.md        Google OAuth, Stripe, Mapbox, .env
```

# Documentation

**Do NOT read all docs upfront.** Árbol de referencia — abrir solo la rama de la tarea:

```
docs/
├── domain/                         producto, flujos, estado vs código
│   ├── saas-architecture.md        roles, isolation, feature flags, MVP técnico
│   ├── business-model.md           planes Basic/Pro/Premium, ingresos
│   ├── business-onboarding.md      registro owner → tenant → plan → checkout
│   ├── business-rules.md           (también en raíz docs/) puntos, sellos, QR
│   ├── post-onboarding-mvp-roadmap.md  branding, /app, billing, fases A–X
│   ├── customer-platform-app.md    app personal #38–45, QR global, /home
│   ├── staff-scan-flow.md          /scan targets, ruleta v2 + legacy
│   ├── roulette-game.md            enroll → authorize → spin, config v2
│   ├── visual-assets-system.md     sellos SVG, LoyaltyProgress
│   └── …                           otros specs por fase (geocoding, map, etc.)
├── teenant-resolution.md           subdominio target; JWT/membership hoy
├── business-rules.md               reglas de dominio (guardrails)
├── superadmin.md                   dashboard /platform, CRUD operativo
├── code-style.md                   convenciones TS/React del repo
├── backend/                        → ver árbol en sección Architecture
├── database/
│   ├── data-model.md               tablas implementadas + roadmap
│   ├── not-null-fields.md
│   ├── table-naming-singular-plural-convention.md
│   └── text-over-varchar-char-convention.md
├── frontend/
│   └── style-guidelines.md         theme tokens, sin colores hardcodeados
├── testing/
│   ├── mock-objects.md
│   └── object-mothers.md
└── issues/README.md                flujo plan-to-issues → GitHub → kanban

.agents/skills/
├── prisma/                         schema, migrate, seed, DATABASE_URL
├── plan-to-issues/                 plan .md → docs/issues + manifest
├── publish-github-issues/          manifest → gh issue create
└── kanban-board/                   implement, close, cleanup drafts
```

| Tarea rápida | Empezar por |
|--------------|-------------|
| Producto / roles | sección **Product** + `domain/saas-architecture.md` |
| API / use case nuevo | `backend/thin-api-routes.md` → hexagonal → DIOD |
| Prisma / tablas | `database/data-model.md` + skill `prisma/` |
| Login atascado / cookies | `backend/session-cookies-localhost-dev.md` |
| UI / theming | `frontend/style-guidelines.md`, `src/app/theme/tokens.css` |

**Flujo issues:** `docs/issues/README.md` — plan-to-issues → publish-github-issues → kanban-board (al cerrar, eliminar body/manifest en docs).
