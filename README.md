# Everec

创作者认知增强系统 — Creative OS monorepo。

| 项目 | 路径 | 说明 |
|------|------|------|
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |
| **Knowgo** | `knowgo/` | 视觉灵感认知 + Project Graph |

## Vercel 在线部署

**统一部署**：仓库根目录一个 Vercel 项目即可访问全部 Web 端。

| 入口 | 路径 |
|------|------|
| **Everec 总览** | `/` |
| **Simcut** | `/apps/simcut/` |
| **Desound** | `/apps/desound/` |
| **Knowgo** | `/apps/knowgo/` |

1. [Vercel New Project](https://vercel.com/new) → 导入仓库
2. **Root Directory** 留空（仓库根 `/`）
3. Deploy → 左侧目录切换产品

验证 API：

```bash
curl https://<域名>/api/health
curl https://<域名>/api/knowgo/health
```

> Knowgo 也可单独部署：Root Directory 设为 `knowgo`（见 [knowgo/DEPLOY.md](knowgo/DEPLOY.md)）

### Simcut Web 本地

```bash
npm run dev:simcut
# 或 cd simcut/web/frontend && npm install && npm run dev
```

### 统一门户本地（含左侧目录）

```bash
npm install
npm run dev:portal
# http://localhost:1410 — 需同时启动各产品 dev 服务以加载 iframe
```

### Knowgo 本地

```bash
npm install
npm run dev:knowgo
# http://localhost:1421 · API :3002
```

### Desound 本地

```bash
npm run dev:web
```

## 目录结构

```text
everec/
├── simcut/           # 视频剪辑
├── desound/          # 音频创作
├── knowgo/           # 视觉灵感（独立 Vercel Web）
├── shared/
└── docs/
```
