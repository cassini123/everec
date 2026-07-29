#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline

echo "Building shared library..."
pnpm --filter @everec/shared run build 2>/dev/null || true

build_subproduct() {
  local name="$1"
  local dir="$2"
  local base_path="$3"
  echo "Building $name..."
  (cd "$dir" && VITE_APP_BASE="$base_path" pnpm exec vite build)
}

build_subproduct "Simcut" "simcut/web/frontend" "/apps/simcut/"
build_subproduct "Desound" "desound/web/frontend" "/apps/desound/"
build_subproduct "Knowgo" "knowgo/web/frontend" "/apps/knowgo/"
build_subproduct "Prerector" "prerector/web/frontend" "/apps/prerector/"

echo "Building portal with Vite..."
cd portal
pnpm exec vite build

echo "Copying sub-product builds into portal dist..."
for product in simcut desound knowgo prerector; do
  src="$PROJECT_DIR/$product/web/frontend/dist"
  dest="$PROJECT_DIR/portal/dist/apps/$product"
  if [ -d "$src" ]; then
    mkdir -p "$dest"
    cp -r "$src"/* "$dest/"
    echo "  Copied $product -> dist/apps/$product/"
  fi
done

echo "Deploy build complete."
