# Everec Monorepo

| 项目 | 路径 | 说明 |
|------|------|------|
| **Simcut** | `simcut/` | 轻量视频剪辑（网页 + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |

## Simcut 快速启动

> Simcut 目前在分支 `cursor/simcut-init-f20e`，**不在 main**。

### 第一次使用（完整步骤）

```bash
# 1. 克隆到桌面或任意目录
cd ~/Desktop
git clone https://github.com/cassini123/everec.git
cd everec

# 2. 切换到 simcut 分支
git fetch origin cursor/simcut-init-f20e
git checkout cursor/simcut-init-f20e

# 3. 启动前端
cd simcut/apps/desktop/ui
npm install
npm run dev
```

浏览器打开终端里显示的地址（默认 **http://localhost:1421**，端口占用时会自动用 1422 等）

### 一键启动（已克隆过）

```bash
cd ~/Desktop/everec    # 换成你的 everec 路径
./start-simcut.sh
```

### 常见错误

| 报错 | 原因 | 解决 |
|------|------|------|
| `fatal: not a git repository` | 当前目录不是 everec | 先 `cd` 到 everec 目录 |
| `cd: no such file or directory: simcut/...` | 没克隆仓库或在 main 分支 | 执行上面的 clone + checkout |
| `npm ENOENT package.json` | 路径不对 | 确认 `pwd` 显示 `.../everec/simcut/apps/desktop/ui` |
| `Port 1421 is already in use` | 上次 dev 没关 | 见下方「端口占用」 |

### 端口占用

```bash
# 查找并关闭占用 1421 的进程（Mac）
lsof -ti :1421 | xargs kill -9

# 然后重新启动
npm run dev
```

或直接再跑一次 `npm run dev`，新版配置会自动改用 1422 等空闲端口。
