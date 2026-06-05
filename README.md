# Everec

创作者认知增强系统 — Creative OS monorepo。

## 目录结构

```text
everec/
├── desound/          # 音频创作工作台（已实现）
│   ├── desktop/      # Tauri 桌面客户端（UI 在 desktop/ui）
│   └── web/          # Web 端
├── simcut/           # AI 视频剪辑（占位，尚未实现）
├── prerector/        # 协作制片工具（Web 端）
│   └── web/          # 任务拆解 / 小组 / 同步 / 提醒
├── shared/           # 跨项目共享代码
├── api/              # Vercel 部署入口
└── docs/             # 产品文档
```

## 本地开发

```bash
# 安装依赖（在仓库根目录）
npm install

# Web 端
npm run dev:web

# Prerector 协作制片
npm run dev:prerector

# 桌面端（正确路径）
cd desound/desktop && npm install && npm install --prefix ui && npm run dev
```

## 常见路径错误

| 错误路径 | 正确路径 |
|---------|---------|
| `simcut/apps/desktop/ui` | 不存在，simcut 尚未开发 |
| `desound/apps/desktop` | `desound/desktop` |

Web 预览：https://everec.vercel.app/
