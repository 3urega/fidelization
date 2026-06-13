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
npm run verify:platform-app-auth-use-case  # issue #38 — RegisterPlatformUser + LoginPlatformUser + kind user (domain stub)
npm run verify:platform-app-public-home  # issue #39 — / home + register/login UI + middleware (dev server)
npm run verify:platform-app-register-business  # issue #40 — /business/register + POST /api/user/businesses + enter panel (dev + DATABASE_URL)
npm run verify:platform-app-enter-tenant-use-case  # EnterTenantStaffFromUserSession (domain stub)
npm run verify:platform-app-enter-user-use-case  # EnterPlatformUserFromTenantSession (domain stub)
npm run verify:platform-app-dashboard-use-case  # issue #41 — ListUserRelationships (domain stub)
npm run verify:platform-app-dashboard  # issue #41 — /home dashboard + business shell E2E (dev + DATABASE_URL)
npm run verify:platform-app-discover-establishments-use-case  # Phase I — ListDiscoverableEstablishments (domain stub)
npm run verify:platform-app-discover-establishments  # Phase I — GET /api/user/establishments grid E2E (dev server)
npm run verify:platform-app-customer-join-use-case  # issue #42 — JoinTenantAsCustomer (domain stub)
npm run verify:platform-app-customer-join  # issue #42 — join by slug + deep link E2E (dev + DATABASE_URL)
npm run verify:platform-app-establishment-detail-use-case  # issue #43 — GetEstablishmentDetailForUser (domain stub)
npm run verify:platform-app-establishment-detail  # issue #43 — establishment detail + cross-promos E2E (dev + DATABASE_URL)
npm run verify:platform-app-global-qr-scan-use-case  # issue #44 — RecordCustomerVisitByQr user QR lookup (domain stub)
npm run verify:platform-app-global-qr-scan  # issue #44 — user QR staff scan E2E (dev + DATABASE_URL)
npm run verify:platform-app-google-oauth-use-case  # issue #45 — AuthenticateGoogleUser (domain stub)
npm run verify:platform-app-google-oauth  # issue #45 — Google UI + OAuth API E2E (dev server)
npm run verify:platform-app-capacitor-config  # issue #45 — deep links + build:capacitor (SKIP_CAPACITOR_BUILD=1 to skip build)
npm run verify:platform-app-e2e  # issue #45 — full platform app flow E2E (dev + DATABASE_URL)
npm run verify:owner-login     # tenant login cookie + GET /panel (demo o OWNER_VERIFY_*)
npm run verify:platform-login  # superadmin cookie + GET /platform (SUPERADMIN_* en .env)
npm run verify:platform-isolation  # issue #8 — platform session no accede a /api/me ni /home
npm run verify:platform-tenants    # issue #9 — list tenants + PATCH status (OWNER_VERIFY_* opcional)
npm run verify:business-register   # issues #11–#12 — owner user step 1 (onboarding cookie, hash, no membership)
npm run verify:business-onboarding # issue #13 — wizard step 2 → tenant + owner session → /panel
npm run verify:format-tenant-host  # issue #15 — formatTenantHost + slugifyBusinessName
npm run verify:session-cookie-prod # production cookie Domain + resolveTenantHomeUrl
npm run verify:tenant-branding     # issue #17 — PATCH branding + GET /api/me + Prisma (dev server + DATABASE_URL)
npm run verify:tenant-profile-use-case # tenant profile — UpdateTenantProfile domain stub
npm run verify:tenant-profile      # PATCH /api/tenant/profile + GET /api/me + Prisma (dev server + DATABASE_URL)
npm run verify:customer-session    # issue #18 — JWT kind customer + Customer.register (domain)
npm run verify:customer-use-case   # issue #18 — RegisterCustomer + AuthenticateCustomerByQr + DI
npm run verify:customer-loyalty-api  # issue #18 — loyalty APIs (x-tenant headers on apex)
npm run verify:customer-qr-session   # issue #20 — E2E tenant host → register → /app/card + Prisma (dev + DATABASE_URL)
npm run verify:customer-scan         # staff scan → points + loyalty_transactions (dev + DATABASE_URL)
npm run verify:customer-stamp-scan-use-case  # issue #22 — scan adds stamp per active campaign (domain stub)
npm run verify:customer-stamp-scan   # issue #22 — scan + stamp progress E2E (dev + DATABASE_URL)
npm run verify:customer-stamp-progress-use-case  # issue #23 — GET me stampProgress[] (domain stub)
npm run verify:customer-stamp-progress   # issue #23 — register → scan → GET me stampProgress E2E (dev + DATABASE_URL)
npm run verify:stamp-campaigns-use-case  # issue #21 — Create/List/Update stamp campaigns (domain stub)
npm run verify:stamp-campaign-dashboard-use-case  # Phase K1 #55 — ListStampCampaignDashboard (domain stub)
npm run verify:stamp-campaign-dashboard  # Phase K2 #56 — GET stamp-campaigns/dashboard E2E (dev + DATABASE_URL)
npm run verify:customer-zone-use-case  # Phase L1 #59 — customer zone analytics (domain stub)
npm run verify:customer-zone  # Phase L2 #60 — customer zone API E2E (dev + DATABASE_URL)
npm run verify:stamp-campaigns       # issue #21 — POST/GET/PATCH stamp campaigns + Prisma (dev + DATABASE_URL)
npm run verify:stamp-types-use-case  # Phase H1 — stamp_types catalog (domain stub)
npm run verify:stamp-types           # Phase H1 — stamp types API + Prisma (dev + DATABASE_URL)
npm run verify:customer-stamp-scan-targeted-use-case  # Phase H3 — typed scan filters campaigns (domain stub)
npm run verify:staff-scan-flow-spec-use-case  # Phase M1 #65 — staff scan target/outcome types (domain)
npm run verify:customer-stamp-scan-targeted  # Phase H3 — café/menú E2E scan (dev + DATABASE_URL)
npm run verify:rewards-use-case      # issue #24 — Create/List/Update rewards (domain stub)
npm run verify:rewards               # issue #24 — POST/GET/PATCH rewards + Prisma (dev + DATABASE_URL)
npm run verify:promotions-use-case   # issue #35 — Create/List/Update promotions + plan gate (domain stub)
npm run verify:promotions            # issue #35 — POST/GET/PATCH promotions + Prisma (dev + DATABASE_URL)
npm run verify:customer-promotions-use-case # issue #37 — ListActivePromotionsForCustomer (domain stub)
npm run verify:customer-promotions   # issue #37 — customer GET me promotions + deactivate E2E (dev + DATABASE_URL)
npm run verify:customer-reward-redeem-use-case  # issue #25 — list active + redeem (domain stub)
npm run verify:customer-reward-redeem   # issue #25 — rewards[] in GET me + POST redeem E2E (dev + DATABASE_URL)
npm run verify:tenant-employees-use-case  # issue #26 — invite/list employees (domain stub)
npm run verify:tenant-employees   # issue #27 — owner invite → employee login → scan E2E (dev + DATABASE_URL)
npm run verify:subscription-plans-use-case  # issue #30 — list/assign tenant plan (domain stub)
npm run verify:subscription-plans   # issue #30 — GET/PATCH billing plans + Prisma (dev + DATABASE_URL)
npm run verify:onboarding-plan-selection  # issue #31 — wizard → /onboarding/plan → assign plan E2E (dev + DATABASE_URL)
npm run verify:stripe-checkout-use-case  # issue #32 — CreateStripeCheckoutSession (domain stub)
npm run verify:stripe-webhook-checkout-use-case  # issue #32 — CompleteStripeCheckoutSession + webhook payload (domain stub)
npm run verify:stripe-webhooks-use-case  # issue #33 — SyncTenantSubscriptionFromStripe + ProcessStripeWebhook (domain stub)
npm run verify:tenant-feature-flags-use-case  # issue #34 — plan feature guards + employee limits (domain stub)
npm run db:users               # list users, platform_role y memberships
npm run build:capacitor   # export out/ + cap sync android (node script; stop dev server on Windows)
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

