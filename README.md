# Everec

创作者认知增强系统 — Creative OS monorepo。

| 项目 | 路径 | 说明 |
|------|------|------|
| **Simcut** | `simcut/` | 轻量视频剪辑（Web + 桌面） |
| **desound** | `desound/` | 音频 / 音效创作 |

## Simcut Web（Vercel 在线版）

独立网页端路径：`simcut/web/frontend`

Vercel 已配置为自动构建部署：

- **安装**：`npm install --prefix simcut/web/frontend`
- **构建**：`npm run build --prefix simcut/web/frontend`
- **输出**：`simcut/web/frontend/dist`
- 在 [vercel.com](https://vercel.com) 导入 `cassini123/everec`，选 `main` 分支即可

### 本地开发 Simcut Web

```bash
cd simcut/web/frontend
npm install
npm run dev
```

或在仓库根目录：

```bash
npm run dev:simcut
```

浏览器打开 http://localhost:1421（端口占用时自动换 1422 等）

或一键启动：

```bash
./start-simcut.sh
```

### 桌面端（完整渲染）

```bash
cd simcut/apps/desktop
npm install && npm install --prefix ui
npm run dev
```

需要 Rust ≥ 1.85 和 FFmpeg。

## desound 本地开发

```bash
npm install
npm run dev:web          # Web 端
cd desound/desktop && npm install && npm install --prefix ui && npm run dev  # 桌面端
```

## 目录结构

```text
everec/
├── simcut/           # 视频剪辑（Web SPA + Tauri 桌面）
├── desound/          # 音频创作
├── shared/           # 跨项目共享代码
├── api/              # desound Vercel API（历史）
└── docs/             # 产品文档
```
