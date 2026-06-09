## Objetivo

Cerrar Phase G con **Google OAuth**, shell **Capacitor** (build Android/iOS), deep links `join/{slug}`, y verify E2E del flujo completo app multi-establecimiento.

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Registro Google, Capacitor.
- Depende de: todas las issues anteriores del batch `platform-app`.
- Env: credenciales Google OAuth; `npm run build:capacitor` existente en AGENTS.md.

## Alcance

| In | Fuera |
|----|-------|
| Google Sign-In → `POST /api/auth/oauth/google` (register or login) | Apple Sign-In |
| Botones «Continuar con Google» en register/login/home | Publicación App Store / Play Store |
| Capacitor config + deep link `fidelization://join/{slug}` | Push notifications |
| Build `out/` + `cap sync` documentado en AGENTS | Rediseño completo web |
| `verify:platform-app-e2e` — register email → join 2 tenants → dashboard → detail → scan | Claim perfiles huérfanos |

## Criterios de aceptación

- [ ] Google OAuth crea o vincula `users` con `oauth_provider`/`oauth_subject`.
- [ ] Sesión `kind: user` tras OAuth igual que email.
- [ ] Deep link join abre app y ejecuta join flow.
- [ ] `npm run build:capacitor` exitoso con rutas `(mobile)`.
- [ ] `npm run verify:platform-app-e2e` pasa (dev + DATABASE_URL + OAuth mock o skip documentado).
- [ ] Docs: `AGENTS.md`, `customer-platform-app.md` marcados con verify commands.

## Capas / archivos principales

- `src/contexts/identity/` — Google OAuth handler
- `src/app/api/auth/oauth/google/route.ts`
- `capacitor.config.ts`, `android/`, deep link intent filters
- `scripts/verify-platform-app-e2e.ts`
- `AGENTS.md`, `.env.example` — `GOOGLE_CLIENT_ID`, etc.

## Issues relacionadas

- Cierra batch: depende de todas las issues `platform-app-*` previas.

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`build:capacitor`](../../package.json)
- [session-cookies-localhost-dev.md](../backend/session-cookies-localhost-dev.md) — Capacitor origins
