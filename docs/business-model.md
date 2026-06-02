# Business Model

## Overview

The platform is a SaaS product that provides customer loyalty, engagement, and marketing tools for local businesses such as cafés, bakeries, and restaurants.

Revenue is based on recurring subscriptions plus optional add-ons.

**How to read this document:** it describes the **commercial model** (plans, add-ons, pricing strategy, segments, growth). Product capabilities and MVP scope: [`AGENTS.md`](../AGENTS.md) (section Product); technical enforcement (feature flags, billing integration): [`saas-architecture.md`](saas-architecture.md); domain rules: [`business-rules.md`](business-rules.md); **persistence (subscription_plans, subscriptions):** [`database/data-model.md`](database/data-model.md). For what is **billable or enforced in code today**, see [Implementation status](#implementation-status-current-repo).

---

## Implementation status (current repo)

| Area in this doc | Target | Implemented now | Notes |
|------------------|--------|-------------------|-------|
| Value proposition (retention, QR, promos, loyalty) | Core product | **No product features yet** | Fase 0: auth, tenant, owner `/home` placeholders («Próximamente») |
| Plans Basic / Pro / Premium (tenant) | Three SaaS tiers with feature sets | **No** | `Tenant.subscriptionPlan` is a free string (default `"basic"` in [`prisma/schema.prisma`](../prisma/schema.prisma)); no catalog, no UI, no feature gating |
| Add-ons (Gamification, Marketing, CRM, white-label) | Modular upsell | **No** | Not in schema or billing |
| Pricing strategy (amounts, tiers) | Commercial decisions | **No** | Document only; no prices in repo |
| Revenue: monthly subscriptions per tenant | Stripe (see saas-architecture) | **No** | No tenant checkout or subscription lifecycle |
| Revenue: add-ons per tenant | — | **No** | — |
| User-level plan (starter) | — | **Partial** | `User.subscriptionPlan`: `FREE` \| `PREMIUM` ([`UserPlan`](../src/contexts/identity/users/domain/UserPlan.ts)); Google Play demo in `billing` context — **not** the Basic/Pro/Premium tenant model below |
| Customer segments (cafés, bakeries, …) | GTM focus | **N/A (business)** | Aligns with product vision; no code impact |
| Growth / long-term vision | Strategy | **N/A (business)** | Roadmap text only |

**Conclusion:** sections 2–5 describe the **target monetization**. Do not implement plan limits or add-on SKUs from this file alone without a billing/feature-flag issue; today only `subscription_plan` columns exist without semantics.

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
