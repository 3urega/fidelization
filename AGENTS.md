# Useful commands

```bash
npm prep          # lint + build (Jest desactivado en prep; ver nota abajo)
docker compose up -d   # Postgres + schema starter
npm run dev       # local dev server (not Docker)
npm run lint:fix
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

Documentación de producto y negocio: [`docs/saas-architecture.md`](docs/saas-architecture.md) (arquitectura, roles, MVP técnico), [`docs/business-model.md`](docs/business-model.md) (planes, ingresos), [`docs/business-rules.md`](docs/business-rules.md) (reglas de dominio). Resumen ejecutivo en la sección **Product** de este archivo.

# Business Rules

Reglas de dominio que deben respetarse en implementación y validaciones:

- **Puntos:** 1 € gastado puede generar puntos; el cálculo es configurable por tenant.
- **Sellos:** un cliente puede tener varias campañas de sellos activas a la vez; las campañas se pueden desactivar sin borrar datos.
- **QR:** cada cliente tiene un QR único que lo identifica de forma global; cada escaneo genera un evento auditable.
- **Planes:** las funcionalidades se controlan con feature flags; un tenant no puede acceder a features fuera de su plan.

Detalle completo: [`docs/business-rules.md`](docs/business-rules.md).

# Architecture

- Next.js 14, Onion Architecture, DDD.
- **Active contexts**: `identity` (users, auth), `tenants` (tenant, memberships, owner onboarding), `loyalty` (customers, transactions, rewards, stamps, promos, coupons, notifications — Prisma repos), `billing` (Google Play starter + `subscriptions` tenant catalog), `shared` (infra, DI).
- **Tenant context (Fase 0):** JWT `tenantId` + `role` after login/register — not subdomain middleware yet. Spec: [`docs/teenant-resolution.md`](docs/teenant-resolution.md).
- **Legacy reference**: `src/contexts/legacy/` (MOOC, Femturisme, RAG) — not wired in DI.
- Frontend in `src/app/`, API routes in `src/app/api/`.

# Documentation

- Detailed conventions with examples live in `docs/`.
- **Do NOT read all docs upfront.**
- When working on a task, use this map to find and read only the docs relevant to your task:

```
docs/
├── saas-architecture.md         # arquitectura SaaS objetivo + estado implementado vs spec
├── teenant-resolution.md        # resolución de tenant (subdomain target; JWT/membership hoy) — nombre con typo teenant
├── business-model.md            # planes comerciales, add-ons, ingresos + estado vs código
├── business-rules.md            # reglas de dominio: puntos, sellos, QR, planes
├── code-style.md
├── documentation-format.md
├── backend/
│   ├── api-routes-reflect-metadata.md
│   ├── dependency-injection-diod.md
│   ├── hexagonal-architecture.md
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
| Producto, MVP, tipos de usuario, visión fidelización | sección **Product** (este archivo), `docs/saas-architecture.md`, `docs/business-rules.md` |
| Planes Basic/Pro/Premium, add-ons, pricing, modelo de ingresos | `docs/business-model.md` (sección *Implementation status*) |
| Superadmin, tenant isolation, feature flags, billing SaaS, subdominios | `docs/saas-architecture.md` (sección *Implementation status*) |
| Resolución de tenant (subdominio, JWT `tenantId`, middleware, login) | `docs/teenant-resolution.md` (sección *Implementation status*) + `src/middleware.ts`, `src/lib/auth/session.ts` |
| Billing / Google Play / `UserPlan` FREE-PREMIUM (starter) | `src/contexts/billing/`, `UserPlan` — no confundir con planes tenant del business-model |
| API routes, DI, hexagonal | `docs/backend/*` |
| Modelo de datos, nuevas tablas, `tenant_id`, membership | `docs/database/data-model.md` (§ Implemented) + `prisma/schema.prisma` + `docs/database/*` |
| Prisma, migraciones, seed | `.agents/skills/prisma/`, `prisma/schema.prisma` |
| UI, theming, presets | `docs/frontend/style-guidelines.md`, `src/app/theme/tokens.css`, `src/app/_components/theme/` |

.agents/skills/
├── prisma/                      # Prisma Postgres, migraciones, seed, src/lib/prisma.ts
└── kanban-board/                # issues GitHub 3urega/fidelization
```
