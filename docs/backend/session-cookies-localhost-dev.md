# 🎯 Backend: Session cookies on localhost without a Domain attribute

## 💡 Convention

In local development, the `session` JWT cookie must be **host-only**: never set `Domain=.localhost` or any other `Domain` attribute. Use `jsonWithSessionCookie` (or equivalent `Set-Cookie` header) from [`src/lib/auth/session.ts`](../../src/lib/auth/session.ts). Tenant staff log in at `/login` (apex or tenant subdomain); platform superadmin log in only at `/platform/login` on the **apex** host (`localhost`, not a business subdomain).

## 🏆 Benefits

- Browsers accept and persist the cookie; invalid `Domain` values cause silent rejection while the API still returns 200.
- Middleware (Edge) and route handlers read the same cookie name and `AUTH_SECRET`.
- Clear separation: platform session (`kind: platform`) vs tenant session (`kind: tenant`) and correct login URLs.
- Verifiable with `npm run verify:platform-login` and `npm run verify:owner-login` without a browser.

## 👀 Examples

### ✅ Good: Set-Cookie without Domain on apex localhost

```http
Set-Cookie: session=<jwt>; HttpOnly; Path=/; Max-Age=604800; SameSite=lax
```

```typescript
return jsonWithSessionCookie(authResponseToJson(user, tenant, session), token);
```

### ❌ Bad: Domain=.localhost on the session cookie

```http
Set-Cookie: session=<jwt>; HttpOnly; Path=/; Max-Age=604800; SameSite=lax; Domain=.localhost
```

The login response may be 200, but the browser drops the cookie; `/platform` or `/home` redirect back to login and the UI looks stuck.

### ✅ Good: Superadmin on apex only

| Role | URL | API |
|------|-----|-----|
| Superadmin | `http://localhost:3000/platform/login` | `POST /api/platform/auth/login` |
| Owner / staff | `http://localhost:3000/login` or `http://{slug}.localhost:3000/login` | `POST /api/auth/login` |

### ✅ Good: Owner session can open `/platform/login` to switch to superadmin

The middleware must not redirect `/platform/login` to `/home` when only a tenant cookie exists; otherwise owners never reach the superadmin form.

### ❌ Bad: Superadmin on tenant `/login` or owner on `/platform/login`

`POST /api/auth/login` with a platform superadmin account → **403** `PlatformUserCannotUseTenantLogin`.  
`POST /api/platform/auth/login` on a business subdomain host → **403** (apex only).

### ✅ Good: Post-login navigation respects host-only cookies

On apex `localhost`, after tenant login stay on the same host (`/home`). Redirect to `{slug}.localhost` only when the user is already on a subdomain host (not from bare `localhost`), so the session cookie is not lost.

### ❌ Bad: Login on apex then redirect to another localhost host

```text
POST http://localhost:3000/api/auth/login → 200
→ window.location = http://la-chismosa.localhost:3000/home
```

The cookie was set for `localhost`; `la-chismosa.localhost` does not receive it → **401** on `/api/me` and redirect to `/login`.

## 🧐 Real world examples

- [`src/lib/auth/session.ts`](../../src/lib/auth/session.ts) — `buildSessionCookie`, `jsonWithSessionCookie`.
- [`src/app/api/auth/login/route.ts`](../../src/app/api/auth/login/route.ts) — tenant staff login.
- [`src/app/api/platform/auth/login/route.ts`](../../src/app/api/platform/auth/login/route.ts) — platform login (rejects resolved tenant host).
- [`src/app/_components/LoginForm.tsx`](../../src/app/_components/LoginForm.tsx) — `navigateAfterAuth` (no apex → subdomain redirect).
- [`src/app/_components/PlatformLoginForm.tsx`](../../src/app/_components/PlatformLoginForm.tsx) — redirect to `/platform` with `credentials: "include"`.
- [`src/middleware.ts`](../../src/middleware.ts) — session guards for `/home`, `/profile`, `/platform/*`.
- [`scripts/verify-platform-login-flow.ts`](../../scripts/verify-platform-login-flow.ts), [`scripts/verify-platform-isolation.ts`](../../scripts/verify-platform-isolation.ts), [`scripts/verify-owner-login-flow.ts`](../../scripts/verify-owner-login-flow.ts).

## ☝️ Exceptional cases: When to not take into account this convention

- **Production** with a real apex domain: cookie `Domain` may be configured later for subdomains (e.g. `.app.example.com`) following browser and security rules; do not copy `Domain=.localhost` from dev.
- **Capacitor / native WebView**: origins like `capacitor://localhost` are listed in middleware CORS; cookie rules follow the WebView host, not `*.localhost`.

### 🥽 Example of exceptional case

Staging on `app.staging.example.com` and tenants on `{slug}.app.staging.example.com` may use a shared registrable domain cookie policy designed for that environment — not the localhost host-only rule.

## Production (apex + tenant subdomains)

When `NODE_ENV=production` and `APP_DOMAIN` is set (e.g. `platform.example.com`):

1. **Session cookie** — `Set-Cookie` includes `Domain=.platform.example.com` and `Secure` (auto from `APP_DOMAIN`, or override with `SESSION_COOKIE_DOMAIN`).
2. **Post-login redirect** — [`resolveTenantHomeUrl`](../../src/lib/tenant/resolveTenantHomeUrl.ts): login on apex → `{slug}.platform.example.com/home` (session survives on shared domain).
3. **Required env** — `APP_DOMAIN`, `NEXT_PUBLIC_APP_DOMAIN` (same value), `AUTH_SECRET`, `DATABASE_URL`. Boot warns via [`instrumentation.ts`](../../src/instrumentation.ts) if missing.

Verify: `npm run verify:session-cookie-prod`.

Localhost behavior unchanged: no `Domain` on cookie; apex stays on `/home` after login.

## 🔗 Related agreements

- [Tenant resolution (subdomain, JWT, login scope)](../teenant-resolution.md).
- [SaaS architecture (roles, route groups, issue #8 superadmin foundation)](../domain/saas-architecture.md).
- [API routes reflect-metadata](./api-routes-reflect-metadata.md).
