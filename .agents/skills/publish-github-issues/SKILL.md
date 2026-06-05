---
name: publish-github-issues
description: >-
  Step 2: publish GitHub issues to 3urega/fidelization from docs/issues body files
  and JSON manifests (created by plan-to-issues). Use when the user asks to publish
  issues to GitHub, upload issue drafts, or run /publish-github-issues after docs exist.
---

# Publish GitHub Issues (step 2)

Repository: `3urega/fidelization`

**Prerequisite:** [plan-to-issues](../plan-to-issues/SKILL.md) must have created `docs/issues/*.md` + `manifest.<batch>.json`.  
**After publish:** implement via [kanban-board](../kanban-board/SKILL.md); on close, delete docs drafts.

```
[plan-to-issues] → docs/issues  →  [publish-github-issues]  →  GitHub
```

## When to use

- User says: *publica las issues*, *sube a GitHub*, `/publish-github-issues`.
- Body files + manifest already exist under `docs/issues/`.
- **Do not** use if only a plan `.md` exists and no `docs/issues/` bodies — run **plan-to-issues** first.

## Prerequisites

1. **GitHub CLI** (`gh`).
2. **Authentication** — agent runs:

```bash
gh auth status
```

If it fails: `gh auth login` or `GH_TOKEN` with `repo` scope. Attempt yourself before asking the user.

## Batch publish

### 1. Manifest

`docs/issues/manifest.<name>.json` (from plan-to-issues):

```json
{
  "repo": "3urega/fidelization",
  "sourceDoc": "docs/domain/post-onboarding-mvp-roadmap.md",
  "issues": [
    {
      "title": "Short title without em-dash",
      "bodyFile": "docs/issues/tenant-branding-api.md"
    }
  ]
}
```

Example: [`docs/issues/manifest.post-onboarding.json`](../../../docs/issues/manifest.post-onboarding.json).

### 2. Run publisher (repo root)

```bash
# Windows
powershell -File scripts/publish-github-issues.ps1 -Manifest docs/issues/manifest.post-onboarding.json

# macOS/Linux
bash scripts/publish-github-issues.sh docs/issues/manifest.post-onboarding.json
```

### 3. Verify + dedupe

```bash
gh issue list --repo 3urega/fidelization --limit 15
```

Before publish: search open issues for duplicate titles. If an old issue covers the same scope (e.g. #10 monolith vs split #18–#20), **close** the old one with a comment linking to new numbers.

### 4. Update docs after publish

- In `sourceDoc` (manifest): replace draft table with **published** GitHub URLs / numbers.
- Optionally rename body files to `{number}-{slug}.md` to match GitHub # (helps kanban cleanup on close).
- **Keep** body files and manifest until issues are **closed** (kanban-board deletes them).

Return **issue URLs** to the user in creation order + suggested implementation order.

## Single issue

```bash
gh issue create --repo 3urega/fidelization \
  --title "Title here" \
  --body-file docs/issues/my-issue.md
```

## Agent workflow

1. Confirm `docs/issues/` bodies + manifest exist (else → plan-to-issues).
2. `gh auth status` → run publish script.
3. List created URLs; note duplicates closed.
4. Update `sourceDoc` with GitHub numbers.
5. On auth failure: report blocker; drafts remain in docs for retry.

## Issue body format

See template in [plan-to-issues](../plan-to-issues/SKILL.md). Reference: `docs/issues/16-tenant-branding-api.md`.

## Related

- [plan-to-issues](../plan-to-issues/SKILL.md) — step 1
- [kanban-board](../kanban-board/SKILL.md) — close + cleanup docs
- [`docs/issues/README.md`](../../../docs/issues/README.md)
