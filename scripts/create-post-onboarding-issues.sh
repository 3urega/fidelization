#!/usr/bin/env bash
# Create GitHub issues #16–#20 from docs/issues/*.md
# Requires: gh auth login
set -euo pipefail
REPO="3urega/fidelization"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

create() {
  local title="$1"
  local body_file="$2"
  gh issue create --repo "$REPO" --title "$title" --body-file "$body_file"
}

create "Tenant branding: domain + API (PATCH /api/tenant/branding)" "$ROOT/docs/issues/16-tenant-branding-api.md"
create "Tenant branding: settings UI + home checklist" "$ROOT/docs/issues/17-tenant-branding-ui.md"
create "Customer session: register + loyalty APIs (kind: customer)" "$ROOT/docs/issues/18-customer-session-api.md"
create "Customer loyalty app: /app UI + middleware" "$ROOT/docs/issues/19-customer-app-ui.md"
create "Customer QR: verify E2E + docs (close Phase B)" "$ROOT/docs/issues/20-customer-qr-verify-docs.md"

echo "Done. List open issues:"
gh issue list --repo "$REPO" --limit 10
