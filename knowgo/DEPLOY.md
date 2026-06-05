# Knowgo · Vercel 部署

Knowgo 与 Desound **独立部署**，使用同一 GitHub 仓库、不同 Vercel 项目。

## 一次性配置

1. 打开 [Vercel Dashboard](https://vercel.com/new)
2. **Import** 仓库 `cassini123/everec`（或你的 fork）
3. 展开 **Root Directory** → 设为 **`knowgo`**
4. Framework Preset 选 **Other**（或留空，由 `knowgo/vercel.json` 控制）
5. 点击 **Deploy**

无需改 Build / Output 命令，`knowgo/vercel.json` 已配置：

- Install: `cd .. && npm install`
- Build: `cd .. && npm run build:vercel-knowgo`
- Output: `web/frontend/dist`
- API: `knowgo/api/index.js`（Serverless）

## 部署后验证

```bash
curl https://<你的域名>/api/knowgo/health
# {"ok":true,"product":"knowgo","graphStore":"json",...}
```

浏览器打开 `https://<你的域名>/` 即可使用 Knowgo Web 端。

## 与 Desound 的区别

| 项目 | Vercel Root Directory | 域名示例 |
|------|----------------------|----------|
| Desound | 仓库根 `/` | everec.vercel.app |
| Knowgo | `knowgo` | knowgo-xxx.vercel.app |

## 数据说明

Vercel 无持久磁盘，项目与图谱数据写在 **`/tmp`**，冷启动或实例回收后会重置。生产持久化需接 Vercel KV / Postgres 或 Everec Brain（后续）。

## 本地模拟 Vercel 构建

```bash
# 在仓库根目录
npm install
npm run build:vercel-knowgo
```
