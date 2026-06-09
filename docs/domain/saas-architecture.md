# SaaS Architecture

## Overview

This system is a multi-tenant SaaS platform for customer loyalty, promotions, and engagement for local businesses (cafés, restaurants, etc.).

The architecture is built around strict tenant isolation, feature-flag-driven functionality, and a centralized superadmin control layer.

**How to read this document:** it describes the **target platform architecture** (roles, isolation, billing model, feature flags, subdomains). Product vision and MVP priorities are summarized in [`AGENTS.md`](../../AGENTS.md) (section Product); domain rules in [`business-rules.md`](../business-rules.md); commercial plans in [`business-model.md`](business-model.md); business onboarding in [`business-onboarding.md`](business-onboarding.md); **tables and fields (implemented vs target):** [`database/data-model.md`](../database/data-model.md); **tenant resolution (subdomain target, JWT session today):** [`teenant-resolution.md`](../teenant-resolution.md). For what is **already in the repo**, see [Implementation status](#implementation-status-current-repo) below before planning new work.

---

## Implementation status (current repo)

| Area in this doc | Target | Implemented now | Notes |
|------------------|--------|-------------------|-------|
| Multi-tenant model | Tenant per business, isolated data | **Partial** | Prisma: `Tenant`, `TenantMembership`, `User`, loyalty tables; roles `owner` \| `employee` \| `customer` in [`prisma/schema.prisma`](../prisma/schema.prisma) |
| Tenant context in requests | Every query scoped by tenant | **Partial** | JWT session: `tenantId` + `role` ([`src/lib/auth/session.ts`](../src/lib/auth/session.ts)); repos filter by `tenant_id`; middleware stub [`resolveTenantFromRequest`](../src/lib/tenant/resolveTenant.ts) (no-op until subdomain) |
| Next.js App Router base (issue #4) | Route groups + layouts + env | **Yes** | [`(public)`](../src/app/(public)/), [`(auth)`](../src/app/(auth)/), [`(app)`](../src/app/(app)/); [`src/lib/env.ts`](../src/lib/env.ts) |
| Business owner onboarding | — | **Yes** | `OwnerRegistrar` + `POST /api/auth/register` with `businessName`; demo seed |
| Owner UI shell | Sidebar + top bar + tenant branding | **Yes** | [`TenantAdminShell`](../src/app/_components/shell/TenantAdminShell.tsx), [`TenantSessionProvider`](../src/app/_components/shell/TenantSessionProvider.tsx), `/home`, `/profile`; auth card [`AppShell`](../src/app/_components/ui/AppShell.tsx); theme tokens ([`src/app/_components/theme/`](../src/app/_components/theme/)) |
| Employee / customer flows | QR, purchases, app | **Partial (MVP)** | Customer `/app` + stamp progress on card (#18–#20, #23); staff scan → points + stamps (#22); owner stamp campaigns (#21) |
| Superadmin foundation (issue #8) | Separate platform auth, protected routes, tenant isolation | **Yes** | `users.platform_role`, seed `SUPERADMIN_*`, `/platform/login` + `/platform` (apex), JWT `kind: platform`, `requirePlatformSession` / `requireTenantSession`, `npm run verify:platform-isolation` |
| Superadmin dashboard (CRUD tenants, plans) | Platform-wide control UI | **Yes** | [`PlatformTenantsTable`](../src/app/_components/platform/PlatformTenantsTable.tsx), `GET/PATCH /api/platform/tenants`, toggle `active`/`suspended`, `npm run verify:platform-tenants` |
| Feature flags (global + tenant) | Plan-driven modules | **Partial** | `tenants.features` JSON migrated; no runtime enforcement |
| Billing (this doc) | Stripe, subscription per tenant | **Partial** | `subscription_plans` / `subscriptions` migrated; starter Google Play **per user** still in [`src/contexts/billing/`](../src/contexts/billing/) |
| Subdomains per tenant | `tenant.app.com` | **Partial (mock)** | `APP_DOMAIN` + middleware; see [`teenant-resolution.md`](../teenant-resolution.md) |
| Branding | Per tenant | **Partial** | `primaryColor`, `secondaryColor`, `logoUrl` on tenant; runtime via `ThemeProvider` |
| Postgres RLS | Recommended future | **No** | Prisma Postgres; isolation in application layer |

**Active bounded contexts:** `identity`, `tenants`, `loyalty`, `shared`, `billing` (Google Play demo + tenant subscription catalog). Legacy under `src/contexts/legacy/` is not wired in DI.

**App Router layout (issue #4):**

| Group | Routes | Layout |
|-------|--------|--------|
| `(public)` | `/` | `PublicNav` — marketing |
| `(auth)` | `/login`, `/register` | `AuthNav` — sin shell de app |
| `(app)` | `/home`, `/profile`, `/settings/branding`, `/settings/stamps` | `TenantAdminShell` (sidebar + top bar, branding vía `TenantSessionProvider`) — sesión tenant requerida (middleware) |
| `(platform)` | `/platform`, `/platform/login` | `PlatformAdminShell` (sidebar + top bar) — sesión `kind: platform` (apex only) |
| `(loyalty)` | `/app/welcome`, `/app/card` | `CustomerAppShell` + `ResolvedHostTenantTheme` — sesión `kind: customer` (tenant subdomain) |
| `(app)` scan | `/scan` | Staff QR entry (manual code MVP) — sesión `kind: tenant` |

### Three application contexts

| Context | Who | Login | JWT `kind` | Tenant in session |
|---------|-----|-------|------------|-------------------|
| Platform | Superadmin (`users.platform_role`) | `/platform/login` (apex) | `platform` | No |
| Tenant staff | Owner / employee / admin (`tenant_memberships`) | `/login` (subdomain or apex) | `tenant` | Yes |
| End customer | `customers` table | `/app` on tenant host (not `/login`) | `customer` | Yes |

**Conclusion:** platform **foundation** (issue #4), Fase 0 tenant auth, **superadmin foundation** (issue #8), **minimal superadmin dashboard** (issue #9), **customer QR MVP** (#18–#20), **staff scan → points + stamps** (#22: `/scan`, `RecordCustomerVisitByQr`), **owner stamp campaigns** (#21: `/settings/stamps`), and **customer stamp progress on `/app/card`** (#23: `GET /api/loyalty/me` + `stampProgress[]`) are in place. Feature-flag enforcement, camera scan UI, tenant create/delete from UI, and Stripe tenant billing remain follow-ups.

---

# 1. System Roles

## 1.1 Superadmin (Platform Owner)

The highest level of access in the system.

### Responsibilities:

* Manage all tenants (create, suspend, delete)
* Manage subscription plans
* Enable/disable global modules (e.g. gamification engine)
* Monitor platform-wide analytics
* Control billing infrastructure
* Manage feature availability at platform level

### Important:

Superadmin does NOT belong to any tenant.

---

## 1.2 Tenant (Business Account)

Represents a single business (e.g. café, bakery, restaurant).

Each tenant is fully isolated.

### Tenant owns:

* Branding configuration
* Customers
* Employees
* Promotions
* Loyalty programs
* Feature flags (within plan limits)
* Analytics data

### Tenant lifecycle:

**Target (this document):**

* Created by Superadmin
* Activates subscription plan
* Configures features
* Starts onboarding customers

**Current (Fase 0):** tenant is created when a **business owner registers** (`businessName` → new `Tenant` + `TenantMembership` role `owner`). Superadmin-created tenants and feature configuration are not implemented yet.

---

## 1.3 Users (Within a Tenant)

### Types:

#### Business Owner / Admin

* Full control over tenant configuration
* Manages employees, promotions, rewards, analytics

#### Employee

* Limited operational access
* Scans QR codes
* Registers purchases
* Redeems rewards

#### End Customer

* Uses mobile/web app
* Has QR identity
* Participates in loyalty programs
* Receives promotions and rewards

---

# 2. Multi-Tenant Isolation Strategy

Each tenant must have complete data separation.

### Rules:

* No cross-tenant data access
* Every query must include tenant context
* Tenant ID is required in all domain entities

### Suggested approach:

* Tenant ID in every table
* Middleware-based tenant resolution
* Future: Row Level Security (PostgreSQL recommended)

---

# 3. Feature Flag System

Features are controlled at two levels:

## 3.1 Global Feature Availability (Superadmin)

Superadmin defines which features exist in the system:

* loyalty
* promotions
* gamification
* referrals
* analytics
* coupons

---

## 3.2 Tenant Feature Activation

Each tenant can only enable features allowed by their plan.

Example (target shape — **not** in the database yet):

```ts
tenant.features = {
  loyalty: true,
  promotions: true,
  gamification: false,
  referrals: true,
  analytics: true,
};
```

---

# 4. Billing System

Billing is subscription-based per tenant.

## Key principles:

* Each tenant has exactly one active plan
* Plans define feature access
* Billing is managed externally (**Stripe recommended** for tenant subscriptions in this architecture)

> **Current repo:** user-level Google Play billing from the starter (`billing` context) is unrelated to per-tenant Stripe; replace or extend when implementing SaaS billing.

---

## Billing model:

* Monthly recurring subscription
* Optional yearly discount
* Upgrade/downgrade supported

---

## Plan controls:

* Feature availability
* Usage limits (future)
* Add-on modules

---

# 5. Subdomain Strategy

**Implementation detail:** [`teenant-resolution.md`](../teenant-resolution.md) (subdomain and middleware are target; Fase 0 uses JWT + `tenant_memberships`).

Each tenant is accessible via subdomain:

### Example:

```
tenant-a.app-domain.com
```

Future optional:

```
custom-domain.com (white-label)
```

---

# 6. System Principles

* Multi-tenant by design (not retrofitted)
* Feature flags over hardcoded logic
* Modular architecture
* Mobile-first (Capacitor)
* API-driven backend logic

---

# 7. Future Extensions

* Row Level Security (PostgreSQL)
* Event-driven architecture for loyalty actions
* White-label tenant domains
* Advanced segmentation engine
* AI-driven promotions
