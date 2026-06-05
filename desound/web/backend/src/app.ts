import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { searchMusicOnline, parseMediaUrl } from "@everec/shared";
import {
  listSounds,
  getSound,
  getSoundFilePath,
  importBuffer,
  importFile,
  deleteSound,
  downloadHttp,
  downloadWithYtDlp,
  tempDir,
  cleanupTemp,
} from "./library/store";

const app = new Hono().basePath("/api");

app.use("*", cors());

app.onError((err, c) => {
  console.error("[api error]", err);
  return c.json({ error: err.message || "服务器内部错误" }, 500);
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    platform: "web",
    vercel: !!process.env.VERCEL,
    dataDir: process.env.VERCEL ? "/tmp/everec-library" : "data/library",
  }),
);

app.get("/library/sounds", (c) => {
  try {
    return c.json(listSounds());
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.get("/library/sounds/:id", (c) => {
  const sound = getSound(c.req.param("id"));
  if (!sound) return c.json({ error: "not found" }, 404);
  return c.json(sound);
});

app.get("/library/sounds/:id/audio", (c) => {
  try {
    const fp = getSoundFilePath(c.req.param("id"));
    if (!fp) return c.json({ error: "not found" }, 404);
    const ext = path.extname(fp).slice(1).toLowerCase();
    const mime =
      ext === "mp3"
        ? "audio/mpeg"
        : ext === "wav"
          ? "audio/wav"
          : ext === "flac"
            ? "audio/flac"
            : ext === "m4a"
              ? "audio/mp4"
              : "application/octet-stream";
    const data = fs.readFileSync(fp);
    c.header("Content-Type", mime);
    c.header("Accept-Ranges", "bytes");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(data);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/library/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === "string") {
      return c.json({ error: "请上传音频文件" }, 400);
    }
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const original = (file as File).name ?? "upload.mp3";
    const ext = path.extname(original).slice(1).toLowerCase() || "mp3";
    const asset = importBuffer(
      buffer,
      ext,
      path.basename(original, path.extname(original)),
      ["bgm", "upload"],
    );
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/library/import-search", async (c) => {
  const { resultId, title, artist, previewUrl, source } = await c.req.json<{
    resultId: string;
    title: string;
    artist: string;
    previewUrl?: string;
    source: string;
  }>();
  const displayName = `${title} - ${artist}`;
  const tags = ["bgm", "search", source];
  const sourceLabel = `search:${source}`;
  const tmp = tempDir();

  try {
    if (source === "itunes" && previewUrl) {
      const ext = previewUrl.includes(".m4a") ? "m4a" : "mp3";
      const dest = path.join(tmp, `search.${ext}`);
      await downloadHttp(previewUrl, dest);
      return c.json(importFile(dest, displayName, tags, "music", sourceLabel));
    }
    if (source === "netease") {
      const songId = resultId.replace("netease:", "");
      const url = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
      const dest = path.join(tmp, "netease.mp3");
      try {
        await downloadHttp(url, dest, "https://music.163.com/");
        return c.json(importFile(dest, displayName, tags, "music", sourceLabel));
      } catch {
        if (process.env.VERCEL) {
          return c.json({ error: "Vercel 环境暂不支持网易云完整下载，请尝试 iTunes 预览" }, 400);
        }
        const downloaded = downloadWithYtDlp(`https://music.163.com/#/song?id=${songId}`, tmp);
        return c.json(importFile(downloaded, displayName, tags, "music", sourceLabel));
      }
    }
    if (source === "qq") {
      const parts = resultId.split(":");
      const mid = parts[2];
      const pageUrl = mid
        ? `https://y.qq.com/n/ryqq/song/${mid}.html`
        : `https://y.qq.com/n/ryqq/song/${parts[1]}.html`;
      if (process.env.VERCEL) {
        return c.json({ error: "Vercel 环境暂不支持 QQ 音乐下载，请使用桌面端或 iTunes 预览" }, 400);
      }
      const downloaded = downloadWithYtDlp(pageUrl, tmp);
      return c.json(importFile(downloaded, displayName, tags, "music", sourceLabel));
    }
    if (source === "kugou") {
      const parts = resultId.split(":");
      const hash = parts[1];
      const pageUrl = `https://www.kugou.com/song/#hash=${hash}`;
      if (process.env.VERCEL) {
        return c.json({ error: "Vercel 环境暂不支持酷狗音乐下载，请使用桌面端或 iTunes 预览" }, 400);
      }
      const downloaded = downloadWithYtDlp(pageUrl, tmp);
      return c.json(importFile(downloaded, displayName, tags, "music", sourceLabel));
    }
    return c.json({ error: "该歌曲暂无可用音频" }, 400);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});

app.post("/library/import-link", async (c) => {
  const link = await c.req.json<{
    platform: string;
    title: string;
    audioUrl?: string;
    originalUrl: string;
  }>();
  const tags = ["bgm", link.platform];
  const sourceLabel = `link:${link.platform}`;
  const tmp = tempDir();

  try {
    if (link.platform === "bilibili" && link.audioUrl) {
      const ext = link.audioUrl.includes(".m4a") ? "m4a" : "mp3";
      const dest = path.join(tmp, `bilibili.${ext}`);
      await downloadHttp(link.audioUrl, dest, "https://www.bilibili.com");
      return c.json(importFile(dest, link.title, tags, "music", sourceLabel));
    }
    if (process.env.VERCEL) {
      return c.json(
        { error: "Vercel 环境暂不支持抖音/小红书下载，请使用 Bilibili 直链或 iTunes 搜索" },
        400,
      );
    }
    const downloaded = downloadWithYtDlp(link.originalUrl, tmp);
    return c.json(
      importFile(
        downloaded,
        link.title !== "待下载" ? link.title : undefined,
        tags,
        "music",
        sourceLabel,
      ),
    );
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});

app.delete("/library/sounds/:id", (c) => {
  try {
    deleteSound(c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});

app.get("/search/music", async (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? "20");
  try {
    return c.json(await searchMusicOnline(q, limit));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/library/parse-link", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  try {
    return c.json(await parseMediaUrl(url));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

export default app;
