# Useful commands

```bash
npm prep          # build (sin lint; usar npm run lint manualmente)
docker compose up -d   # Postgres + schema starter
npm run dev       # local dev server (not Docker)
npm run lint:fix
npm run verify:saas-base   # issue #4 — route groups, tenant stub, env
npm run verify:tenant-resolution   # issue #5 — extractSubdomain + mock slug map
npm run verify:tenant-auth   # issue #6 — staff roles, TenantStaffLogin, cross-tenant session
npm run verify:platform-auth   # superadmin — JWT kind platform/tenant, PlatformAuthenticator
npm run verify:owner-login     # tenant login cookie + GET /home (demo o OWNER_VERIFY_*)
npm run verify:platform-login  # superadmin cookie + GET /platform (SUPERADMIN_* en .env)
npm run verify:platform-isolation  # issue #8 — platform session no accede a /api/me ni /home
npm run verify:platform-tenants    # issue #9 — list tenants + PATCH status (OWNER_VERIFY_* opcional)
npm run verify:business-register   # issues #11–#12 — owner user step 1 (onboarding cookie, hash, no membership)
npm run verify:business-onboarding # issue #13 — wizard step 2 → tenant + owner session → /home
npm run verify:format-tenant-host  # issue #15 — formatTenantHost + slugifyBusinessName
npm run verify:session-cookie-prod # production cookie Domain + resolveTenantHomeUrl
npm run db:users               # list users, platform_role y memberships
npm run build:capacitor   # export out/ + cap sync android
```

**Tests:** la suite Jest actual apunta sobre todo a contextos legacy y puede colgar o fallar. No forma parte del flujo del starter activo hasta reescribir tests para `identity`/`billing`.

# Product

SaaS de fidelización y retención de clientes para cafés y pequeños negocios de hostelería. Plataforma genérica, configurable y **multi-tenant desde el día uno**: cada negocio es un tenant con datos, branding, promociones y clientes aislados. Mercado inicial: cafés; arquitectura adaptable a panaderías, heladerías, bares, restaurantes, food trucks, etc.

**Tipos de usuario:** administrador de plataforma, propietario del negocio, empleado (permisos limitados), cliente (app móvil).

**Núcleo del producto:**
- Fidelización configurable por tenant: puntos, tarjetas de sellos, recompensas, referidos (opcional).
- Flujo QR: el cliente muestra su código → el empleado escanea → se registra la compra → puntos/sellos automáticos (sin tarjetas físicas ni integración POS).
- Promociones, cupones y notificaciones push para engagement.
- Planes de suscripción (Basic / Pro / Premium) con feature flags por tenant.
- Analítica básica (clientes activos, visitas, puntos, recompensas, rendimiento de promociones).

**Stack cliente:** Next.js + Capacitor — una sola base de código para web, Android e iOS; mobile-first.

**Prioridades MVP (en orden):** multi-tenant → auth → perfiles de cliente → QR → sellos → puntos → recompensas → promociones → cupones → push → planes → analítica básica. Integraciones futuras (POS, wallets, CRM) no condicionan la arquitectura inicial.

Documentación de producto y negocio: [`docs/domain/saas-architecture.md`](docs/domain/saas-architecture.md) (arquitectura, roles, MVP técnico), [`docs/domain/business-model.md`](docs/domain/business-model.md) (planes, ingresos), [`docs/domain/business-onboarding.md`](docs/domain/business-onboarding.md) (alta self-service del negocio), [`docs/business-rules.md`](docs/business-rules.md) (reglas de dominio). Resumen ejecutivo en la sección **Product** de este archivo.

# Business Rules

Reglas de dominio que deben respetarse en implementación y validaciones:

- **Puntos:** 1 € gastado puede generar puntos; el cálculo es configurable por tenant.
- **Sellos:** un cliente puede tener varias campañas de sellos activas a la vez; las campañas se pueden desactivar sin borrar datos.
- **QR:** cada cliente tiene un QR único que lo identifica de forma global; cada escaneo genera un evento auditable.
- **Planes:** las funcionalidades se controlan con feature flags; un tenant no puede acceder a features fuera de su plan.

Detalle completo: [`docs/business-rules.md`](docs/business-rules.md).

# Local auth / tenants (dev)

