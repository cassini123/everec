#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录（scripts/ 的上一级）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Everec Preview Build ==="

# 安装依赖
echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

# 构建所有子产品并复制到 portal/public/apps/ 下
PORTAL_PUBLIC="portal/public"

# 清理旧的 public/apps 目录
rm -rf "$PORTAL_PUBLIC/apps"
mkdir -p "$PORTAL_PUBLIC/apps"

# 构建 Simcut（跳过 tsc，直接用 vite build）
echo "Building Simcut..."
cd simcut/web/frontend
VITE_APP_BASE="/apps/simcut/" pnpm exec vite build
cd "$PROJECT_DIR"
cp -r simcut/web/frontend/dist "$PORTAL_PUBLIC/apps/simcut"

# 构建 Desound
echo "Building Desound..."
cd desound/web/frontend
VITE_APP_BASE="/apps/desound/" pnpm exec vite build
cd "$PROJECT_DIR"
cp -r desound/web/frontend/dist "$PORTAL_PUBLIC/apps/desound"

# 构建 Knowgo
echo "Building Knowgo..."
cd knowgo/web/frontend
VITE_APP_BASE="/apps/knowgo/" pnpm exec vite build
cd "$PROJECT_DIR"
cp -r knowgo/web/frontend/dist "$PORTAL_PUBLIC/apps/knowgo"

# 构建 Prerector
echo "Building Prerector..."
cd prerector/web/frontend
VITE_APP_BASE="/apps/prerector/" pnpm exec vite build
cd "$PROJECT_DIR"
cp -r prerector/web/frontend/dist "$PORTAL_PUBLIC/apps/prerector"

echo "=== Preview build complete ==="
echo "Sub-products built and copied to $PORTAL_PUBLIC/apps/"
