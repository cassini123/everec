import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { searchMusicOnline, parseMediaUrl, resolveMusicAudioUrl, searchSfxOnline, extractMedia } from "@everec/shared";
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

function inferAudioExt(url: string, fileType?: string): string {
  const explicit = fileType?.toLowerCase().replace(/^\./, "");
  if (explicit && /^[a-z0-9]+$/.test(explicit)) return explicit;
  const pathname = url.split("?")[0].split("#")[0];
  const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
  if (match?.[1]) return match[1].toLowerCase();
  return "mp3";
}

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
      "music",
    );
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/library/upload-foley", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === "string") {
      return c.json({ error: "请上传音频文件" }, 400);
    }
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const original = (file as File).name ?? "foley.mp3";
    const ext = path.extname(original).slice(1).toLowerCase() || "mp3";
    const asset = importBuffer(
      buffer,
      ext,
      path.basename(original, path.extname(original)),
      ["foley", "import"],
      "foley",
      "import:foley",
    );
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/library/save-foley-meta", async (c) => {
  const { name, presetId, tags } = await c.req.json<{
    name: string;
    presetId: string;
    tags?: string[];
  }>();
  try {
    const meta = JSON.stringify({ presetId, params: {}, tags: tags ?? [] });
    const buffer = Buffer.from(meta, "utf-8");
    const asset = importBuffer(buffer, "foley.json", name, ["foley", presetId], "foley", `foley:${presetId}`);
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/library/import-search", async (c) => {
  const { resultId, title, artist, previewUrl, source, playBvid } = await c.req.json<{
    resultId: string;
    title: string;
    artist: string;
    previewUrl?: string;
    source: string;
    playBvid?: string;
  }>();
  const displayName = `${title} - ${artist}`;
  const tags = ["bgm", "search", source];
  const sourceLabel = `search:${source}`;
  const tmp = tempDir();

  try {
    if (previewUrl) {
      const ext = previewUrl.includes(".m4a") || previewUrl.includes("m4s") ? "m4a" : "mp3";
      const dest = path.join(tmp, `search.${ext}`);
      await downloadHttp(previewUrl, dest);
      return c.json(importFile(dest, displayName, tags, "music", sourceLabel));
    }

    const resolved = await resolveMusicAudioUrl({
      id: resultId,
      title,
      artist,
      album: "",
      durationMs: 0,
      source,
      previewUrl,
      playBvid,
    });
    const dest = path.join(tmp, `search.${resolved.ext}`);
    await downloadHttp(resolved.url, dest, resolved.referer);
    return c.json(importFile(dest, displayName, tags, "music", sourceLabel));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});

app.get("/search/play", async (c) => {
  const resultId = c.req.query("resultId") ?? "";
  const title = c.req.query("title") ?? "";
  const artist = c.req.query("artist") ?? "";
  const source = c.req.query("source") ?? "";
  const previewUrl = c.req.query("previewUrl") ?? "";

  try {
    const resolved = await resolveMusicAudioUrl({
      id: resultId,
      title,
      artist,
      album: "",
      durationMs: 0,
      source,
      previewUrl: previewUrl || undefined,
    });

    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
    if (resolved.referer) headers.Referer = resolved.referer;
    const upstream = await fetch(resolved.url, { headers, redirect: "follow" });
    if (!upstream.ok) return c.json({ error: `播放失败: HTTP ${upstream.status}` }, 502);

    const contentType = upstream.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (contentType.includes("text/html") || buffer.length < 2048) {
      return c.json({ error: "播放失败: 无法获取有效音频" }, 502);
    }

    c.header("Content-Type", resolved.ext === "mp3" ? "audio/mpeg" : "audio/mp4");
    c.header("Accept-Ranges", "bytes");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(buffer);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/library/import-link", async (c) => {
  const link = await c.req.json<{
    platform: string;
    title: string;
    audioUrl?: string;
    videoUrl?: string;
    downloadUrl?: string;
    referer?: string;
    ext?: string;
    originalUrl: string;
  }>();
  const tags = ["bgm", link.platform];
  const sourceLabel = `link:${link.platform}`;
  const tmp = tempDir();

  try {
    const mediaUrl = link.downloadUrl ?? link.videoUrl ?? link.audioUrl;
    if (mediaUrl?.startsWith("http")) {
      const ext =
        link.ext ??
        (mediaUrl.includes(".mp4") ? "mp4" : mediaUrl.includes(".m4a") ? "m4a" : mediaUrl.includes(".webm") ? "webm" : "mp3");
      const dest = path.join(tmp, `${link.platform}.${ext}`);
      const referer =
        link.referer ??
        (link.platform === "bilibili"
          ? "https://www.bilibili.com"
          : link.platform === "douyin"
            ? "https://www.douyin.com"
            : undefined);
      await downloadHttp(mediaUrl, dest, referer);
      return c.json(importFile(dest, link.title, tags, "music", sourceLabel));
    }
    if (process.env.VERCEL) {
      return c.json({ error: "未能获取可下载的媒体地址，请确认链接有效" }, 400);
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

app.get("/media/proxy", async (c) => {
  const mediaUrl = c.req.query("url");
  const referer = c.req.query("referer");
  if (!mediaUrl?.startsWith("http")) return c.json({ error: "无效 URL" }, 400);
  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (referer) headers.Referer = referer;
    const res = await fetch(mediaUrl, { headers, redirect: "follow" });
    if (!res.ok) return c.json({ error: `下载失败: HTTP ${res.status}` }, 502);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    c.header("Content-Type", contentType);
    c.header("Cache-Control", "public, max-age=300");
    return c.body(buffer);
  } catch (err) {
    return c.json({ error: String(err) }, 502);
  }
});

app.post("/media/extract", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  try {
    return c.json(await extractMedia(url));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
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

app.get("/search/sfx", async (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? "12");
  try {
    return c.json(await searchSfxOnline(q, limit));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/library/import-sfx", async (c) => {
  const { title, previewUrl, source, fileType, referer } = await c.req.json<{
    id: string;
    title: string;
    previewUrl: string;
    source: string;
    fileType?: string;
    referer?: string;
  }>();
  const tmp = tempDir();
  try {
    const ext = inferAudioExt(previewUrl, fileType);
    const dest = path.join(tmp, `sfx.${ext}`);
    await downloadHttp(previewUrl, dest, referer);
    return c.json(
      importFile(dest, title, ["foley", "sfx", source], "foley", `sfx:${source}`),
    );
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
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
