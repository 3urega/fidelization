# Servicios externos — claves y variables de entorno

Guía rápida de qué credenciales necesitas fuera del repo para **Google Sign-In**, **Stripe** y **Geocoding**, y cómo configurarlas en `.env`.

Referencia de plantilla: [`.env.example`](../../.env.example). Acceso tipado en servidor: [`src/lib/env.ts`](../../src/lib/env.ts).

---

## Resumen: qué es obligatorio en local

| Variable / servicio | ¿Obligatorio en dev? | Para qué |
|---------------------|----------------------|----------|
| `AUTH_SECRET` | **Sí** | Sesiones JWT (login owner, user, customer…) |
| `DATABASE_URL` | **Sí** (E2E, Prisma) | Postgres |
| `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Botón «Continuar con Google» en la app personal |
| `STRIPE_*` | No | Checkout Pro/Premium y webhooks de suscripción |
| `MAPBOX_ACCESS_TOKEN` / `GOOGLE_MAPS_GEOCODING_API_KEY` | No | Geocoding al guardar dirección del negocio (Phase Q) |
| `DISABLE_TENANT_PLAN_GATES=1` | No | Dev/staging: promociones Pro+, límites empleados, etc. sin asignar plan (ignorado en producción) |

Sin Google ni Stripe la app arranca y puedes usar registro/login por email, plan Basic gratis y el resto del MVP.

---

## Google Sign-In (OAuth)

### Qué necesitas

1. Cuenta en [Google Cloud Console](https://console.cloud.google.com/).
2. Proyecto con **OAuth consent screen** configurada (tipo External en dev; usuarios de prueba si la app está en modo Testing).
3. Credencial **OAuth 2.0 Client ID** de tipo **Web application**.

No hace falta una «API key» genérica de Google Maps/Cloud: el login usa **Client ID** (OAuth), no una API key REST.

### Variables en `.env`

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

| Variable | Dónde se usa |
|----------|----------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Navegador — botón Google Identity Services (GIS) en `/`, `/login`, `/register` |
| `GOOGLE_CLIENT_ID` | Servidor — `POST /api/auth/oauth/google` valida el `id_token` con Google |

Usa **el mismo Client ID** en ambas (el público debe ser el de tipo Web).

Opcional (solo CI/E2E manual):

```env
GOOGLE_OAUTH_E2E_ID_TOKEN=eyJhbG...
```

### Configuración en Google Cloud

En la credencial Web, añade en **Authorized JavaScript origins**:

- `http://localhost:3000` (dev)
- `https://tu-dominio.com` (producción)

El flujo actual (GIS → `credential` → API) **no** requiere redirect URI clásico; basta con origins correctos.

### Comportamiento si no está configurado

- Los botones de Google **no se muestran** (el formulario email/contraseña sigue funcionando).
- `POST /api/auth/oauth/google` responde **503** si falta `GOOGLE_CLIENT_ID`.

### Verificación

```bash
npm run verify:platform-app-google-oauth
npm run verify:platform-app-google-oauth-use-case
```

---

## Stripe (Checkout y suscripciones tenant)

### Qué necesitas

