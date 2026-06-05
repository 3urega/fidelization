# GitHub issue drafts (`docs/issues/`)

Local drafts for `3urega/fidelization` **before** and **during** GitHub sync.

## Workflow (3 steps)

| Step | Skill | Output |
|------|-------|--------|
| 1 | **plan-to-issues** | `docs/issues/<slug>.md` + `manifest.<batch>.json` |
| 2 | **publish-github-issues** | Issues on GitHub (`gh issue create`) |
| 3 | **kanban-board** | Implement → close on GitHub → **delete** matching files here |

```
Plan .md  →  docs/issues  →  GitHub  →  implement  →  close  →  cleanup docs
```

## Files

| Pattern | Purpose |
|---------|---------|
| `<slug>.md` or `<n>-<slug>.md` | Issue body (Objetivo, alcance, criterios, …) |
| `manifest.<batch>.json` | Batch: `repo`, `sourceDoc`, `issues[]` with `title` + `bodyFile` |
| `*-draft.md` | Legacy single-issue draft (convert with plan-to-issues) |

## Publish

```bash
gh auth login
powershell -File scripts/publish-github-issues.ps1 -Manifest docs/issues/manifest.post-onboarding.json
```

## After close on GitHub

When an issue is closed (kanban-board skill): remove its body file and manifest entry; update `sourceDoc` roadmap status. Do not leave stale drafts for closed issues.

## Skills

- `.agents/skills/plan-to-issues/SKILL.md`
- `.agents/skills/publish-github-issues/SKILL.md`
- `.agents/skills/kanban-board/SKILL.md`
