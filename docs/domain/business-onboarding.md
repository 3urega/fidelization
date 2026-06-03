# Business Onboarding

## Overview

Business Onboarding defines how a business owner discovers the platform, creates an account, subscribes to a plan, and gains access to their business dashboard.

This is the primary acquisition flow of the platform and should be optimized for simplicity, conversion, and minimal setup time.

The goal is that a new business can start using the platform in less than 5 minutes.

---

# Core Principles

## Self-Service First

Businesses should be able to:

* Register independently
* Create their own business
* Select a subscription plan
* Configure their loyalty program
* Start using the platform immediately

Without requiring intervention from a Superadmin.

---

## Guided Setup

The onboarding process should be presented as a wizard with progressive steps.

The business owner should never be overwhelmed by configuration options.

---

## Fast Time To Value

The onboarding should focus on getting the business operational as quickly as possible.

Advanced configuration can be completed later.

---

# User Types

## Business Owner

The person responsible for the business.

During onboarding, this user becomes:

* Tenant Owner
* First Admin User
* Subscription Owner

---

# Onboarding Flow

## Step 1 - Registration

User accesses:

```text
/register/business
```

**Implemented (issues #11–#12):** public page at `/register/business` with name, email, password and confirm password. `POST /api/auth/register/business` uses [`RegisterBusinessOwnerUser`](../../src/contexts/tenants/owners/application/register/RegisterBusinessOwnerUser.ts) → persists `users` only (bcrypt hash, unique email), responds with `intendedRole: "owner"`. No `tenant_memberships` row yet — effective owner role is assigned in Step 2 (#13). No session cookie. Legacy `/register` redirects here.

Required fields:

* Full Name
* Email
* Password

Validation:

* Email must be unique
* Password must meet security requirements

Result:

A user account is created.

Role:

```text
owner
```

---

## Step 2 - Business Creation

User accesses:

```text
/register/business/tenant
```

**Implemented (issues #13, #15):** wizard step 2 after onboarding session (`kind: onboarding` cookie from step 1). Form: business name + business type (`cafe`, `bakery`, `restaurant`, `bar`, `retail`). Live subdomain preview (`{slug}.{NEXT_PUBLIC_APP_DOMAIN}`) via [`formatTenantHost`](../../src/lib/tenant/formatTenantHost.ts) + [`slugifyBusinessName`](../../src/lib/tenant/slugifyBusinessName.ts); final host shown after create. Draft in `sessionStorage` (`onboarding:business-draft`). `POST /api/auth/register/business/tenant` via [`CreateOwnerBusiness`](../../src/contexts/tenants/owners/application/create/CreateOwnerBusiness.ts) creates `tenants` + `tenant_memberships` (`owner`), persists `business_type`, upgrades JWT to `kind: tenant` → `/home` (apex on localhost; cookies host-only). `verify:business-onboarding`, `verify:format-tenant-host`.

Required fields:

* Business Name
* Business Type

Examples:

* Café
* Bakery
* Restaurant
* Bar
* Retail Shop

Optional:

* Logo
* Phone Number

System generates:

* Tenant
* Slug
* Subdomain (host `{slug}.{APP_DOMAIN}`; preview in wizard when `NEXT_PUBLIC_APP_DOMAIN` is set)

Example:

```text
coffee-house.platform.com
```

**Implemented (issue #15):** subdomain derived from slug; visible in step 2 UI before and after tenant creation.

---

## Step 3 - Plan Selection

The business selects a subscription plan.

Available plans:

* Basic
* Pro
* Premium

Each plan defines:

* Available features
* Limits
* Pricing

---

## Step 4 - Subscription Checkout

User completes payment.

Recommended provider:

* Stripe

Supported billing cycles:

* Monthly
* Yearly

Result:

Subscription becomes active.

---

## Step 5 - Initial Business Setup

The platform guides the user through essential configuration.

### Branding

* Logo
* Primary Color
* Secondary Color

### Loyalty Program

Choose initial loyalty model:

* Points System
* Stamp Card
* Both

---

## Step 6 - Welcome Dashboard

The user reaches their tenant dashboard.

Initial checklist:

* Complete branding
* Create first reward
* Generate first QR code
* Invite employees

---

# Trial Strategy

## Optional Free Trial

Recommended:

```text
14 days free trial
```

Benefits:

* Lower friction
* Faster conversions

Trial tenant status:

```text
trial
```

After expiration:

* Upgrade required
* Access restricted until payment

---

# Tenant Creation Process

The following entities are created automatically:

## User

```text
role = owner
```

---

## Tenant

```text
status = active
```

or

```text
status = trial
```

---

## Subscription

```text
plan = selected_plan
```

---

## Branding Configuration

Default branding values.

---

## Feature Flags

Features enabled according to plan.

---

# Alternative Acquisition Flows

## Superadmin-Created Business

Used for:

* Sales demos
* Enterprise customers
* Manual onboarding

Flow:

Superadmin creates:

* Tenant
* Owner User

Owner receives invitation email.

---

# Future Enhancements

## Social Login

Supported providers:

* Google
* Apple

---

## Invitation-Based Team Creation

Business owners can invite:

* Managers
* Employees

---

## White-Label Onboarding

Future support for:

* Custom domains
* Agency-managed businesses

---

# Success Criteria

A business owner should be able to:

1. Register
2. Create a business
3. Select a plan
4. Complete payment
5. Configure branding
6. Launch a loyalty program

In a single onboarding session without assistance from a Superadmin.
