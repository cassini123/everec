# Everec

创作者认知增强系统 — Creative OS monorepo。

## 目录结构

```text
everec/
├── desound/          # 音频创作工作台（已实现）
│   ├── desktop/      # Tauri 桌面客户端
│   └── web/          # Web 端
├── simcut/           # AI 视频剪辑工作台（占位，待实现）
├── shared/           # 跨项目共享代码
├── api/              # Vercel 部署入口
└── docs/             # 产品文档
```

## 本地开发

```bash
# 安装依赖
npm install

# Web 端
npm run dev:web

# 桌面端
cd desound/desktop && npm install && npm install --prefix ui && npm run dev
```
