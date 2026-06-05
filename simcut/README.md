# Simcut

AI 视频剪辑工作台 — Everec Creative OS 的核心桌面产品。

> 当前为项目占位目录，实现见 [docs/PRD.md](../docs/PRD.md) §5.3。

## 规划能力

- MP4 导入与时间轴编辑
- 字幕与导出
- Prompt 可控剪辑（EditPlan JSON）
- 与 Inspibrary、Project Graph 集成

## 技术栈（计划）

- Tauri 2 + React 19 + TypeScript
- FFmpeg（`media-indexer`）
- `project-graph`、`timeline-engine` crates
