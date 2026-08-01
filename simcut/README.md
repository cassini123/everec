# Simcut

轻量剪辑软件 — 对标剪映，但更稳定、渲染更快。专为超短篇创作设计。

## 核心功能（v0.2）

| 功能 | 说明 |
|------|------|
| **素材库** | 导入视频 / 图片 / 音频（MP4、MOV、JPG、PNG、MP3、WAV） |
| **时间轴剪辑** | 多轨拖放拼接、拖拽移动、裁切时长、Delete 删除片段 |
| **音轨** | 独立音频轨，拖入 BGM/配音，导出时自动混音 |
| **字幕** | 自动识别（示例）+ 手动添加/编辑，预览叠加，导出烧录 |
| **渲染导出** | FFmpeg 管线，MP4/MOV/WebM，720p/1080p/4K/竖屏 |

## 桌面端（推荐 · Win / Mac）

```bash
# 前置依赖
# macOS:  brew install ffmpeg rust node
# Windows: 安装 FFmpeg 并加入 PATH，安装 Rust + Node.js

cd simcut/apps/desktop
npm install && npm install --prefix ui
npm run dev          # 开发模式
npm run build        # 打包安装包（.msi / .dmg / .app）
```

打包产物在 `simcut/apps/desktop/src-tauri/target/release/bundle/`（Tauri 2 可能在 `target/release/bundle/`）。

### 使用流程

1. 启动 App → **新建项目**
2. 进入 **剪辑** → 点击 **导入素材**（支持多选）
3. 从素材库拖到时间轴，或直接在轨道上拖放定位
4. 音频素材拖到 **音频轨**；在 **文字 → 字幕** 添加字幕
5. 底部 **导出** → 选择格式/分辨率 → **开始渲染**
6. 渲染完成后点击 **打开导出文件夹**

项目与素材保存在本地（`~/Library/Application Support/com.simcut.app/simcut` on macOS）。

## Web 端（浏览器预览）

```bash
cd simcut/web/frontend
npm install && npm run dev
# http://localhost:1421
```

Web 端支持完整剪辑 UI 与本地存储；**完整 FFmpeg 渲染请使用桌面端**。

## 项目结构

```
simcut/
├── crates/
│   ├── timeline-engine/    # 时间轴、项目图谱
│   └── color-engine/       # 色彩分析、LUT
├── apps/desktop/           # Tauri 2 桌面 App
│   ├── src/                # Rust：导入、FFmpeg 渲染
│   └── ui/                 # React 剪辑界面
└── web/frontend/           # 网页版（同源 UI）
```
