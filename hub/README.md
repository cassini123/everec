# Everec 主脑 (Hub)

Creative OS 中央启动器 — 统筹 Knowgo、Simcut、desound 等全部应用，类似 Adobe Creative Cloud。

## 本地开发

```bash
npm install
npm run dev:hub
# http://localhost:1400
```

配合各子应用同时运行时，建议端口：

| 应用 | 端口 |
|------|------|
| **主脑** | 1400 |
| desound | 1420 |
| Knowgo | 1421 |
| Simcut | 1422 |

```bash
npm run dev:hub      # 主脑
npm run dev:knowgo   # Knowgo
npm run dev:simcut   # Simcut
npm run dev:web      # desound
```

## 功能

- **首页** — 应用网格、创作闭环、最近项目
- **应用** — Knowgo、Simcut、desound、Inspibrary、Prerector 等产品入口
- **项目** — 跨应用项目创建与浏览
- **主脑** — Project Graph / Style Dataset 认知层概览
- **设置** — 开发地址与启动命令
