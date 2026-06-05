param(
    [Parameter(Mandatory = $true)]
    [string]$Manifest
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ManifestPath = if ([System.IO.Path]::IsPathRooted($Manifest)) { $Manifest } else { Join-Path $Root $Manifest }

if (-not (Test-Path $ManifestPath)) {
    Write-Error "Manifest not found: $ManifestPath"
    exit 1
}

$batch = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$Repo = $batch.repo
if (-not $Repo) {
    Write-Error "Manifest must include 'repo'"
    exit 1
}

$authOk = $true
try {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { $authOk = $false }
} catch {
    $authOk = $false
}
if (-not $authOk) {
    Write-Error "gh not authenticated. Run: gh auth login (or set GH_TOKEN)"
    exit 1
}

$created = @()
foreach ($issue in $batch.issues) {
    $bodyPath = Join-Path $Root ($issue.bodyFile -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path $bodyPath)) {
        Write-Error "Body file not found: $bodyPath"
        exit 1
    }

    $args = @("issue", "create", "--repo", $Repo, "--title", $issue.title, "--body-file", $bodyPath)
    if ($issue.labels) {
        foreach ($label in $issue.labels) {
            $args += @("--label", $label)
        }
    }

    $url = gh @args
    if ($LASTEXITCODE -ne 0) {
        Write-Error "gh issue create failed for: $($issue.title)"
        exit 1
    }

    $created += [PSCustomObject]@{ Title = $issue.title; Url = $url.Trim() }
    Write-Host "Created: $url"
}

Write-Host ""
Write-Host "Summary ($($created.Count) issues):"
$created | Format-Table -AutoSize