Documentación de producto y negocio: [`docs/domain/saas-architecture.md`](docs/domain/saas-architecture.md) (arquitectura, roles, MVP técnico), [`docs/domain/business-model.md`](docs/domain/business-model.md) (planes, ingresos), [`docs/domain/business-onboarding.md`](docs/domain/business-onboarding.md) (alta self-service del negocio), [`docs/domain/post-onboarding-mvp-roadmap.md`](docs/domain/post-onboarding-mvp-roadmap.md) (siguiente fase: branding → customer QR; planes/Stripe después), [`docs/business-rules.md`](docs/business-rules.md) (reglas de dominio). Resumen ejecutivo en la sección **Product** de este archivo.

# Business Rules

Reglas de dominio que deben respetarse en implementación y validaciones:

- **Puntos:** 1 € gastado puede generar puntos; el cálculo es configurable por tenant.
- **Sellos:** un cliente puede tener varias campañas de sellos activas a la vez; las campañas se pueden desactivar sin borrar datos.
- **QR:** cada cliente tiene un QR único que lo identifica de forma global; cada escaneo genera un evento auditable.
- **Planes:** las funcionalidades se controlan con feature flags; un tenant no puede acceder a features fuera de su plan.

Detalle completo: [`docs/business-rules.md`](docs/business-rules.md).

