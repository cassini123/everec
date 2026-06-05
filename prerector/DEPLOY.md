# Prerector Vercel 部署

独立 Web 端，与仓库根目录（Simcut）和 `knowgo/` 分离。

## 步骤

1. 打开 [Vercel New Project](https://vercel.com/new)
2. Import 仓库 `cassini123/everec`
3. **Root Directory** 填写 **`prerector`**
4. Deploy（自动读取 `prerector/vercel.json`）

## 验证

```bash
curl -H "X-User-Id: user-me" https://<你的域名>/api/prerector/health
# {"ok":true,"platform":"prerector","module":"collaboration"}
```

## 本地验证构建

在仓库根目录：

```bash
npm install
npm run build:vercel-prerector
```

## 说明

- 前端：`prerector/web/frontend/dist`
- API：`prerector/api/index.js`（构建自 Hono backend）
- Demo 用户：请求头 `X-User-Id: user-me`（前端自动设置）
- Vercel 上数据存 `/tmp/everec-prerector`（无持久化，重启后重置为 seed 数据）
