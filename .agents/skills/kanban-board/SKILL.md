---
name: kanban-board
description: >-
  Manage the kanban board for 3urega/fidelization: list, read, plan with DDD/architecture
  review (not literal issue copy), vertical slicing, implement, close GitHub issues, and
  clean up docs/issues drafts when closed. Use for /kanban-board or when closing an issue.
---

# Kanban Board

Repository: `3urega/fidelization`

All `gh` commands require `--repo 3urega/fidelization`.

**Issue lifecycle:** [plan-to-issues](../plan-to-issues/SKILL.md) → [publish-github-issues](../publish-github-issues/SKILL.md) → **kanban-board** (this skill).

## Commands

List open issues:
```bash
gh issue list --repo 3urega/fidelization
```

View a specific issue:
```bash
gh issue view <number> --repo 3urega/fidelization
```

Close an issue:
```bash
gh issue close <number> --repo 3urega/fidelization --comment "Done: <brief summary>"
```

## Behavior

### Without arguments

List all open issues and show a summary to the user.

### With an issue ID as argument (e.g. `/kanban-board 42`)

**No traduzcas la issue a un plan mecánico.** Primero entiende el contexto y diseña la mejor solución; después presenta el plan (con mejoras propuestas si las hay).

#### Fase 1 — Leer la issue (punto de partida, no verdad absoluta)

```bash
gh issue view <id> --repo 3urega/fidelization
```

Extrae: objetivo, criterios de aceptación, dependencias, verifies mencionados y **fuera de alcance** explícito.

#### Fase 2 — Contexto y arquitectura (obligatorio antes del plan)

Dedica tiempo a investigar **antes** de proponer slices. No basta con leer la issue.

1. **`AGENTS.md`** — producto, convenciones, mapa «Cuándo leer cada doc». Verifies: descubrir en `package.json` (`verify:*`).
2. **Docs de arquitectura** (según el tipo de issue; leer solo lo relevante):
   - API / casos de uso: [`docs/backend/thin-api-routes.md`](../../../docs/backend/thin-api-routes.md), [`hexagonal-architecture.md`](../../../docs/backend/hexagonal-architecture.md), [`dependency-injection-diod.md`](../../../docs/backend/dependency-injection-diod.md), [`api-routes-reflect-metadata.md`](../../../docs/backend/api-routes-reflect-metadata.md)
   - Dominio / reglas: [`docs/business-rules.md`](../../../docs/business-rules.md), [`docs/domain/saas-architecture.md`](../../../docs/domain/saas-architecture.md)
   - Datos / Prisma: [`docs/database/data-model.md`](../../../docs/database/data-model.md), skill [prisma](../prisma/SKILL.md)
   - Auth / tenant: [`docs/teenant-resolution.md`](../../../docs/teenant-resolution.md), [`session-cookies-localhost-dev.md`](../../../docs/backend/session-cookies-localhost-dev.md)
   - UI: [`docs/frontend/style-guidelines.md`](../../../docs/frontend/style-guidelines.md)
   - `sourceDoc` del manifest o **Referencias** en el body de la issue (p. ej. `docs/domain/*.md`)
3. **Código existente** — buscar patrones ya implementados en el mismo bounded context (`src/contexts/…`), rutas API hermanas, componentes UI similares, verifies de la misma fase.
4. **Estado real vs issue** — ¿la issue asume tablas/APIs que ya existen? ¿Hay deuda (duplicación, nombres legacy, índices faltantes) que conviene resolver en el mismo PR?

#### Fase 3 — Diseño senior (DDD + mejoras)

Con el contexto cargado, **diseña** la implementación (no copies la issue):

- **Bounded context** y capa correcta (dominio / aplicación / infra / presentación).
- **Puertos y casos de uso** reutilizables vs lógica en route o componente.
- **Read models vs agregados** — consultas analíticas no fuerzan entidades de dominio si el proyecto ya usa repos de lectura.
- **Consistencia** con convenciones del repo (naming Prisma, thin routes, DI `@Service()`, verifies `npm run verify:*`).
- **Riesgos**: timezone, multi-tenant, plan gates, cookies host-only, N+1 en agregaciones.

**Mejoras y cambios propuestos** (cuando aporten valor y encajen en el alcance del issue):

| Tipo | Ejemplo | Acción |
|------|---------|--------|
| Refactor menor colindante | Extraer VO ya repetido en 2 archivos | Incluir en plan si es barato |
| Índice / migración | Query lenta en agregación | Proponer en K1, no postergar silenciosamente |
| Ajuste de API | Campo extra útil para UI sin inflar scope | Proponer al usuario |
| Desviación de la issue | Cambiar URL, renombrar use case, ampliar scope | **Preguntar al usuario** antes de implementar |
| Fuera de alcance | Feature adicional no pedida | Marcar explícitamente «no incluir» |

Si propones cambios respecto al texto de la issue, sepáralos en una sección **Propuestas / desvíos** con: qué cambia, por qué (arquitectura o producto), impacto en otras issues del batch.

#### Fase 4 — Plan de implementación (entregar al usuario)

Presentar en este orden:

