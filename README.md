# Everec

创作者认知增强系统 — Creative OS monorepo。

| 项目 | 路径 | 说明 |
|------|------|------|
| **主脑 (Hub)** | `hub/` | Creative OS 中央启动器（统筹全部应用） |
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |
| **Knowgo** | `knowgo/` | 视觉灵感认知 + Project Graph |

## Vercel 在线部署

| 产品 | Vercel Root Directory | 构建 |
|------|----------------------|------|
| **Simcut** | `/`（仓库根） | 根目录 `vercel.json` |
| **Knowgo** | **`knowgo`** | [knowgo/DEPLOY.md](knowgo/DEPLOY.md) |

### Knowgo 部署（3 步）

1. [Vercel New Project](https://vercel.com/new) → 导入 `cassini123/everec`
2. **Root Directory** 设为 **`knowgo`**
3. Deploy → 访问 `https://<项目名>.vercel.app`

验证：`curl https://<域名>/api/knowgo/health`

### 主脑 (Hub) 本地

```bash
npm install
npm run dev:hub
# http://localhost:1400
```

### Simcut Web 本地

```bash
npm run dev:simcut
# http://localhost:1422
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
├── hub/              # 主脑 — Creative OS 启动器
├── simcut/           # 视频剪辑
├── desound/          # 音频创作
├── knowgo/           # 视觉灵感（独立 Vercel Web）
├── shared/
└── docs/
```