- **Owner/staff login:** `/login` en `http://localhost:3000` → `/home` en el mismo host (cookie host-only). Subdominio: `http://{slug}.localhost:3000/login` → `/home` en ese host. Requiere `AUTH_SECRET`; opcional `APP_DOMAIN=localhost` + `NEXT_PUBLIC_APP_DOMAIN=localhost` para resolución de tenant en middleware. **Producción:** cookie `Domain=.${APP_DOMAIN}` + redirect apex → `{slug}.${APP_DOMAIN}/home` (`verify:session-cookie-prod`). Detalle: [`docs/backend/session-cookies-localhost-dev.md`](docs/backend/session-cookies-localhost-dev.md).
- **Superadmin (issue #8):** solo `http://localhost:3000/platform/login` (apex) → `/platform`; no usar `/login` ni subdominios de negocio. Verifies: `verify:platform-login`, `verify:platform-isolation`.
- **Superadmin dashboard (issue #9):** en `/platform` — lista de negocios y activar/suspender. `verify:platform-tenants`.
- **Demo:** `demo@starter.local` + botón demo, o `cafe-demo.localhost`.
- **Business register (issues #11–#12):** `http://localhost:3000/register/business` → onboarding session → paso 2 en `/register/business/tenant`. `verify:business-register`, `verify:business-onboarding` (#13).
- **Subdomain preview (#15):** paso 2 muestra `{slug}.localhost` (con `NEXT_PUBLIC_APP_DOMAIN=localhost`); `verify:format-tenant-host`.

# Architecture

- Next.js 14, Onion Architecture, DDD.
- **Active contexts**: `identity` (users, auth), `tenants` (tenant, memberships, owner onboarding), `loyalty` (customers, transactions, rewards, stamps, promos, coupons, notifications — Prisma repos), `billing` (Google Play starter + `subscriptions` tenant catalog), `shared` (infra, DI).
- **Tenant context (Fase 0):** JWT `tenantId` + `role` after login/register — not subdomain middleware yet. Spec: [`docs/teenant-resolution.md`](docs/teenant-resolution.md).
- **Legacy reference**: `src/contexts/legacy/` (MOOC, Femturisme, RAG) — not wired in DI.
- Frontend in `src/app/`, API routes in `src/app/api/`.
- **App Router groups (issue #4):** `(public)/` landing, `(auth)/` login+register, `(app)/` owner shell, `(platform)/` superadmin (`/platform`, `/platform/login`); URLs sin cambio (`/`, `/login`, `/home`, …).
- **Superadmin foundation (issue #8):** auth `kind: platform`, aislamiento de tenant APIs y middleware; dashboard operativo (CRUD) fuera de alcance.
- **Env:** [`src/lib/env.ts`](src/lib/env.ts) — acceso centralizado server-side; ver [`.env.example`](.env.example).

# Documentation

- Detailed conventions with examples live in `docs/`.
- **Do NOT read all docs upfront.**
- When working on a task, use this map to find and read only the docs relevant to your task:

```
docs/
├── domain/                      # spec de dominio de producto (target + estado vs código)
│   ├── saas-architecture.md     # arquitectura SaaS, roles, isolation, feature flags
│   ├── business-model.md        # planes comerciales, add-ons, ingresos
│   └── business-onboarding.md   # flujo B2B self-service: registro → tenant → plan → checkout → dashboard
├── teenant-resolution.md        # resolución de tenant (subdomain target; JWT/membership hoy) — nombre con typo teenant
├── business-rules.md            # reglas de dominio: puntos, sellos, QR, planes
├── code-style.md
├── documentation-format.md
├── backend/
│   ├── api-routes-reflect-metadata.md
│   ├── dependency-injection-diod.md
│   ├── hexagonal-architecture.md
│   ├── session-cookies-localhost-dev.md   # cookies sin Domain en localhost; rutas login dev
│   └── thin-api-routes.md
├── database/
│   ├── data-model.md            # esquema implementado (Fase 0) + entidades target + roadmap migraciones
│   ├── not-null-fields.md
│   ├── table-naming-singular-plural-convention.md
│   └── text-over-varchar-char-convention.md
├── frontend/
│   └── style-guidelines.md      # UI theme-driven, tokens, sin colores hardcodeados
└── testing/
    ├── mock-objects.md
    └── object-mothers.md

# Cuándo leer cada doc (no cargar todo)

| Tarea | Leer primero |
|-------|----------------|
| Producto, MVP, tipos de usuario, visión fidelización | sección **Product** (este archivo), `docs/domain/saas-architecture.md`, `docs/business-rules.md` |
| Planes Basic/Pro/Premium, add-ons, pricing, modelo de ingresos | `docs/domain/business-model.md` (sección *Implementation status*) |
| Alta self-service del negocio (registro owner, wizard, trial, checkout) | `docs/domain/business-onboarding.md` + `/register/business` + `/register/business/tenant` + `verify:business-register` + `verify:business-onboarding` |
| Superadmin foundation (issue #8), tenant isolation | `docs/domain/saas-architecture.md` + `npm run verify:platform-isolation` |
| Superadmin dashboard (issue #9) | `docs/domain/saas-architecture.md` + `npm run verify:platform-tenants` |
| Superadmin dashboard / CRUD tenants, feature flags, billing SaaS | `docs/domain/saas-architecture.md` (sección *Implementation status*) |
| Resolución de tenant (subdominio, JWT `tenantId`, middleware, login) | `docs/teenant-resolution.md` (sección *Implementation status*) + `src/middleware.ts`, `src/lib/auth/session.ts` |
| Login dev atascado / cookie / superadmin vs owner | `docs/backend/session-cookies-localhost-dev.md` + `npm run verify:platform-login` / `verify:owner-login` |
| Billing / Google Play / `UserPlan` FREE-PREMIUM (starter) | `src/contexts/billing/`, `UserPlan` — no confundir con planes tenant del business-model |
| API routes, DI, hexagonal | `docs/backend/*` |
| Modelo de datos, nuevas tablas, `tenant_id`, membership | `docs/database/data-model.md` (§ Implemented) + `prisma/schema.prisma` + `docs/database/*` |
| Prisma, migraciones, seed | `.agents/skills/prisma/`, `prisma/schema.prisma` |
| UI, theming, presets | `docs/frontend/style-guidelines.md`, `src/app/theme/tokens.css`, `src/app/_components/theme/` |

.agents/skills/
├── prisma/                      # Prisma Postgres, migraciones, seed, src/lib/prisma.ts
└── kanban-board/                # issues GitHub 3urega/fidelization
```
