---
name: prisma
description: >-
  Prisma en fidelization: schema, migraciones, cliente generado, Prisma Postgres,
  seed, singleton server-side y consultas de solo lectura a la BD. Usar cuando el
  usuario mencione Prisma, schema.prisma, prisma migrate, DATABASE_URL, db seed,
  consultar usuarios/roles/datos, src/lib/prisma.ts, o errores de cliente obsoleto.
---

# Prisma (fidelization)

Stack: **Prisma 7**, schema en `prisma/schema.prisma`, config en `prisma.config.ts`, cliente en `generated/prisma` (gitignored), singleton en [`src/lib/prisma.ts`](../../../src/lib/prisma.ts).

| Comando | Efecto |
|---------|--------|
| `npx prisma generate` | Regenera el cliente TS (local, no toca BD) |
| `npx prisma migrate dev --name <name>` | Crea y aplica migración en dev |
| `npx prisma db seed` | Ejecuta `prisma/seed.ts` |
| `npx tsx scripts/verify-prisma.ts` | Comprueba conectividad (solo lectura) |
| `npm run db:users` | Lista usuarios, `platform_role` y memberships (solo lectura) |
| `npx prisma studio` | UI para inspeccionar datos |

`DATABASE_URL` vive en `.env` (nunca commitear). Placeholder en `.env.example`.

---

## Consultas a la base de datos (solo lectura)

Cuando el usuario pida «qué hay en la BD», usuarios/roles, tenants, etc.:

### 1. Usar scripts del repo (preferido)

No improvisar `npx tsx -e "..."` en PowerShell: escapa mal, no hay timeout claro y suele colgar con Prisma Postgres remoto.

| Necesidad | Comando |
|-----------|---------|
| ¿Conecta la BD? | `npx tsx scripts/verify-prisma.ts` |
| Usuarios y roles (platform + tenant) | `npm run db:users` → [`scripts/check-user-memberships.ts`](../../../scripts/check-user-memberships.ts) |
| Exploración visual | `npx prisma studio` (pedir confirmación si el usuario no lo pidió) |

**Modelo de roles en este proyecto:**

- **Plataforma:** `users.platform_role` = `superadmin` (sin filas en `tenant_memberships`). Login: `/platform/login`.
- **Negocio (staff):** `tenant_memberships.role` = `owner` \| `employee` \| `admin`. Login: `/login`.
- **Cliente loyalty:** `tenant_memberships.role` = `customer` o tabla `customers` (no usa el login de staff).

Datos seed típicos (tras `npx prisma db seed`):

| Email | Rol plataforma | Membership tenant |
|-------|----------------|-------------------|
| `SUPERADMIN_EMAIL` (p. ej. `superadmin@platform.local`) | `superadmin` | ninguna |
| `demo@starter.local` | — | `owner` @ `cafe-demo` |

### 2. Patrón para scripts nuevos de inspección

Crear un archivo bajo `scripts/`, no inline en terminal:

```ts
import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  // findMany / findFirst — solo lectura
  const rows = await prisma.user.findMany({ take: 10 });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Ejecutar:

```bash
npx tsx scripts/mi-consulta.ts
```

Reglas:

- Importar **siempre** `prisma` desde [`src/lib/prisma.ts`](../../../src/lib/prisma.ts) (adapter `PrismaPg` + `env.databaseUrl`).
- **No** instanciar `PrismaClient` a mano en one-liners salvo en `prisma/seed.ts` (mismo patrón que seed).
- **No** importar Prisma en componentes React.
- Al lanzar desde el agente: `block_until_ms` ≥ **120000** (BD remota puede tardar 10–60 s).
- Siempre `prisma.$disconnect()` en `then`/`catch`.
- Preferir `select` acotado y `take` en tablas grandes.

### 3. Consultas SQL directas

Solo lectura sin confirmación:

```bash
npx prisma db execute --stdin <<< "SELECT email, platform_role FROM users LIMIT 20;"
```

En Windows (PowerShell), usar fichero `.sql` o el script TS anterior; `<<<` no es fiable.

Escritura (`INSERT`/`UPDATE`/`DELETE`) o `db execute` destructivo: **confirmación explícita** del usuario.

### 4. Si la consulta falla o cuelga

1. Comprobar `DATABASE_URL` en `.env` (no loguear el valor).
2. `npx prisma generate` si el error es de tipos/cliente.
3. `npx tsx scripts/verify-prisma.ts` — si falla, es red/credenciales, no la query.
4. No reintentar el mismo `tsx -e` multilínea; pasar a script en `scripts/`.

---

## Regla: confirmación antes de mutar la BD

**No ejecutar** sin confirmación explícita del usuario:

- `prisma migrate dev`, `prisma migrate deploy`, `prisma migrate reset`
- `prisma db push`
- SQL de escritura vía `prisma db execute`
- `prisma db seed` (modifica datos) — confirmar si el usuario no lo pidió

**Seguro sin confirmación:** `generate`, `validate`, `format`, `verify-prisma.ts`, `npm run db:users`, scripts de inspección con solo `findMany`/`count`, `prisma studio` (si el usuario quiere mirar datos).

Antes de migrar, resumir: comando, cambio esperado en tablas, host (sin credenciales), riesgo.

---

## Convenciones del proyecto

Leer según el cambio (mapa en `AGENTS.md`):

- `docs/database/table-naming-singular-plural-convention.md`
- `docs/database/text-over-varchar-char-convention.md`
- `docs/database/not-null-fields.md`
- `docs/database/data-model.md` — roles y tablas

Reglas rápidas:

- Importar cliente desde `generated/prisma/client` — **no** `@prisma/client` directo.
- Usar `src/lib/prisma.ts` con adapter `PrismaPg` — **solo server-side** (API routes, scripts, use cases infra).
- Tras cambiar `schema.prisma`: `generate` + `migrate dev` (con confirmación).
- Repos hexagonales nuevos van en `infrastructure/` con Prisma; no mezclar `postgres.js` en código nuevo.
- `PostgresConnection` (`postgres.js`) queda legacy para billing hasta migrarlo.

---

## Flujos habituales

### Cambié el schema

```bash
npx prisma migrate dev --name descriptive_name   # con confirmación
npx prisma generate
npx prisma db seed                             # si aplica, con confirmación
```

### Error «Unknown argument» en runtime

```bash
npx prisma generate
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

Reiniciar `npm run dev`.

### Clon / npm install

Tras instalar deps:

```bash
npx prisma generate
npx tsx scripts/verify-prisma.ts
```

### Link Prisma Postgres (solo setup inicial)

```bash
PRISMA_API_KEY="<secret>" npx --yes --package=prisma@latest -- prisma postgres link --database "db_..."
```

Nunca loguear API key ni `DATABASE_URL`.

---

## Checklist post-cambio de schema

```
- [ ] schema.prisma revisado (docs/database/)
- [ ] npx prisma migrate dev --name ... (confirmado)
- [ ] npx prisma generate
- [ ] seed actualizado si aplica
- [ ] npx tsx scripts/verify-prisma.ts
- [ ] npm run prep
```

---

## Qué no hacer

- No commitear `.env` ni `generated/prisma`.
- No importar Prisma Client en client components de React.
- No usar `prisma migrate reset` salvo petición explícita.
- No ejecutar migraciones en prod sin confirmación y contexto del entorno.
- **No** usar `npx tsx -e '...'` multilínea con Prisma para «mirar la BD» — usar `npm run db:users` o un script en `scripts/`.
