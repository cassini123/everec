# AGENTS.md — Everec 每刻 Creative OS

## 项目概述

Everec 是一个创作者认知增强系统（Creative OS），采用 monorepo 架构，包含多个子产品：

| 子产品 | 路径 | 说明 |
|--------|------|------|
| **Portal** | `portal/` | 统一 Web 门户，iframe 嵌入各子产品 |
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面 Tauri） |
| **Desound** | `desound/` | 音频/音效创作（Web + 桌面 Tauri） |
| **Knowgo** | `knowgo/` | 视觉灵感认知 + Project Graph |
| **Prerector** | `prerector/` | 协作制片（任务/好友/群聊） |
| **Shared** | `shared/` | 共享类型与工具库 |
| **API** | `api/` | 统一 API 层（Vercel Serverless） |

## 技术栈

- **前端框架**: React 19 + TypeScript + Vite 6
- **样式**: Tailwind CSS v4
- **图标**: Lucide React
- **包管理**: pnpm workspaces
- **部署**: Vercel（统一部署）
- **桌面端**: Tauri (Rust) — Simcut、Desound
- **构建工具**: esbuild（API 构建）

## 目录结构

```
everec/
├── portal/              # 统一门户 (Vite dev port 1410)
│   ├── src/
│   │   ├── App.tsx      # 主页面，含导航与各产品入口
│   │   ├── main.tsx     # React 入口
│   │   └── index.css    # 全局样式
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── simcut/
│   ├── web/frontend/    # Simcut Web 前端 (port 1421)
│   ├── apps/            # Tauri 桌面端
│   └── crates/          # Rust crates
├── desound/
│   ├── web/
│   │   ├── frontend/    # Desound Web 前端 (port 1420)
│   │   └── backend/     # Desound 后端
│   └── desktop/         # Tauri 桌面端
├── knowgo/
│   ├── web/
│   │   ├── frontend/    # Knowgo 前端 (port 1422)
│   │   └── backend/     # Knowgo 后端
│   └── api/             # Knowgo Vercel API
├── prerector/
│   ├── web/
│   │   ├── frontend/    # Prerector 前端 (port 1423)
│   │   └── backend/     # Prerector 后端
│   └── api/             # Prerector Vercel API
├── shared/              # 共享库 (@everec/shared)
├── api/                 # 统一 API (Vercel Serverless)
├── scripts/             # 构建脚本
├── vercel.json          # Vercel 部署配置
└── package.json         # 根 package.json (workspaces)
```

## 关键入口 / 核心模块

- **门户入口**: `portal/src/main.tsx` → `portal/src/App.tsx`
- **Vite 配置**: `portal/vite.config.ts`（含各子产品代理配置）
- **Vercel 配置**: `vercel.json`（路由重写规则）
- **共享库**: `shared/src/index.ts`

## 运行与预览

```bash
pnpm install

# 开发模式
pnpm dev:portal      # 门户 http://localhost:1410
pnpm dev:simcut      # Simcut :1421
pnpm dev:web         # Desound :1420
pnpm dev:knowgo      # Knowgo :1422
pnpm dev:prerector   # Prerector :1423
```

预览环境使用 portal 作为主入口，端口映射到 5000。

## 预览与部署链路

### 预览（Dev Preview）

- **判定依据**：项目核心结果需要通过浏览器直接访问和交互验证（React + Vite Web 应用）
- **预览入口**：`portal/` 目录下的 Vite 开发服务器
- **预览脚本**：
  - `scripts/coze-preview-build.sh` — 安装依赖
  - `scripts/coze-preview-run.sh` — 在 `portal/` 目录启动 Vite dev server，绑定 `0.0.0.0:5000`
- **根 `.coze` 映射**：`[dev]` 段指向上述脚本，`[preview].preview_enable = "enabled"`

### 部署（Deploy）

- **部署类型**：`service` / `web`（Vite 前端 + 静态服务）
- **部署脚本**：
  - `scripts/build.sh` — 安装依赖 + `vite build` 构建 portal 产物到 `portal/dist`
  - `scripts/run.sh` — 使用 `npx serve` 在 `5000` 端口提供 `portal/dist` 静态服务
- **根 `.coze` 映射**：`[deploy]` 段指向上述脚本，`[deploy.profile]` 为 `kind = "service"`, `flavor = "web"`

### 注意事项

- 预览模式下，`coze-preview-build.sh` 会构建所有子产品（跳过 tsc，仅 vite build）并将产物复制到 `portal/public/apps/` 下，由 Vite dev server 作为静态文件提供
- `portal/vite.config.ts` 通过 `COZE_PREVIEW=true` 环境变量区分预览模式和本地开发模式：预览模式下不代理 `/apps/*` 请求（由 public 目录提供静态文件），本地开发模式下代理到各子产品 dev 服务
- 门户 iframe 的 src 使用 `/apps/<product>/index.html` 格式（而非 `/apps/<product>/`），确保 Vite dev server 能正确提供子产品页面而非 portal 的 SPA fallback
- 部署构建仅构建 portal 主入口，不包含子产品独立构建（子产品通过 Vercel 统一部署）
- `serve` 依赖需要作为 devDependency 或在 run.sh 中通过 npx 自动安装

## 用户偏好与长期约束

- Node.js 项目使用 pnpm 管理依赖
- 统一部署通过 Vercel，根目录为仓库根
- 门户 dev 模式下 iframe 需各产品 dev 服务同时运行
- 工作区依赖使用 `workspace:*` 协议引用内部包（pnpm workspace 要求）

## 常见问题和预防

- 门户代理配置在 `portal/vite.config.ts`，修改子产品端口时需同步更新
- Vercel rewrites 在 `vercel.json`，新增路由需同步更新
- 桌面端 (Tauri) 需要 Rust 环境，沙箱中不可用
- `@everec/shared` 等内部包必须使用 `workspace:*` 协议，不能用 `*`