1. Cuenta en [Stripe Dashboard](https://dashboard.stripe.com/) (modo **Test** en desarrollo).
2. **Secret key** de la API (empieza por `sk_test_…`).
3. Dos **Products / Prices** recurrentes mensuales (Pro y Premium) — copia los **Price IDs** (`price_…`).
4. **Webhook signing secret** para validar eventos en `POST /api/webhooks/stripe`.

### Variables en `.env`

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
```

| Variable | Para qué |
|----------|----------|
| `STRIPE_SECRET_KEY` | Crear sesiones Checkout (`POST /api/billing/checkout`) y llamadas server-side |
| `STRIPE_WEBHOOK_SECRET` | Verificar firma de webhooks (`checkout.session.completed`, `invoice.paid`, etc.) |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID del plan Pro en Stripe |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Price ID del plan Premium en Stripe |

### Qué plan usa Stripe

| Plan SaaS | Flujo en la app |
|-----------|-----------------|
| **Basic** (gratis) | `PATCH /api/billing/tenant-plan` — **no** pasa por Stripe |
| **Pro / Premium** | `POST /api/billing/checkout` → redirect a Stripe Checkout |

### Webhooks en local

Instala [Stripe CLI](https://stripe.com/docs/stripe-cli) y reenvía eventos al dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

La CLI imprime un `whsec_…` — úsalo como `STRIPE_WEBHOOK_SECRET` mientras desarrollas.

Eventos útiles para probar:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger invoice.paid
```

### Comportamiento si no está configurado

- Plan **Basic** y resto de la app: sin impacto.
- Elegir **Pro/Premium** en `/onboarding/plan` fallará al iniciar checkout si faltan `STRIPE_SECRET_KEY` o los Price IDs.

### Verificación

```bash
npm run verify:stripe-checkout-use-case
npm run verify:stripe-webhook-checkout-use-case
npm run verify:stripe-webhooks-use-case
npm run verify:onboarding-plan-selection   # E2E con dev server + DATABASE_URL
```

---

## Geocoding (Mapbox / Google Maps)

Convierte la **dirección del negocio** en coordenadas al guardar el perfil (`PATCH /api/tenant/profile`) y alimenta el **mapa estático** del owner (`GET /api/tenant/geocoding-map-preview`, proxy server-side). En la app personal, **suggest en vivo** de zona de búsqueda usa el mismo provider (`GET /api/user/search-zone/suggest`). En dev se usa **Mapbox** por defecto; el adaptador **Google** está listo para producción.

### Variables en `.env`

```env
GEOCODING_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ...
# GOOGLE_MAPS_GEOCODING_API_KEY=AIza...
```

| Variable | Para qué |
|----------|----------|
| `GEOCODING_PROVIDER` | `mapbox` (default) o `google` — selecciona el adaptador activo en servidor |
| `MAPBOX_ACCESS_TOKEN` | Token **secreto** de Mapbox (Geocoding API v5 + Static Images en perfil owner) |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | API key con Geocoding API, Static Maps y **Places API** (Autocomplete + Place Details para suggest en zona usuario) |

### Mapbox (recomendado en dev)

1. Cuenta en [Mapbox](https://account.mapbox.com/).
2. Crear un **secret access token** con scope de Geocoding (Static Images usa el mismo token en servidor).
3. Pegar en `MAPBOX_ACCESS_TOKEN`.

### Google Maps (prod o alternativa)

1. [Google Cloud Console](https://console.cloud.google.com/) → habilitar **Geocoding API**, **Maps Static API** y **Places API**.
2. Crear **API key** restringida (IP servidor / referrers según despliegue).
3. `GEOCODING_PROVIDER=google` + `GOOGLE_MAPS_GEOCODING_API_KEY`.

### Comportamiento si no está configurado

- La app **arranca** sin tokens.
- Al geocodificar (Q2+), el gateway activo lanza `GeocodingNotConfigured` si falta la clave del proveedor seleccionado.

### Verificación

```bash
npm run verify:geocoding-gateway-use-case
npm run verify:search-zone-place-suggest-use-case
npm run verify:search-zone-place-suggest
npm run verify:tenant-geocoding-map-preview
npm run verify:tenant-geocoding-profile-feedback
```

---

## Checklist `.env` mínimo para probar todo

```env
# Core
AUTH_SECRET=una-cadena-larga-aleatoria-min-16
DATABASE_URL=postgresql://...
APP_DOMAIN=localhost
NEXT_PUBLIC_APP_DOMAIN=localhost
NEXT_PUBLIC_API_URL=http://localhost:3000

# Google (opcional)
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com

# Stripe (opcional — solo checkout Pro/Premium)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...

# Geocoding (opcional — Q2+ al guardar dirección del negocio)
GEOCODING_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ...
```

Copia `.env.example` → `.env` y sustituye los placeholders.

---

## Relacionado

- Planes comerciales: [`docs/domain/business-model.md`](../domain/business-model.md)
- Onboarding owner + checkout: [`docs/domain/business-onboarding.md`](../domain/business-onboarding.md)
- App personal + Google OAuth (#45): [`docs/domain/customer-platform-app.md`](../domain/customer-platform-app.md)
- Comandos verify: sección **Useful commands** en [`AGENTS.md`](../../AGENTS.md)
