---
name: prisma
description: >-
  Prisma en fidelization: schema, migraciones, cliente generado, Prisma Postgres,
  seed y singleton server-side. Usar cuando el usuario mencione Prisma, schema.prisma,
  prisma migrate, DATABASE_URL, db seed, src/lib/prisma.ts, o errores de cliente obsoleto.
---

# Prisma (fidelization)

Stack: **Prisma 7**, schema en `prisma/schema.prisma`, config en `prisma.config.ts`, cliente en `generated/prisma` (gitignored), singleton en `src/lib/prisma.ts`.

| Comando | Efecto |
|---------|--------|
| `npx prisma generate` | Regenera el cliente TS (local, no toca BD) |
| `npx prisma migrate dev --name <name>` | Crea y aplica migración en dev |
| `npx prisma db seed` | Ejecuta `prisma/seed.ts` |
| `npx tsx scripts/verify-prisma.ts` | Comprueba conectividad (solo lectura) |
| `npx prisma studio` | UI para inspeccionar datos |

`DATABASE_URL` vive en `.env` (nunca commitear). Placeholder en `.env.example`.

---

## Regla: confirmación antes de mutar la BD

**No ejecutar** sin confirmación explícita del usuario:

- `prisma migrate dev`, `prisma migrate deploy`, `prisma migrate reset`
- `prisma db push`
- SQL de escritura vía `prisma db execute`

**Seguro sin confirmación:** `generate`, `validate`, `format`, `npx tsx scripts/verify-prisma.ts`, leer schema.

Antes de migrar, resumir: comando, cambio esperado en tablas, host (sin credenciales), riesgo.

---

## Convenciones del proyecto

Leer según el cambio (mapa en `AGENTS.md`):

- `docs/database/table-naming-singular-plural-convention.md`
- `docs/database/text-over-varchar-char-convention.md`
- `docs/database/not-null-fields.md`

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
npx prisma db seed                             # si aplica
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
