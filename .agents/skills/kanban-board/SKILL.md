---
name: kanban-board
description: >-
  Manage the kanban board for 3urega/fidelization: list, read, plan (vertical slicing),
  implement, close GitHub issues, and clean up matching docs/issues drafts when closed.
  Use for /kanban-board or when closing an issue after implementation.
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

1. **Read** the issue using `gh issue view <id>`.
2. **Analyze** the description, acceptance criteria, and labels.
3. **Present an implementation plan** to the user (see **Vertical slicing** below) with:
   - Summary of what the issue asks for.
   - Slices (VS1, VS2, …) with user-visible value per slice.
   - Main files / layers touched per slice.
   - Potential risks or open questions.
   - Manual verification checklist before closing.

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

- Ordenar slices de **menor a mayor** dependencia; el primero suele ser el “tracer bullet” (flujo mínimo demostrable).
- Marcar explícitamente **fuera de alcance** del issue para no inflar slices.
- Si el issue es trivial (un bug de una línea), **un solo slice** basta; no forzar VS1–VS4.
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
