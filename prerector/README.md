# Prerector

协作制片工具 — Everec Creative OS 的多人协作模块。

> 与 `simcut/`、`desound/` 同级；实现 Graph 导出/import 协作预留（见 [docs/PRD.md](../docs/PRD.md) §5.10）。

## 核心能力

| 模块 | 说明 |
|------|------|
| **自动拆解 / 任务分配** | 支持视频、音频、设计、开发、营销、通用等类型；可输入自定义任务列表 |
| **难度 / 时间评估** | 基于任务内容、项目类型与规模估算难度 (1–5) 与工时；自定义任务实时预览 |
| **协作人员小组** | 创建导演/剪辑/调色/声音等角色小组，支持一键重新平衡工作量 |
| **视频文件同步** | 代理优先策略：先同步 proxy 与时间轴，原始素材后台传输 |
| **时间提醒** | 任务截止、审片节点与交付里程碑提醒 |

## 目录结构

```text
prerector/
├── README.md
└── web/
    ├── frontend/     # React 19 + Vite UI
    └── backend/      # Hono API
```

## 本地开发

```bash
# 在仓库根目录
npm install

# 启动 Prerector（API :3002 + UI :1421）
npm run dev:prerector
```

浏览器打开 http://localhost:1421

## API 概览

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/dashboard` | GET | 协作总览统计 |
| `/api/tasks/decompose` | POST | Brief / 自定义任务拆解 |
| `/api/tasks/assess` | POST | 单任务难度与工时评估 |
| `/api/teams` | GET/POST | 协作小组 |
| `/api/sync` | GET/POST | 视频同步会话 |
| `/api/reminders` | GET/POST | 时间提醒 |

## 与其他模块的关系

- **Simcut**：接收 Project Graph 导出，协作审片与任务跟踪
- **Desound**：音效/混音任务可对接 desound 工作流
- **Project Graph**（计划）：Graph JSON export/import 作为协作数据交换格式

## 技术栈

- React 19 + TypeScript + Tailwind v4
- Hono API + JSON 持久化
- 共享类型 `@everec/shared`
