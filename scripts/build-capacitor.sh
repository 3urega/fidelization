#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_DIR="src/app/api"
STASH_DIR="$ROOT/.capacitor-api-stash"

if [[ ! -d "$API_DIR" ]]; then
	echo "No existe $API_DIR; abortando."
	exit 1
fi

echo "Moviendo API fuera del árbol para export estático..."
rm -rf "$STASH_DIR"
mv "$API_DIR" "$STASH_DIR"

cleanup() {
	if [[ -d "$STASH_DIR" ]] && [[ ! -d "$API_DIR" ]]; then
		echo "Restaurando src/app/api..."
		mv "$STASH_DIR" "$API_DIR"
	fi
}
trap cleanup EXIT

export CAPACITOR_STATIC=1
npm run build

echo "Sincronizando Capacitor (android)..."
npx cap sync android

echo "Listo. Salida en out/ y proyecto android/."
