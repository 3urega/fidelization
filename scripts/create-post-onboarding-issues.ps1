# Create GitHub issues #16-#20 from docs/issues/*.md
# Requires: gh auth login
$ErrorActionPreference = "Stop"
$Repo = "3urega/fidelization"
$Root = Split-Path -Parent $PSScriptRoot

$issues = @(
    @{ Title = 'Tenant branding: domain + API (PATCH /api/tenant/branding)'; Body = Join-Path $Root 'docs\issues\16-tenant-branding-api.md' },
    @{ Title = 'Tenant branding: settings UI + home checklist'; Body = Join-Path $Root 'docs\issues\17-tenant-branding-ui.md' },
    @{ Title = 'Customer session: register + loyalty APIs (kind: customer)'; Body = Join-Path $Root 'docs\issues\18-customer-session-api.md' },
    @{ Title = 'Customer loyalty app: /app UI + middleware'; Body = Join-Path $Root 'docs\issues\19-customer-app-ui.md' },
    @{ Title = 'Customer QR: verify E2E + docs (close Phase B)'; Body = Join-Path $Root 'docs\issues\20-customer-qr-verify-docs.md' }
)

foreach ($issue in $issues) {
    gh issue create --repo $Repo --title $issue.Title --body-file $issue.Body
    if ($LASTEXITCODE -ne 0) {
        Write-Error "gh issue create failed. Run: gh auth login"
        exit 1
    }
}

Write-Host 'Done. Recent issues:'
gh issue list --repo $Repo --limit 10
