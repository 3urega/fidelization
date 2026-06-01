# Domain: Loyalty SaaS for Cafés and Small Hospitality Businesses

## Project Vision

The goal of this project is to create a SaaS platform focused on customer loyalty and retention for cafés and small hospitality businesses.

The platform must be generic, configurable, and easily adaptable to different types of businesses without requiring custom development.

Although the initial target market is cafés, the architecture must support:

* Cafés
* Bakeries
* Ice cream shops
* Bars
* Restaurants
* Food trucks
* Small local businesses

The product should allow multiple businesses to use the same platform while maintaining complete separation of data, branding, promotions, and customers.

The system must be designed as a multi-tenant SaaS from day one.

---

# Core Business Concept

Businesses subscribe to a monthly plan and gain access to a loyalty platform that helps them:

* Increase customer retention
* Increase repeat visits
* Launch promotions
* Reward loyal customers
* Communicate with customers through notifications
* Analyze customer activity

The platform must be simple enough for non-technical business owners.

---

# Multi-Tenant Architecture

Each business is a tenant.

A tenant has:

* Name
* Logo
* Brand colors
* Subscription plan
* Promotions
* Loyalty settings
* Customers
* Employees
* Statistics

Data must always be isolated between tenants.

No tenant should have access to another tenant's information.

---

# User Types

## Platform Administrator

Manages the SaaS platform.

Can:

* Manage tenants
* Manage subscription plans
* View global metrics
* Manage feature flags
* Manage billing

---

## Business Owner

Manages a specific business.

Can:

* Configure branding
* Configure promotions
* Manage employees
* View customer activity
* View statistics
* Configure loyalty programs
* Send notifications

---

## Employee

Staff member of a business.

Can:

* Scan customer QR codes
* Register purchases
* Assign points
* Redeem rewards

Must have limited permissions.

---

## Customer

End user of the mobile application.

Can:

* Register
* Login
* View points
* View rewards
* View promotions
* Redeem rewards
* Show personal QR code
* Receive notifications

---

# Loyalty System

The loyalty system is the heart of the platform.

Businesses must be able to enable or disable different loyalty mechanisms.

## Points System

Customers earn points based on purchases.

Example:

* 1€ spent = 1 point

Points can later be exchanged for rewards.

Configurable per tenant.

---

## Stamp Card System

Digital version of traditional loyalty cards.

Examples:

* Buy 10 coffees, get 1 free.
* Buy 5 breakfasts, get 1 free.

Businesses can create multiple stamp campaigns.

Configurable per tenant.

---

## Rewards System

Businesses can define rewards.

Examples:

* Free coffee
* Free pastry
* 10% discount
* Free breakfast

Rewards can require:

* Points
* Stamps
* Promotional coupons

---

## Referral Program

Optional feature.

Customers can invite friends.

Rewards can be granted when:

* Friend registers
* Friend makes first purchase

Must be configurable.

---

# QR-Based Workflow

The QR system is a key feature.

Each customer has a unique QR code.

The QR code identifies the customer.

Typical workflow:

1. Customer opens the app.
2. Customer shows QR code.
3. Employee scans QR code.
4. System identifies customer.
5. Employee registers purchase.
6. Points or stamps are automatically assigned.

Benefits:

* Fast
* Simple
* No physical cards
* No POS integration required

The QR system should be available from the first version.

---

# Promotions System

Businesses must be able to create and manage promotions.

Examples:

* Happy Hour
* Coffee + Croissant Combo
* Birthday Discount
* Weekend Promotion
* Seasonal Promotion

Each promotion can be:

* Active
* Inactive

Promotions can have:

* Start date
* End date
* Usage limits
* Customer restrictions

Businesses must be able to enable or disable promotions without requiring deployments.

---

# Coupons

Businesses can create digital coupons.

Examples:

* 10% discount
* Free coffee
* Free pastry

Coupons may be:

* Public
* Private
* Generated automatically
* Generated from promotions

Customers can redeem coupons directly in the app.

---

# Push Notifications

Push notifications are a major engagement tool.

Businesses can send notifications to customers.

Examples:

* New promotion
* Limited-time offer
* Reward available
* Birthday reward
* Loyalty reminder

Examples:

"Only 2 coffees left until your free reward."

"Happy Hour starts at 17:00."

"You have earned a free coffee."

Notifications should support audience segmentation in future versions.

---

# Mobile Application

Built with:

* Next.js
* Capacitor

Single codebase for:

* Web
* Android
* iOS

The application should be mobile-first.

Offline-friendly behavior should be considered when possible.

---

# SaaS Subscription Plans

The platform operates using recurring subscriptions.

Example plans:

## Basic

* QR loyalty
* Stamp cards
* Limited customers
* Basic statistics

---

## Pro

* Unlimited customers
* Push notifications
* Coupons
* Advanced loyalty programs
* Detailed statistics

---

## Premium

* White label options
* Custom branding
* Priority support
* Advanced analytics
* Future integrations

---

# Feature Flags

The platform must support enabling or disabling features per tenant.

Examples:

* Points system
* Stamp cards
* Referrals
* Coupons
* Notifications
* Rewards
* Analytics

Feature flags are essential for plan management.

---

# Analytics

Businesses should have access to statistics.

Examples:

* Active customers
* Total customers
* Visits per customer
* Points issued
* Rewards redeemed
* Promotion performance

The analytics system should be expandable.

---

# Future Integrations

Not required for MVP.

Potential future integrations:

* POS systems
* Payment providers
* Digital wallets
* Apple Wallet
* Google Wallet
* Marketing platforms
* CRM systems

These integrations should not influence the initial architecture.

---

# MVP Priorities

The first version should focus on:

1. Multi-tenant architecture
2. Authentication
3. Customer profiles
4. QR system
5. Stamp card loyalty
6. Points system
7. Rewards
8. Promotions
9. Coupons
10. Push notifications
11. Subscription plans
12. Basic analytics

Everything else is secondary.

The main objective is to launch quickly with a simple but complete loyalty platform that can be sold as a recurring SaaS to cafés and small hospitality businesses.
