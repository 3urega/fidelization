---
name: plan-to-issues
description: >-
  Convert an implementation plan (.md roadmap or domain doc) into GitHub issue draft
  files under docs/issues plus a JSON manifest. Use before publish-github-issues when
  the user has a plan to implement, wants to generate issue bodies from a document,
  or says plan-to-issues, roadmap to issues, or crear issues en docs.
---

# Plan to Issues (docs first)

Repository: `3urega/fidelization`

**This is step 1** of the issue workflow. **Step 2** is [publish-github-issues](../publish-github-issues/SKILL.md) (upload to GitHub). **Step 3** lifecycle: [kanban-board](../kanban-board/SKILL.md) (implement + close + cleanup docs).

```
Plan .md  →  [plan-to-issues]  →  docs/issues/*.md + manifest.json
                                        ↓
                              [publish-github-issues]  →  GitHub issues
                                        ↓
                              [kanban-board] implement → close → delete docs drafts
```

## When to use

- User has a roadmap or plan in `docs/domain/*.md`, `docs/issues/*-draft.md`, or a Cursor plan.
- User asks: *genera las issues en docs*, *convierte el roadmap en issues*, *prepara el kanban*.
- **Do not** call `gh issue create` in this skill — only write files under `docs/issues/`.

## Input

One primary document, e.g.:

- `docs/domain/post-onboarding-mvp-roadmap.md`
- `docs/issues/customer-qr-session-web-first.md`
- Any `.md` with phases, vertical slices, acceptance criteria

Read `AGENTS.md` and linked domain docs for context.

## Output (required)

1. **One body file per issue** in `docs/issues/`:

   Naming (before GitHub numbers exist): `{short-slug}.md`  
   Example: `tenant-branding-api.md`, `customer-app-ui.md`

   After publish, filenames may be renamed to `{githubNumber}-{slug}.md` (optional; publish skill).

2. **Manifest** `docs/issues/manifest.<batch-name>.json`:

```json
{
  "repo": "3urega/fidelization",
  "sourceDoc": "docs/domain/post-onboarding-mvp-roadmap.md",
  "issues": [
    {
      "title": "Tenant branding: domain + API (PATCH /api/tenant/branding)",
      "bodyFile": "docs/issues/tenant-branding-api.md"
    }
  ]
}
```

3. **Update source plan** — add section **GitHub issues (draft)** with table linking body files (not GitHub URLs until published).

## Issue body template

Each `docs/issues/<slug>.md` must include:

```markdown
## Objetivo
(one paragraph)

## Contexto
(dependencies, links to docs/domain/)

## Alcance
| In | Fuera |
|----|-------|

## Criterios de aceptación
- [ ] ...

## Capas / archivos principales
- ...

## Issues relacionadas
- (other slugs in same batch)

## Referencias
- [source plan](../domain/....md)
```

Reference example: `docs/issues/16-tenant-branding-api.md`.

**Titles:** use `:` not em-dash `—` (PowerShell encoding).

## Vertical slicing

Split the plan into **one GitHub issue per vertical slice** (same rules as kanban-board):

| Slice | Valor para el usuario | Capas |
|-------|----------------------|-------|

- Smallest deliverable per issue; cross layers when needed.
- Mark **fuera de alcance** explicitly in each body.
- Order issues by dependency (manifest array order = implementation order).

Typical batch size: 3–7 issues. Do not create one mega-issue for a whole roadmap.

## Agent workflow

1. Read the source `.md` plan completely.
2. Identify phases / slices; one issue per slice (or per suggested GitHub issue row in the plan).
3. Write body files under `docs/issues/`.
4. Write `manifest.<batch-name>.json`.
5. Update source doc with draft issues table + link to manifest path.
6. Tell user: *Drafts ready in docs. Run `/publish-github-issues` with manifest … to upload.*

## Do not

- Publish to GitHub (that is `publish-github-issues`).
- Duplicate bodies already published (grep `docs/issues/` and `gh issue list` titles if unsure).
- Edit Cursor plan files in `.cursor/plans/` unless the user asks.

## Related

- [publish-github-issues](../publish-github-issues/SKILL.md) — step 2
- [kanban-board](../kanban-board/SKILL.md) — implement, close, cleanup docs
- [`docs/issues/README.md`](../../../docs/issues/README.md) — workflow summary