1. **Resumen** — qué pide la issue y qué vas a construir realmente (1–2 párrafos).
2. **Contexto encontrado** — archivos/patrones/docs relevantes (bullets breves).
3. **Propuestas / desvíos** (si hay) — mejoras recomendadas; preguntas abiertas.
4. **Slices verticales** (VS1, VS2, …) — ver **Vertical slicing** abajo.
5. **Riesgos y mitigaciones**.
6. **Checklist de verificación** manual + `npm run verify:*` antes de cerrar.

**Espera confirmación del usuario** si hay desvíos material respecto a la issue o propuestas que amplíen scope. Si el usuario dice «implementa», ejecuta el plan acordado (o el literal de la issue si rechaza las propuestas).

#### Fase 5 — Implementación

Completar y verificar **un slice antes del siguiente**, salvo que el usuario pida paralelizar.

### After completing work on an issue

Close only when **all slices** are done and verified:

```bash
gh issue close <number> --repo 3urega/fidelization --comment "Done: <brief summary>"
```

Then **clean up docs** (mandatory):

#### 1. Find local drafts for this issue

Search in order:

```bash
# Body file named with issue number prefix
docs/issues/<number>-*.md

# Manifest entries (all manifest.*.json in docs/issues/)
grep -l "\"bodyFile\"" docs/issues/manifest.*.json
# Match title from: gh issue view <number> --json title

# Orphan drafts referenced only by closed issue title
grep -ri "<title keywords>" docs/issues/
```

Also check `sourceDoc` in the manifest (e.g. `docs/domain/post-onboarding-mvp-roadmap.md`).

#### 2. Delete issue draft files

- **Delete** the body file(s) in `docs/issues/` for this issue (e.g. `16-tenant-branding-api.md`).
- **Remove** the matching entry from every `docs/issues/manifest.*.json` (`issues[]` item with same `bodyFile` or title).
- If a manifest has empty `issues[]`, **delete** the manifest file.
- **Delete** superseded single drafts (e.g. `customer-qr-session-web-first.md`) only if fully replaced by closed split issues and user/roadmap agrees.

**Do not delete** domain roadmaps (`docs/domain/*.md`) — only update their status (see step 3).

#### 3. Update source / roadmap docs

In the plan linked from manifest `sourceDoc` or from issue body **Referencias**:

- Mark the issue/phase as **Implemented** with GitHub `#<number>` and date.
- Remove or shrink **Suggested GitHub issues** / draft tables that only listed unpublished work.
- Keep historical context; do not remove entire roadmaps.

#### 4. Confirm to user

Report: issue closed URL + which files were deleted/updated under `docs/`.

---

## Vertical slicing (regla general)

Al planificar e implementar issues, **partir el trabajo en slices verticales** (historias finas, entregables de punta a punta). No planificar por capas horizontales (“primero toda la API, luego toda la UI”).

### Qué es un slice vertical

Cada slice (VS1, VS2, …) debe:

1. **Aportar valor visible** al usuario o escritor (aunque sea parcial).
2. **Cruzar capas** cuando haga falta: UI + aplicación/dominio + persistencia/API mínima para ese valor — no una capa entera aislada.
3. **Integrarse y demostrarse** por sí solo (mergeable / probabile en `/write` o la ruta que toque).
4. **Ser lo más pequeño posible** que cumpla un criterio de aceptación claro.

### Cómo escribir el plan

Incluir una tabla o lista con columnas equivalentes a:

| Slice | Valor para el usuario | Capas / archivos principales |
|-------|----------------------|------------------------------|
| VS1 | … | … |
| VS2 | … | … |

Reglas adicionales:

- **Investigar antes de planificar** — Fases 2–3 son obligatorias; el plan (Fase 4) refleja el diseño acordado, no un volcado de la issue.
- Ordenar slices de **menor a mayor** dependencia; el primero suele ser el “tracer bullet” (flujo mínimo demostrable).
- Marcar explícitamente **fuera de alcance** del issue para no inflar slices.
- Si el issue es trivial (un bug de una línea), **un solo slice** basta; no forzar VS1–VS4 (pero sí revisar contexto si el bug toca auth/tenant).
- Al implementar, completar y verificar **un slice antes de pasar al siguiente**, salvo que el usuario pida paralelizar.
- Respetar `AGENTS.md` y `docs/` al tocar infraestructura, API o casos de uso.
- New batches: use [plan-to-issues](../plan-to-issues/SKILL.md) before GitHub publish.

### Ejemplo (referencia)

Issue “Mejorar con IA” partido en:

- **VS1:** panel mínimo + selección obligatoria (solo UI).
- **VS2:** reescritura E2E (UI + endpoint + splice en editor).
- **VS3:** versión automática tras IA (dominio + sync).
- **VS4:** limpiar entry points y código muerto.

Cada VS se puede probar en producto antes del siguiente.

## Related

- [plan-to-issues](../plan-to-issues/SKILL.md) — step 1: plan `.md` → `docs/issues/`
- [publish-github-issues](../publish-github-issues/SKILL.md) — step 2: manifest → GitHub
- [`docs/issues/README.md`](../../../docs/issues/README.md)
