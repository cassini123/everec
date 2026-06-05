# Simcut

轻量剪辑软件 — 对标剪映，但更稳定、渲染更快。专为超短篇创作设计。

**更清晰的文件管理 · 更简单的色彩设计 · 更快捷的结项**

## 功能

- 多语言自动字幕识别（中/英/日/韩）
- 色彩解析（上传照片 → 波形匹配 LUT）
- 静帧管理
- 文字模块（字幕 / 字体 / 文字设计）
- 简单特效预设
- AI 解析
- 导出渲染

## Web 端（浏览器 / Vercel）

独立网页端：

```bash
cd simcut/web/frontend
npm install
npm run dev
```

访问 http://localhost:1421

支持：创建项目、导入视频/图片、预览播放、色彩分析、字幕、静帧、本地存储（localStorage + IndexedDB）

**Vercel 部署**：根目录 `vercel.json` 指向 `simcut/web/frontend`，推送 `main` 分支自动上线。

桌面 UI 源码在 `simcut/apps/desktop/ui`（含 Tauri 集成）。

## 桌面端

```bash
cd simcut/apps/desktop
npm install && npm install --prefix ui
npm run dev
```

需要 Rust ≥ 1.85 和 FFmpeg。

## 项目结构

```
simcut/
├── crates/
│   ├── timeline-engine/
│   └── color-engine/
├── apps/
│   └── desktop/
│       ├── src/       # Rust 后端
│       └── ui/        # React Web / 桌面 UI
└── docs/
    └── PRD.md
```