# Local auth / tenants (dev)

- **Owner/staff login:** `/login` en subdominio tenant → `/panel` en ese host (cookie host-only). Apex `localhost:3000/login` = login app personal (`kind: user`) → `/home`. Requiere `AUTH_SECRET`; opcional `APP_DOMAIN=localhost` + `NEXT_PUBLIC_APP_DOMAIN=localhost` para resolución de tenant en middleware. **Producción:** cookie `Domain=.${APP_DOMAIN}` + redirect tenant → `{slug}.${APP_DOMAIN}/panel` (`verify:session-cookie-prod`). Detalle: [`docs/backend/session-cookies-localhost-dev.md`](docs/backend/session-cookies-localhost-dev.md).
- **Superadmin (issue #8):** solo `http://localhost:3000/platform/login` (apex) → `/platform`; no usar `/login` ni subdominios de negocio. Verifies: `verify:platform-login`, `verify:platform-isolation`.
- **Superadmin dashboard (issue #9):** en `/platform` — lista de negocios y activar/suspender. `verify:platform-tenants`.
- **Demo:** `demo@starter.local` + botón demo, o `cafe-demo.localhost`.
- **Business register (issues #11–#12):** `http://localhost:3000/register/business` → onboarding session → paso 2 en `/register/business/tenant`. `verify:business-register`, `verify:business-onboarding` (#13).
- **Subdomain preview (#15):** paso 2 muestra `{slug}.localhost` (con `NEXT_PUBLIC_APP_DOMAIN=localhost`); `verify:format-tenant-host`.
- **Tenant branding (#16–#17):** owner en `/settings/branding` (shell nav) → logo URL + colores; checklist en `/panel`. API: `PATCH /api/tenant/branding`. `verify:tenant-branding` (E2E + Prisma).
- **Tenant profile:** owner en `/settings/profile` → dirección (recomendada) + descripción opcionales; checklist «Añade la dirección» en `/panel`. API: `PATCH /api/tenant/profile`. Visible en detalle del local (app personal). `verify:tenant-profile-use-case`, `verify:tenant-profile`.
- **Customer loyalty `/app` (#18–#20):** cliente en `http://{slug}.localhost:3000/app` (p. ej. `cafe-demo.localhost`) → `/app/welcome` → tarjeta con QR. Sesión `kind: customer`. APIs: `POST /api/loyalty/customers/register`, `GET /api/loyalty/me` (incl. `stampProgress[]` desde #23, `rewards[]` desde #25). `verify:customer-qr-session` (E2E + Prisma). Apex `localhost/app` → `/app/unavailable`.
- **Customer stamp progress (#23):** en `/app/card`, sección «Sellos» con progreso por campaña activa (`0/N`, «Completada»). `verify:customer-stamp-progress-use-case`, `verify:customer-stamp-progress`.
- **Staff scan:** owner/empleado en `/scan` → `POST /api/loyalty/scan` con `qrValue` → +1 punto, +1 sello por campaña activa, filas en `loyalty_transactions` (`points_earned`, `stamp_added`). Enlace para clientes en checklist `/home`. `verify:customer-scan`, `verify:customer-stamp-scan`.
- **Stamp campaigns (#21):** owner en `/settings/stamps` → tipos de consumición (Phase H) + campañas (`GET/POST /api/loyalty/stamp-types`, `GET/POST/PATCH /api/loyalty/stamp-campaigns`). Empleado en `/scan` elige tipo antes de escanear. `verify:stamp-types*`, `verify:stamp-campaigns*`, `verify:customer-stamp-scan-targeted*`.
- **Rewards (#24):** owner API `GET/POST /api/loyalty/rewards`, `PATCH …/[id]` (owner-only; sin UI aún). `verify:rewards-use-case`, `verify:rewards`.
- **Customer reward redeem (#25):** en `/app/card`, sección «Recompensas» con catálogo activo; `POST /api/loyalty/rewards/redeem` descuenta puntos y crea `reward_redeemed`. `verify:customer-reward-redeem-use-case`, `verify:customer-reward-redeem`.
- **Tenant employees (#26–#27):** owner en `/settings/team` invita empleados (`GET/POST /api/tenant/employees`); empleado inicia sesión en subdominio tenant y usa `/scan`. Checklist «Invita a tu empleado» en `/home`. `verify:tenant-employees-use-case`, `verify:tenant-employees`.
- **Subscription plans (#30):** owner lista catálogo Basic/Pro/Premium (`GET /api/billing/plans`) y asigna plan al tenant (`PATCH /api/billing/tenant-plan` con `{ planId }`); empleado solo lectura en GET. `verify:subscription-plans-use-case`, `verify:subscription-plans`.
- **Onboarding plan UI (#31):** tras Step 2, owner en `/onboarding/plan` elige plan; checklist «Elige tu plan» en `/home` hasta `subscriptionPlanId` asignado. `verify:onboarding-plan-selection`.
- **Stripe Checkout (#32):** Basic sigue con `PATCH`; Pro/Premium → `POST /api/billing/checkout` → redirect Stripe; webhook `checkout.session.completed` en `POST /api/webhooks/stripe` crea fila `subscriptions` y vincula plan. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PREMIUM_MONTHLY`. Dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. `verify:stripe-checkout-use-case`, `verify:stripe-webhook-checkout-use-case`.
- **Stripe webhooks lifecycle (#33):** `POST /api/webhooks/stripe` procesa `invoice.payment_failed`, `invoice.paid`, `customer.subscription.updated/deleted` → `SyncTenantSubscriptionFromStripe` (impago → tenant `suspended`; pago recuperado reactiva solo si suscripción estaba `past_due`). Idempotencia en `stripe_webhook_events`. Migración: `20260609150000_stripe_webhook_events`. Dev triggers: `stripe trigger invoice.payment_failed`, `stripe trigger invoice.paid`. `verify:stripe-webhooks-use-case`.
- **Plan feature flags (#34):** guards `AssertTenantPlanFeature` / `AssertTenantEmployeeLimit` leen `subscription_plans.features`/`limits`. Basic: sellos+puntos; Pro+: `GET /api/loyalty/promotions`; límite empleados en invite. `GET /api/me` incluye `planFeatures[]`. `verify:tenant-feature-flags-use-case`.
- **Promotions owner API (#35):** owner Pro+ `GET/POST /api/loyalty/promotions`, `PATCH …/[id]`; employee GET only. `verify:promotions-use-case`, `verify:promotions` (dev + `DATABASE_URL`).
- **Promotions owner UI (#36):** owner en `/settings/promotions` → crear/listar/desactivar promos; nav owner-only; checklist «Crea tu primera promoción» en `/home` (Pro+); Basic → upsell `/onboarding/plan`. `planFeatures` en sesión tenant.
- **Customer promotions (#37):** cliente en `/app/card` ve promos activas; `GET /api/loyalty/me` incluye `promotions[]`; Basic → `[]` sin error. `verify:customer-promotions-use-case`, `verify:customer-promotions` (dev + `DATABASE_URL`).
- **Platform app auth (#38):** registro/login unificado persona en apex (`POST /api/auth/register/user`, `POST /api/auth/login/user`); sesión JWT `kind: user`; `GET /api/user/me`; `users.qr_value` + `customers.user_id` migrados. `verify:platform-app-auth-use-case`.
- **Platform app home UI (#39):** home pública `/` (Registrarse · Registrar negocio · Login); formularios `/register`, `/login` host-aware → `/home`; guards middleware `kind: user`; legacy `/u/*` → 308. `verify:platform-app-public-home`.
- **Platform app register business (#40):** `/business/register` (auth gate) → `/business/register/tenant`; `POST /api/user/businesses` con sesión `kind: user`; «Mis negocios» en `/home`; `POST /api/user/businesses/[slug]/enter` emite sesión `kind: tenant` y abre `/panel` sin re-login; desde el panel del negocio, «App personal» → `POST /api/user/enter` vuelve a sesión `kind: user` en `/home`. `verify:platform-app-register-business`, `verify:platform-app-enter-tenant-use-case`, `verify:platform-app-enter-user-use-case`.
- **Platform app dashboard (#41):** `/home` unificado (Mis negocios + Mis locales), botón «Mostrar mi QR» (modal), `/home/business/[slug]`, `GET /api/user/me/relationships`. `verify:platform-app-dashboard`, `verify:platform-app-dashboard-use-case`.
- **Platform app explorar locales (Phase I):** pestañas en `/home` (Explorar · Mis locales · Mis negocios); grid 2 cols, imagen difuminada, infinite scroll, `GET /api/user/establishments`; `/home/discover` → `?tab=locales`. `verify:platform-app-discover-establishments*`.
- **Phase J visual assets:** [`docs/domain/visual-assets-system.md`](docs/domain/visual-assets-system.md) — sellos SVG dinámicos, `LoyaltyProgress`, fondos campaña (`fondos.png`); `verify:loyalty-visual-assets`, `verify:loyalty-progress-component`; issues #49–#54 (**Phase J complete**).
- **Platform app join establishment (#42):** `POST /api/user/establishments/join` `{ slug }`, `JoinTenantAsCustomer`, formulario en `/home/discover`, deep link `/join/[slug]`. Join explícito cuenta como interacción en «Mis locales». `verify:platform-app-customer-join`, `verify:platform-app-customer-join-use-case`.
- **Platform app establishment detail (#43):** `GET /api/user/establishments/[slug]` (`discovery` \| `interaction`), `/home/establishments/[slug]`, `LoyaltyCard` + redeem user-scoped, cross-promos, `/home/qr`. `verify:platform-app-establishment-detail`, `verify:platform-app-establishment-detail-use-case`.
- **Platform app global QR scan (#44):** `RecordCustomerVisitByQr` resuelve `customers.qr_value` (legacy) luego `users.qr_value` → `customers(user_id, tenant_id)`; **auto-join en primer escaneo** si no hay fila customer. Dashboard: botón «Mostrar mi QR» (modal). `verify:platform-app-global-qr-scan`, `verify:platform-app-global-qr-scan-use-case`; regresión legacy en `verify:customer-scan`.
- **Platform app Google OAuth (#45):** `POST /api/auth/oauth/google` + botones GIS en `/`, `/register`, `/login`. Capacitor: `fidelization://join/{slug}` → `/join/[slug]`, `platformFetch` + `NEXT_PUBLIC_API_URL`. Env: `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `CAPACITOR_SERVER_URL` (dev). `verify:platform-app-google-oauth`, `verify:platform-app-google-oauth-use-case`, `verify:platform-app-capacitor-config`, `verify:platform-app-e2e`, `npm run build:capacitor`.

# Architecture

- Next.js 14, Onion Architecture, DDD.
- **Active contexts**: `identity` (users, auth), `tenants` (tenant, memberships, owner onboarding), `loyalty` (customers, transactions, rewards, stamps, promos, coupons, notifications — Prisma repos), `billing` (Google Play starter + `subscriptions` tenant catalog), `shared` (infra, DI).
- **Tenant context (Fase 0):** JWT `tenantId` + `role` after login/register — not subdomain middleware yet. Spec: [`docs/teenant-resolution.md`](docs/teenant-resolution.md).
- **Legacy reference**: `src/contexts/legacy/` (MOOC, Femturisme, RAG) — not wired in DI.
- Frontend in `src/app/`, API routes in `src/app/api/`.
- **App Router groups (issue #4):** `(public)/` landing, `(auth)/` login+register, `(app)/` owner shell (`/home` — no confundir con URL `/app`), `(loyalty)/` customer `/app`, `(platform)/` superadmin; URLs sin cambio (`/`, `/login`, `/home`, `/app`, …).
- **Superadmin foundation (issue #8):** auth `kind: platform`, aislamiento de tenant APIs y middleware; dashboard operativo (CRUD) fuera de alcance.
- **Env:** [`src/lib/env.ts`](src/lib/env.ts) — acceso centralizado server-side; ver [`.env.example`](.env.example) y [`docs/backend/external-services-env.md`](docs/backend/external-services-env.md) (Google OAuth, Stripe).

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
│   ├── external-services-env.md           # Google Sign-In + Stripe: claves, .env, dev local
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
| Post-onboarding MVP (branding corto → customer `/app`; planes después) | `docs/domain/post-onboarding-mvp-roadmap.md` + `verify:tenant-branding` + `verify:customer-qr-session` |
| App consumidor multi-establecimiento (identidad global, dashboard locales) | `docs/domain/customer-platform-app.md` — **target**; registro unificado owner/cliente, home app (Registrarse / Registrar negocio / Login), dashboard por relación |
| Stamp campaigns owner CRUD (#21) + typed scan (Phase H) | `verify:stamp-campaigns*` + `verify:stamp-types*` + `verify:customer-stamp-scan-targeted*` + `/settings/stamps` + `/scan` |
| Staff scan + stamps (#22) | `verify:customer-stamp-scan-use-case` + `verify:customer-stamp-scan` + `/scan` |
| Customer stamp progress (#23) | `verify:customer-stamp-progress-use-case` + `verify:customer-stamp-progress` + `/app/card` |
| Rewards owner CRUD (#24) | `verify:rewards-use-case` + `verify:rewards` + `/api/loyalty/rewards` |
| Customer reward redeem (#25) | `verify:customer-reward-redeem-use-case` + `verify:customer-reward-redeem` + `/app/card` |
| Tenant employees (#26–#27) | `verify:tenant-employees-use-case` + `verify:tenant-employees` + `/settings/team` |
| Subscription plans (#30) | `verify:subscription-plans-use-case` + `verify:subscription-plans` + `/api/billing/plans` |
| Onboarding plan UI (#31) | `verify:onboarding-plan-selection` + `/onboarding/plan` + checklist `/home` |
| Stripe Checkout (#32) | `verify:stripe-checkout-use-case` + `verify:stripe-webhook-checkout-use-case` + `/api/billing/checkout` + `/api/webhooks/stripe` + **`docs/backend/external-services-env.md`** (claves Stripe) |
| Stripe webhooks lifecycle (#33) | `verify:stripe-webhooks-use-case` + `ProcessStripeWebhook` + `stripe_webhook_events` |
| Plan feature flags (#34) | `verify:tenant-feature-flags-use-case` + `GET /api/loyalty/promotions` + `planFeatures` in `/api/me` |
| Promociones owner + cliente (#35–#37) | `verify:promotions*` + `/settings/promotions` (#36) + `verify:customer-promotions*` + `/app/card` (#37) |
| Platform mobile app Phase G (#38–#45) | `verify:platform-app-auth-use-case` (#38), `verify:platform-app-public-home` (#39), `verify:platform-app-register-business` (#40), `verify:platform-app-dashboard` (#41), `verify:platform-app-customer-join` (#42), `verify:platform-app-establishment-detail` (#43), `verify:platform-app-global-qr-scan` (#44), `verify:platform-app-e2e` (#45) + `docs/domain/customer-platform-app.md` + **`docs/backend/external-services-env.md`** (Google OAuth) |
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
├── plan-to-issues/              # paso 1: plan .md → docs/issues/*.md + manifest
├── publish-github-issues/       # paso 2: manifest → GitHub (gh issue create)
└── kanban-board/                # paso 3: list, plan, implement, close + borrar drafts en docs/issues
```

**Flujo issues:** `docs/issues/README.md` — plan-to-issues → publish-github-issues → kanban-board (al cerrar, eliminar body/manifest en docs).
