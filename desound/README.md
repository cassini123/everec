# Desound

音频创作工作台 — 素材库、拟音、编曲、后期与 AI 声音设计。

## 目录结构

```text
desound/
├── desktop/    # Tauri 桌面客户端
└── web/        # Web 端（Vercel 部署）
    ├── frontend/
    └── backend/
```

## 本地开发

### 桌面端

```bash
cd desound/desktop
npm install
npm install --prefix ui
npm run dev
```

### Web 端

```bash
# 在仓库根目录
npm install
npm run dev:web
```
