# Everec

创作者认知增强系统 — Creative OS monorepo。

## 目录结构

```text
everec/
├── desound/          # 音频创作工作台（已实现）
│   ├── desktop/      # Tauri 桌面客户端（UI 在 desktop/ui）
│   └── web/          # Web 端
├── knowgo/           # 视觉灵感认知工作台（已实现 Web 端）
│   └── web/          # frontend + backend
├── simcut/           # AI 视频剪辑（占位，尚未实现）
├── shared/           # 跨项目共享代码
├── api/              # Vercel 部署入口
└── docs/             # 产品文档
```

## 本地开发

```bash
# 安装依赖（在仓库根目录）
npm install

# Desound Web 端
npm run dev:web

# Knowgo Web 端
npm run dev:knowgo
# 前端 http://localhost:1421 · 后端 http://localhost:3002

# 桌面端（正确路径）
cd desound/desktop && npm install && npm install --prefix ui && npm run dev
```

## 常见路径错误

| 错误路径 | 正确路径 |
|---------|---------|
| `simcut/apps/desktop/ui` | 不存在，simcut 尚未开发 |
| `desound/apps/desktop` | `desound/desktop` |

Web 预览：https://everec.vercel.app/
