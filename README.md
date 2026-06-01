# Next.js + Capacitor starter

Plantilla para apps **web + Android** con backend Next.js (hexagonal / DDD), auth JWT, billing Google Play de ejemplo y código legacy RAG como referencia.

## Requisitos

- Node.js 18+
- Docker Compose v2

## Quick start (starter activo)

```bash
npm install
cp .env.example .env.local
# Edita AUTH_SECRET (mín. 16 caracteres) y opcionalmente ALLOW_DEMO_BILLING=1

docker compose up -d
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Usuario demo

- Email: `demo@starter.local`
- En login: botón **Entrar como demo** (no requiere contraseña)
- Requiere Postgres con seed (`databases/1-starter.sql` en el primer arranque del volumen)

### Flujos de ejemplo

| Ruta | Uso |
|------|-----|
| `/` | Landing del starter |
| `/register` | Registro email + contraseña |
| `/login` | Login o demo |
| `/profile` | Perfil, plan, billing demo |
| `GET /api/me` | Sesión actual (cookie JWT) |

## Estructura

| Ruta | Rol |
|------|-----|
| `src/contexts/identity/` | Usuarios, auth |
| `src/contexts/billing/` | Google Play + demo plan |
| `src/contexts/shared/` | Postgres, DI, HTTP |
| `src/contexts/legacy/` | Referencia MOOC/Femturisme (sin DI) |
| `databases/1-starter.sql` | Schema `starter` |
| `databases/legacy/` | SQL histórico RAG |

## Build Android (Capacitor)

```bash
# Backend desplegado; en .env.local del build móvil:
# NEXT_PUBLIC_API_URL=https://tu-api.example.com

npm run build:capacitor
```

Genera `out/` y sincroniza `android/`. Ver `scripts/build-capacitor.sh`.

## Stack legacy (opcional)

RAG, Ollama, MariaDB:

```bash
docker compose --profile legacy up -d
```

SQL en `databases/legacy/`. No es necesario para el flujo starter web.

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run test` | Tests (excluye `legacy/` y `*.ci.test.ts`) |
| `npm run build:capacitor` | Export estático + `cap sync android` |

## Variables de entorno

Ver [`.env.example`](.env.example). Críticas: `AUTH_SECRET`, `POSTGRES_*`, `NEXT_PUBLIC_API_URL` (móvil).
