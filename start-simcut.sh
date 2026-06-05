#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BRANCH="cursor/simcut-init-f20e"
UI="$ROOT/simcut/apps/desktop/ui"

cd "$ROOT"

if [ ! -d ".git" ]; then
  echo "错误：当前目录不是 git 仓库。请先执行："
  echo "  git clone https://github.com/cassini123/everec.git"
  echo "  cd everec && ./start-simcut.sh"
  exit 1
fi

if [ ! -f "$UI/package.json" ]; then
  echo "未找到 simcut，正在切换到分支 $BRANCH …"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
fi

if [ ! -f "$UI/package.json" ]; then
  echo "错误：仍找不到 simcut/apps/desktop/ui"
  echo "请手动执行：git checkout $BRANCH"
  exit 1
fi

cd "$UI"
[ -d node_modules ] || npm install
echo "启动 Simcut → http://localhost:1421"
npm run dev
