# Hypit — Everec 爆款克隆工作流

词锚点视频工作流工作台。丢进一条爆款结构（或一段描述），得到可编辑、可复跑的构图源码：镜头、字幕、B-roll、特效都绑在词上，而不是秒上。换主持、换产品、换语言，结构留下。

灵感来自开源项目 [hypit-ai/hypit](https://github.com/hypit-ai/hypit)。本目录是 Everec 内的 Web 工作台，不是对上游仓库的源码拷贝，也不调用其渲染集群。

## 能力

- 三种可克隆结构：UGC 排行、播客切片、街头采访
- 左侧工作流源码，右侧 9:16 实时预览（karaoke 字幕 / 排行板 / 分屏 / 揭晓板）
- 同一工作流一键套用三个变体
- 自然语言描述生成新工作流
- 保存到本机；「交到 Simcut」写入 `everec-hypit-handoff`

## 开发

```bash
pnpm --filter @everec/hypit-frontend run dev
# http://localhost:1424
```

门户 iframe：`/apps/hypit/index.html`（开发时代理到 1424）。
