# Everec

创作者认知增强系统 — Creative OS monorepo。

| 项目 | 路径 | 说明 |
|------|------|------|
| **主脑 (Hub)** | `hub/` | Creative OS 中央启动器（统筹全部应用） |
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |
| **Knowgo** | `knowgo/` | 视觉灵感认知 + Project Graph |
| **Prerector** | `prerector/` | 协作制片（任务 / 好友 / 群聊） |

## Vercel 在线部署

**统一部署（推荐）**：仓库根目录一个 Vercel 项目即可访问全部 Web 端。

| 入口 | 路径 |
|------|------|
| **Everec 总览** | `/` |
| **主脑 (Hub)** | `/apps/hub/` |
| **Simcut** | `/apps/simcut/` |
| **Desound** | `/apps/desound/` |
| **Knowgo** | `/apps/knowgo/` |
| **Prerector** | `/apps/prerector/` |

1. [Vercel New Project](https://vercel.com/new) → 导入仓库
2. **Root Directory** 留空（仓库根 `/`）
3. Deploy → 左侧目录切换产品

验证 API：

```bash
curl https://<域名>/api/health
curl https://<域名>/api/knowgo/health
curl -H "X-User-Id: user-me" https://<域名>/api/prerector/health
```

### 独立部署（可选）

| 产品 | Vercel Root Directory |
|------|----------------------|
| **Simcut** | `/`（仓库根，见下方说明） |
| **Knowgo** | `knowgo` — [knowgo/DEPLOY.md](knowgo/DEPLOY.md) |
| **Prerector** | `prerector` — [prerector/README.md](prerector/README.md) |

> 使用统一部署时无需再为各产品单独建 Vercel 项目。

## 本地开发

```bash
npm install

npm run dev:portal      # 统一门户 · http://localhost:1410
npm run dev:hub         # 主脑 Hub · http://localhost:1400
npm run dev:simcut      # Simcut Web · :1421
npm run dev:web         # Desound Web · :1420
npm run dev:knowgo      # Knowgo · :1422
npm run dev:prerector   # Prerector · :1423
```

门户 dev 模式下 iframe 需各产品 dev 服务同时运行。

## 目录结构

```text
everec/
├── portal/           # 统一 Web 门户（Vercel 输出）
├── hub/              # 主脑 — Creative OS 启动器
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
npm run build:vercel-portal
```
