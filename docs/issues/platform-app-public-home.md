## Objetivo

Pantalla **home pública de la app** con tres entradas (Registrarse · Registrar negocio · Iniciar sesión) y formularios de registro/login conectados al auth unificado (`kind: user`).

## Contexto

- Spec: [`customer-platform-app.md`](../domain/customer-platform-app.md) — § Home de la app, § Flujos A y C.
- Depende de: **platform-app-unified-auth** (API + sesión `kind: user`).
- Rutas target en apex o route group `(mobile)` reutilizable en Capacitor.

## Alcance

| In | Fuera |
|----|-------|
| Route group / layout app móvil (mobile-first, tokens theme) | Google OAuth (issue Capacitor) |
| `/` pública: CTAs Registrarse, Registrar negocio, link Login | Dashboard autenticado (issue dashboard) |
| `/register` — email/password → redirect `/home` | Paso 2 crear negocio (issue register-business) |
| `/login` — email/password → redirect `/home` | Capacitor build |
| Middleware: rutas públicas vs `/home` requiere `kind: user` | Rediseño web `(auth)` existente |
| Mensajes de error UX (email en uso, credenciales inválidas) | Magic link / verificación email |

## Criterios de aceptación

- [ ] Home muestra logo, botón **Registrarse**, botón **Registrar negocio**, enlace **Iniciar sesión**.
- [ ] Registrarse crea cuenta y lleva a `/home` autenticado.
- [ ] Login lleva a `/home` con sesión válida.
- [ ] **Registrar negocio** navega a `/register/business` (auth gate en issue siguiente).
- [ ] Usuario no autenticado en `/home` → redirect login.
- [ ] UI usa tokens theme (sin colores hardcodeados).
- [ ] Smoke manual en `localhost:3000` apex (o ruta acordada).

## Capas / archivos principales

- `src/app/(mobile)/` o `(platform-app)/` — layout + pages
- `src/app/(mobile)/page.tsx` — home pública
- `src/app/(mobile)/register/page.tsx`, `login/page.tsx`
- `src/middleware.ts` — guards `kind: user`
- Componentes UI reutilizando `AppShell`, `Button`, `Card`

## Issues relacionadas

- Depende de: `platform-app-unified-auth.md`
- Siguiente: `platform-app-register-business.md`, `platform-app-unified-dashboard.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md)
- [`style-guidelines.md`](../frontend/style-guidelines.md)
