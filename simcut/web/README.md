# Simcut Web

独立网页端，专为浏览器与 Vercel 部署。

```bash
cd simcut/web/frontend
npm install
npm run dev    # http://localhost:1421
npm run build  # 输出 dist/
```

Vercel 构建配置见仓库根目录 `vercel.json`。

与 `simcut/apps/desktop/ui` 共享同一套功能代码；桌面端额外包含 Tauri 与 FFmpeg 渲染。
