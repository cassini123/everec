# Simcut

轻量剪辑软件 — 对标剪映，但更稳定、渲染更快。专为超短篇创作设计。

**更清晰的文件管理 · 更简单的色彩设计 · 更快捷的结项**

## 功能

- 多语言自动字幕识别（中/英/日/韩）
- 色彩解析（上传照片 → 自适应 LUT）
- 静帧管理
- 简单特效预设（渐隐、渐显、高亮等）
- 自定义字体设计界面
- AI 解析（ISO / 曝光 / 灯光参数 + Prompt 剪辑）
- 导出渲染 → 保存相册 + 上传网盘

## 技术栈

- **桌面端**：Tauri 2 + Rust
- **前端**：React 19 + TypeScript + Vite + Tailwind CSS 4
- **渲染**：FFmpeg
- **网页端**：同一 UI 构建为静态 SPA

## 快速开始

> **首次使用请先克隆仓库并切换到 simcut 分支**（simcut 目前在 `cursor/simcut-init-f20e`，尚未合并到 main）

```bash
# 1. 克隆仓库（若已有 everec 目录可跳过）
git clone https://github.com/cassini123/everec.git
cd everec

# 2. 拉取 simcut 分支
git fetch origin cursor/simcut-init-f20e
git checkout cursor/simcut-init-f20e

# 3. 进入 UI 目录（必须在 everec 仓库根目录下执行）
cd simcut/apps/desktop/ui
npm install
npm run dev
```

访问 http://localhost:1421

**常见错误：** 若 `cd simcut/...` 报 `no such file or directory`，说明当前目录不是 everec 仓库根目录，或尚未 checkout simcut 分支。

支持：创建项目、导入视频、预览播放、色彩分析、字幕、静帧、导出项目包（localStorage + IndexedDB 本地存储）

### 桌面端（完整渲染 + 相册/网盘）

```bash
cd simcut/apps/desktop
npm install
npm install --prefix ui
npm run dev
```

需要 Rust ≥ 1.85 和 FFmpeg

### Rust 构建

```bash
cd simcut
cargo build
```

## 项目结构

```
simcut/
├── crates/
│   ├── timeline-engine/   # 时间轴与项目管理
│   └── color-engine/      # 色彩分析与 LUT
├── apps/
│   └── desktop/           # Tauri 应用
│       ├── src/           # Rust 后端
│       └── ui/            # React 前端
└── docs/
    └── PRD.md             # 产品需求文档
```

## 与 desound 的关系

`simcut` 与 `desound` 是同级独立应用，同属 Everec 生态：

- **desound** — 音频 / 音效 / 音乐创作
- **simcut** — 视频轻量剪辑
