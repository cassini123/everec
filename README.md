# Everec

创作者认知增强系统 — Creative OS monorepo。

| 项目 | 路径 | 说明 |
|------|------|------|
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |
| **Knowgo** | `knowgo/` | 视觉灵感认知 + Project Graph |
| **Prerector** | `prerector/` | 协作制片（任务 / 好友 / 群聊） |

## Vercel 在线部署

| 产品 | Vercel Root Directory | 说明 |
|------|----------------------|------|
| **Simcut** | `/`（仓库根） | 根目录 `vercel.json` |
| **Knowgo** | `knowgo` | [knowgo/DEPLOY.md](knowgo/DEPLOY.md) |
| **Prerector** | `prerector` | [prerector/README.md](prerector/README.md) |

### 部署 Prerector（3 步）

1. [Vercel New Project](https://vercel.com/new) → 导入本仓库
2. **Root Directory** 设为 **`prerector`**
3. Deploy → 访问 `https://<项目名>.vercel.app`

验证：`curl -H "X-User-Id: user-me" https://<域名>/api/health`

### 部署 Knowgo（3 步）

1. [Vercel New Project](https://vercel.com/new) → 导入本仓库
2. **Root Directory** 设为 **`knowgo`**
3. Deploy → 验证 `curl https://<域名>/api/knowgo/health`

## 本地开发

```bash
npm install

npm run dev:simcut      # Simcut Web
npm run dev:knowgo      # Knowgo · http://localhost:1421
npm run dev:prerector   # Prerector · http://localhost:1421（需改端口或分开启动）
npm run dev:web         # Desound Web
```

Prerector 与 Knowgo 默认都用 1421/3002，同时开发时请只启一个，或改 `vite.config.ts` 端口。

## 目录结构

```text
everec/
├── simcut/
├── desound/
├── knowgo/
├── prerector/
├── shared/
├── api/
└── docs/
```

## 验证 Vercel 构建

```bash
npm run build:vercel-prerector
npm run build:vercel-knowgo
npm run build:simcut
```
