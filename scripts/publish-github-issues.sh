#!/usr/bin/env bash
# Usage: bash scripts/publish-github-issues.sh docs/issues/manifest.post-onboarding.json
set -euo pipefail

MANIFEST="${1:?Usage: publish-github-issues.sh <manifest.json>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST_PATH="$MANIFEST"
if [[ "$MANIFEST" != /* ]]; then
  MANIFEST_PATH="$ROOT/$MANIFEST"
fi

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "Manifest not found: $MANIFEST_PATH" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh not authenticated. Run: gh auth login (or set GH_TOKEN)" >&2
  exit 1
fi

REPO="$(node -e "const m=require(process.argv[1]); if(!m.repo) process.exit(2); console.log(m.repo)" "$MANIFEST_PATH")"
COUNT="$(node -e "const m=require(process.argv[1]); console.log(m.issues.length)" "$MANIFEST_PATH")"

for ((i = 0; i < COUNT; i++)); do
  read -r TITLE BODY_FILE <<<"$(node -e "
    const m=require(process.argv[1]);
    const x=m.issues[Number(process.argv[2])];
    console.log(x.title + '\t' + x.bodyFile);
  " "$MANIFEST_PATH" "$i")"
  BODY_PATH="$ROOT/$BODY_FILE"
  if [[ ! -f "$BODY_PATH" ]]; then
    echo "Body file not found: $BODY_PATH" >&2
    exit 1
  fi
  URL="$(gh issue create --repo "$REPO" --title "$TITLE" --body-file "$BODY_PATH")"
  echo "Created: $URL"
done

echo ""
echo "Recent issues:"
gh issue list --repo "$REPO" --limit 10
