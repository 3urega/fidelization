# Issue draft: Customer QR session (web-first, optional app later)

Use with:

```bash
gh auth login
gh issue create --repo 3urega/fidelization --title "Customer QR session — web-first loyalty card (/app)" --body-file docs/issues/customer-qr-session-web-first.md
```

---

## Summary

End-customer loyalty entry **without password** and **without installing the app**: mobile-friendly web at `{tenant}.domain/app`, tenant resolved from subdomain, customer row in `customers` with `qrValue` generated on first signup, JWT `kind: customer`, minimal card UI (name, points, QR to show staff).

Same codebase later wraps in Capacitor; web session is the baseline.

## Product answers (scope)

### If the customer has not downloaded the app

They use the **webapp** in the browser (Chrome/Safari on the phone). No install required for MVP:

1. Open link from the business (QR poster, WhatsApp, NFC): `https://{slug}.domain/app`
2. First visit: short signup (name; email/phone optional) → **create `customers` + generate `qrValue` immediately**
3. Show **loyalty card** with QR on screen (staff scans or visual check)
4. Cookie/session persists on that browser for return visits

### Web now, app later

| Channel | MVP (this issue) | Later |
|---------|------------------|--------|
| Mobile browser `/app` | Signup, card, show QR, points | PWA install prompt optional |
| Capacitor Android/iOS | Same routes, same API | Push, camera scan, offline polish |

Do **not** require app install for registration or to obtain QR.

## Objective

- Third session kind: `customer` (not `users`, not `/login` staff flow)
- Subdomain-only (tenant host required)
- Block suspended tenants
- Isolate from platform/staff APIs and shells

## Acceptance criteria

- [ ] `POST /api/loyalty/auth/qr` — existing customer by `code` / `qrValue` on resolved tenant
- [ ] `POST /api/loyalty/customers/register` (or combined flow) — **new customer**: save row + **server-generated unique `qrValue`**
- [ ] `GET /api/loyalty/me` — profile for customer session only
- [ ] Route group `(loyalty)`: `/app/welcome` (signup), `/app/enter?code=` (returning), `/app/card` (QR + balance)
- [ ] Middleware: `/app/*` requires tenant host; `/app/card` requires `kind: customer`; staff/platform cookies redirected appropriately
- [ ] Tenant `status: suspended` → no customer session
- [ ] `npm run verify:customer-qr-session` (seed `demo-qr-cafe-demo` + optional new signup path)
- [ ] Docs: `AGENTS.md` + short note in `saas-architecture.md`

## Out of scope

- Employee scan → `LoyaltyTransaction` (follow-up issue)
- Stamps, rewards, promos UI
- Push notifications
- Capacitor build (reuse routes only documented)

## Vertical slices

| Slice | User-visible value |
|-------|-------------------|
| VS1 | `CustomerSessionClaims` + `AuthenticateCustomerByQr` + register customer + `qrValue` generation |
| VS2 | `/api/loyalty/me` + `requireCustomerSession` |
| VS3 | `/app/welcome` + `/app/card` + middleware |
| VS4 | QR render on card (library or SVG from `qrValue`) |
| VS5 | verify script + docs |

## Technical notes

- Reuse [`CustomerRepository`](../../src/contexts/loyalty/customers/domain/CustomerRepository.ts) (`save`, `searchByQrValue`)
- `qrValue`: cryptographically random string (e.g. UUID), unique globally per schema
- Cookie: host-only on tenant subdomain ([`session-cookies-localhost-dev.md`](../backend/session-cookies-localhost-dev.md))
- Demo: `http://cafe-demo.localhost:3000/app` after seed; new user via welcome form

## Depends on

- #8 / #9 (platform) — done
- `APP_DOMAIN`, tenant resolution, `customers` table migrated
