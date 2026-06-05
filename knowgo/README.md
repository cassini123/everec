# Knowgo

视觉灵感认知工作台 — 项目 Brief、灵感采集、图片/视频风格解析、可编辑文档与风格体系输出。

> Everec Creative OS 同级产品，与 `desound`（音频）、`simcut`（剪辑）并列。

## 核心能力

| 模块 | 功能 |
|------|------|
| **Brief** | 项目 Brief 编辑（客户、目标、受众、交付物） |
| **Capture** | 网页 URL 识别（可复制链接）、图片/视频上传 |
| **Analyze** | 图片解析（艺术风格、实现方法）；视频解析（短片风格、自动镜头切分、分镜表） |
| **Document** | 可编辑灵感文档，支持嵌入图片/视频 |
| **Style** | 整体风格关键词、字体推荐（预览）、海报风格、特效实现参考、相似短片推荐 |
| **Graph** | Project Graph 知识图谱可视化、节点详情、导出 JSON |

## Project Graph

Knowgo 将 Brief、素材、分析、分镜、风格决策写入 **Project Graph**（项目知识图谱）：

- 节点：Project、Brief、Asset、Analysis、Shot、StyleTag、Font、ReferenceFilm 等
- 边：derived_from、evidences、similar_to、implements、constrains 等
- 存储：本地 **SQLite**（`data/knowgo/project-graph.db`）；Vercel / `KNOWGO_GRAPH_STORE=json` 时回退 JSON
- **Style Dataset**：20+ 全局风格 seed，分析时自动 `similar_to` 匹配
- API：`GET /api/knowgo/style-dataset`、`POST /projects/:id/document/from-graph`

## 目录结构

```text
knowgo/
└── web/
    ├── frontend/    # React 19 + Vite + Tailwind
    └── backend/     # Hono REST API
```

## 本地开发

```bash
# 在仓库根目录
npm install
npm run dev:knowgo
```

- 前端：http://localhost:1421
- 后端：http://localhost:3002

可选：在界面中配置 OpenAI API Key 以启用 Vision / 视频语义分析；留空则使用本地启发式分析。

## Vercel 部署（独立 Web 端）

与 Desound 分开部署，详见 **[DEPLOY.md](./DEPLOY.md)**。

```bash
# 本地模拟 Vercel 构建
npm run build:vercel-knowgo   # 在仓库根目录
```

## 技术栈

- React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- Hono 4 后端
- OpenAI Vision（可选）+ 本地 fallback
- 共享类型：`@everec/shared/knowgo`
