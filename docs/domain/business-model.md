# Business Model

## Overview

The platform is a SaaS product that provides customer loyalty, engagement, and marketing tools for local businesses such as cafés, bakeries, and restaurants.

Revenue is based on recurring subscriptions plus optional add-ons.

**How to read this document:** it describes the **commercial model** (plans, add-ons, pricing strategy, segments, growth). Product capabilities and MVP scope: [`AGENTS.md`](../../AGENTS.md) (section Product); technical enforcement (feature flags, billing integration): [`saas-architecture.md`](saas-architecture.md); domain rules: [`business-rules.md`](../business-rules.md); **persistence (subscription_plans, subscriptions):** [`database/data-model.md`](../database/data-model.md). For what is **billable or enforced in code today**, see [Implementation status](#implementation-status-current-repo).

---

## Implementation status (current repo)

| Area in this doc | Target | Implemented now | Notes |
|------------------|--------|-------------------|-------|
| Value proposition (retention, QR, promos, loyalty) | Core product | **Partial** | Loyalty MVP (QR, sellos, puntos, rewards, employees); promociones API placeholder gated |
| Plans Basic / Pro / Premium (tenant) | Three SaaS tiers with feature sets | **Partial** | Catálogo + checkout (#30–#32); **feature gating enforced** (#34): `AssertTenantPlanFeature`, employee limits, `GET /api/loyalty/promotions` Pro+ |
| Add-ons (Gamification, Marketing, CRM, white-label) | Modular upsell | **No** | Premium flags exist in JSON; no add-on SKUs or separate billing |
| Pricing strategy (amounts, tiers) | Commercial decisions | **Partial** | Seed prices (0 / 29€ / 59€); Stripe Checkout for paid plans |
| Revenue: monthly subscriptions per tenant | Stripe (see saas-architecture) | **Partial** | Checkout + webhooks lifecycle (#32–#33); no Customer Portal |
| Revenue: add-ons per tenant | — | **No** | — |
| User-level plan (starter) | — | **Partial** | `User.subscriptionPlan`: `FREE` \| `PREMIUM` — **not** tenant Basic/Pro/Premium |
| Customer segments (cafés, bakeries, …) | GTM focus | **N/A (business)** | Aligns with product vision |
| Growth / long-term vision | Strategy | **N/A (business)** | Roadmap text only |

### Plan feature matrix (enforced in code — #34)

| Feature key | Basic | Pro | Premium | Enforced on |
|-------------|-------|-----|---------|-------------|
| stamps, points | yes | yes | yes | Not gated (Basic regression) |
| promotions | no | yes | yes | `GET /api/loyalty/promotions` |
| coupons, push, analytics | no | yes | yes | Flags in plan JSON; APIs TBD |
| gamification, referrals | no | no | yes | Flags in plan JSON; APIs TBD |
| `limits.employees` | 3 | 10 | 50 | `InviteTenantEmployee` |

**Conclusion:** tenant plan **features and employee limits** are enforced via `ResolveTenantSubscriptionPlan` + guards. Remaining commercial items (add-ons, usage metering) are still target-only.

---

# 1. Core Value Proposition

Help local businesses:

* Increase customer retention
* Increase visit frequency
* Create automated loyalty systems
* Run promotions easily
* Engage customers via QR and mobile app

---

# 2. Subscription Plans

> **Target catalog.** Not enforced in application code yet. Tenant field `subscription_plan` defaults to `"basic"` at registration; mapping to features below is future work.

## 2.1 Basic Plan

Entry-level plan for small businesses.

### Includes:

* QR-based loyalty system
* Basic stamp cards
* Simple promotions
* Limited analytics

### Target:

* Small cafés
* Single-location businesses

---

## 2.2 Pro Plan

Most common plan.

### Includes:

* Everything in Basic
* Advanced promotions
* Coupons system
* Push notifications
* Customer segmentation (basic analytics)
* Limited gamification modules

### Target:

* Growing cafés and restaurants
* Multi-employee businesses

---

## 2.3 Premium Plan

High-end plan for advanced businesses.

### Includes:

* Everything in Pro
* Full gamification system
* Advanced analytics dashboard
* Referral system
* Priority support
* White-label options (future-ready)

---

# 3. Add-ons (Revenue Expansion Layer)

> **Target.** No add-on products or billing hooks in the repo.

Add-ons allow modular monetization.

## Examples:

### Gamification Pack

* Scratch cards
* Spin-to-win
* Daily rewards
* Challenges

---

### Marketing Pack

* Automated campaigns
* Advanced segmentation
* Scheduled promotions

---

### CRM Lite Pack

* Customer tagging
* Visit history insights
* Behavior tracking

---

### White-label Pack (future)

* Custom domain
* Full branding control
* Remove platform branding

---

# 4. Pricing Strategy

## Principles:

* Low entry barrier
* Easy upgrade path
* Value-based pricing
* Modular expansion via add-ons

---

## Strategy:

* Start with affordable Basic plan
* Push Pro as default recommendation
* Premium for high-value customers
* Add-ons for incremental revenue

---

# 5. Revenue Model

Primary revenue sources:

1. Monthly subscriptions (**per tenant** — target)
2. Add-ons per tenant
3. Future usage-based features (advanced analytics, messaging, etc.)

**Current codebase:** none of the above are live. The starter exposes **per-user** Google Play verification (`src/contexts/billing/`) for `FREE`/`PREMIUM` on `User`, which must not be confused with tenant plans Basic/Pro/Premium.

---

# 6. Customer Segments

## Primary:

* Cafés
* Bakeries
* Small restaurants

## Secondary:

* Bars
* Food trucks
* Local retail shops

---

# 7. Growth Strategy

* Start with single-location cafés
* Expand to small chains
* Introduce white-label for agencies
* Expand into broader “local commerce engagement platform”

---

# 8. Long-Term Vision

The platform evolves from:

> Loyalty tool

to:

> Full customer engagement OS for local businesses
